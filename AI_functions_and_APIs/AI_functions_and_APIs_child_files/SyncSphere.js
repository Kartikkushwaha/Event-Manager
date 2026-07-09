import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
        // IMPORT arrayRemove added here
import { getFirestore, collection, addDoc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDpzCghQIIGbPkySYWTPNXvlcsnzsWoBQM",
            authDomain: "eventease-c0bd9.firebaseapp.com",
            projectId: "eventease-c0bd9",
            storageBucket: "eventease-c0bd9.firebasestorage.app",
            messagingSenderId: "720737113769",
            appId: "1:720737113769:web:3a7fb2f8a4750448347bb8"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);

        let currentUser = null;
        let activeCommunityId = null; 
        let unsubscribeMessages = null; 

        // Elements
        const commList = document.getElementById('community-list');
        const chatMessages = document.getElementById('chat-messages');
        const chatTitle = document.getElementById('chat-title');
        const chatActions = document.getElementById('chat-actions');
        const chatInputArea = document.getElementById('chat-input-area');
        const messageInput = document.getElementById('message-input');
        
        // Mobile Sidebar Elements
        const sidebar = document.getElementById('sidebar');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        // Mobile Sidebar Logic
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });

        window.closeModals = () => {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        }

        // 1. AUTH & INIT
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                document.getElementById('user-greeting').innerText = user.displayName || user.email.split('@')[0];
                loadSidebarCommunities();
            } else {
                window.location.href = "index.html"; 
            }
        });

        // 2. LOAD SIDEBAR COMMUNITIES
        function loadSidebarCommunities() {
            const q = query(collection(db, "communities"), where("members", "array-contains", currentUser.email));
            
            onSnapshot(q, (snapshot) => {
                commList.innerHTML = '';
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const div = document.createElement('div');
                    div.className = `community-item ${activeCommunityId === docSnap.id ? 'active' : ''}`;
                    div.innerHTML = `
                        <div class="community-avatar">${data.name.charAt(0)}</div>
                        <div>
                            <div style="font-weight: bold; color: #111b21;">${data.name}</div>
                            <div style="font-size: 12px; color: #10b981; font-weight: 500;">Code: ${data.referralCode}</div>
                        </div>
                    `;
                    div.onclick = () => selectCommunity(docSnap.id, data);
                    commList.appendChild(div);
                });
            });
        }

        // 3. SELECT A COMMUNITY
        function selectCommunity(commId, commData) {
            activeCommunityId = commId;
            chatTitle.innerText = commData.name;
            
            chatActions.classList.remove('hidden');
            chatInputArea.classList.remove('hidden');
            
            document.querySelectorAll('.community-item').forEach(el => el.classList.remove('active'));
            event.currentTarget.classList.add('active');

            const deleteBtn = document.getElementById('btn-delete-comm');
            if (currentUser.uid === commData.ownerId) {
                deleteBtn.classList.remove('hidden');
            } else {
                deleteBtn.classList.add('hidden');
            }
            
            // Auto-close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            }

            if (unsubscribeMessages) unsubscribeMessages();

            const q = query(collection(db, `communities/${commId}/messages`), orderBy("timestamp", "asc"));
            
            unsubscribeMessages = onSnapshot(q, (snapshot) => {
                chatMessages.innerHTML = ''; 
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.deletedBy && data.deletedBy.includes(currentUser.uid)) return; 
                    renderMessage(docSnap.id, data);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }

        // 4. RENDER MESSAGE
       function renderMessage(docId, data) {
    const isSentByMe = data.uid === currentUser.uid;
    const div = document.createElement('div');
    div.className = `message ${isSentByMe ? 'sent' : 'received'}`;

    let timeString = data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    let html = !isSentByMe ? `<div class="sender-name">${data.senderName}</div>` : '';
    
    // --- NEW LOGIC: Handle Attachments ---
    if (data.attachmentUrl) {
        if (data.attachmentType && data.attachmentType.startsWith('image/')) {
            // Display Image
            html += `<img src="${data.attachmentUrl}" alt="attachment" style="max-width: 100%; border-radius: 8px; margin-bottom: 5px; display: block;">`;
        } else if (data.attachmentType && data.attachmentType.startsWith('video/')) {
            // Display Video
            html += `<video src="${data.attachmentUrl}" controls style="max-width: 100%; border-radius: 8px; margin-bottom: 5px; display: block;"></video>`;
        } else {
            // Display generic file link
            html += `<a href="${data.attachmentUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; display: block; margin-bottom: 5px;">📎 ${data.attachmentName || 'Download File'}</a>`;
        }
    }

    // Handle standard text
    if (data.text) {
        html += `<div>${data.text}</div>`;
    }
    
    html += `<span class="time">${timeString}</span>`;
    div.innerHTML = html;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-msg-btn';
    deleteBtn.innerText = 'Delete';
    deleteBtn.onclick = async () => {
        await updateDoc(doc(db, `communities/${activeCommunityId}/messages`, docId), {
            deletedBy: arrayUnion(currentUser.uid) 
        });
    };
    
    div.appendChild(deleteBtn);
    chatMessages.appendChild(div);
}

        // 5. SEND MESSAGE & FILE ATTACHMENT LOGIC
        document.getElementById('send-btn').addEventListener('click', async () => {
            if (!activeCommunityId) return;
            const text = messageInput.value.trim();
            if (text === '') return;
            messageInput.value = ''; 

            await addDoc(collection(db, `communities/${activeCommunityId}/messages`), {
                text: text,
                uid: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email.split('@')[0],
                timestamp: serverTimestamp()
            });
        });
        messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('send-btn').click(); });

        // Attachment triggers
        document.getElementById('attach-btn').addEventListener('click', () => {
            document.getElementById('file-attachment').click();
        });

       document.getElementById('file-attachment').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !activeCommunityId) return;

    // Temporarily change the button icon to show it's uploading
    const attachBtn = document.getElementById('attach-btn');
    attachBtn.innerText = '⏳';
    attachBtn.disabled = true;

    try {
        // 1. Create a reference in Firebase Storage (organize by community)
        const storageRef = ref(storage, `communities/${activeCommunityId}/attachments/${Date.now()}_${file.name}`);
        
        // 2. Upload the file to Storage
        const snapshot = await uploadBytes(storageRef, file);
        
        // 3. Get the public URL for the uploaded file
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // 4. Save the message to Firestore with the attachment data
        await addDoc(collection(db, `communities/${activeCommunityId}/messages`), {
            text: "", // Optional: You could add logic to grab text from the input box here
            attachmentUrl: downloadURL,
            attachmentType: file.type, 
            attachmentName: file.name,
            uid: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: serverTimestamp()
        });
        
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload file. Check console for details.");
    } finally {
        // Reset the input and button
        e.target.value = '';
        attachBtn.innerText = '📎';
        attachBtn.disabled = false;
    }
});

        // 6. CREATE COMMUNITY
        document.getElementById('submit-create-comm').addEventListener('click', async () => {
            const name = document.getElementById('create-comm-name').value.trim();
            const code = document.getElementById('create-comm-code').value.trim();
            if (!name || !code) return alert("Fill all fields.");

            try {
                const commRef = await addDoc(collection(db, "communities"), {
                    name: name,
                    ownerId: currentUser.uid,
                    ownerEmail: currentUser.email,
                    referralCode: code,
                    members: [currentUser.email], 
                    pendingMembers: [], // <-- ADD THIS LINE
                    createdAt: serverTimestamp()
                });
                await setDoc(doc(db, "referral_codes", code), { is_used: false, community_id: commRef.id });
                
                closeModals();
                document.getElementById('create-comm-name').value = '';
                document.getElementById('create-comm-code').value = '';
            } catch (error) { console.error(error); alert("Error creating community."); }
        });

       // 7. JOIN COMMUNITY VIA REFERRAL CODE
        document.getElementById('submit-join-comm').addEventListener('click', async () => {
            const code = document.getElementById('join-comm-code').value.trim();
            if (!code) return alert("Enter a referral code.");

            try {
                const codeDoc = await getDoc(doc(db, "referral_codes", code));
                if (!codeDoc.exists()) {
                    return alert("Invalid referral code.");
                }

                const commId = codeDoc.data().community_id;
                
                // ADD TO PENDING INSTEAD OF MEMBERS
                await updateDoc(doc(db, "communities", commId), {
                    pendingMembers: arrayUnion(currentUser.email)
                });
                
                alert("Join request sent! The admin must approve your request before you can chat.");
                closeModals();
                document.getElementById('join-comm-code').value = '';
            } catch (error) { console.error(error); alert("Error joining community."); }
        });

        // 8. ADD MEMBER TO ACTIVE COMMUNITY
        document.getElementById('btn-add-member').addEventListener('click', () => {
            document.getElementById('modal-add').classList.remove('hidden');
        });

        document.getElementById('submit-add-member').addEventListener('click', async () => {
            const email = document.getElementById('add-member-email').value.trim();
            if (!email) return alert("Enter an email address.");

            try {
                await updateDoc(doc(db, "communities", activeCommunityId), {
                    members: arrayUnion(email)
                });
                await setDoc(doc(db, "allowed_users", email), { role: "invited_member" }, { merge: true });
                
                alert(`${email} has been added!`);
                closeModals();
                document.getElementById('add-member-email').value = '';
            } catch (error) { console.error(error); alert("Error adding member."); }
        });

        // Global function to remove member from database
        window.removeCommunityMember = async (memberEmail) => {
            if(confirm(`Are you sure you want to remove ${memberEmail} from this community?`)) {
                try {
                    await updateDoc(doc(db, "communities", activeCommunityId), {
                        members: arrayRemove(memberEmail)
                    });
                    // Refresh the modal view
                    document.getElementById('btn-view-members').click();
                } catch (error) {
                    console.error(error);
                    alert("Error removing member.");
                }
            }
        };

// Global functions to handle approvals/rejections
        window.approveMember = async (memberEmail) => {
            try {
                // Remove from pending and add to active members
                await updateDoc(doc(db, "communities", activeCommunityId), {
                    pendingMembers: arrayRemove(memberEmail),
                    members: arrayUnion(memberEmail)
                });
                
                // Add role permission (Moved here from the original join logic)
                await setDoc(doc(db, "allowed_users", memberEmail), { role: "joined_member" }, { merge: true });
                
                // Refresh the list view
                document.getElementById('btn-view-members').click(); 
            } catch (error) {
                console.error(error);
                alert("Error approving member.");
            }
        };

        window.rejectMember = async (memberEmail) => {
            if(confirm(`Are you sure you want to reject ${memberEmail}'s request?`)) {
                try {
                    // Just remove from pending
                    await updateDoc(doc(db, "communities", activeCommunityId), {
                        pendingMembers: arrayRemove(memberEmail)
                    });
                    
                    // Refresh the list view
                    document.getElementById('btn-view-members').click(); 
                } catch (error) {
                    console.error(error);
                    alert("Error rejecting member.");
                }
            }
        };
       // 9. VIEW MEMBERS & ADMIN BADGE
        document.getElementById('btn-view-members').addEventListener('click', async () => {
            const listContainer = document.getElementById('member-list-container');
            listContainer.innerHTML = 'Loading...';
            document.getElementById('modal-members').classList.remove('hidden');

            try {
                const commDoc = await getDoc(doc(db, "communities", activeCommunityId));
                const data = commDoc.data();
                const emails = data.members || [];
                const pendingEmails = data.pendingMembers || [];
                const ownerEmail = data.ownerEmail; 
                const isCurrentUserAdmin = currentUser.email === ownerEmail;
                
                listContainer.innerHTML = '';

                // --- PENDING MEMBERS LIST (Only visible to admin) ---
                if (isCurrentUserAdmin && pendingEmails.length > 0) {
                    listContainer.innerHTML += `<div class="pending-heading">Pending Requests</div>`;
                    
                    pendingEmails.forEach(email => {
                        const name = email.split('@')[0];
                        listContainer.innerHTML += `
                            <div class="member-list-item pending-item">
                                <strong>${name}</strong>
                                <button class="btn-reject" onclick="rejectMember('${email}')">Reject</button>
                                <button class="btn-approve" onclick="approveMember('${email}')">Approve</button>
                                <span class="email">${email}</span>
                            </div>
                        `;
                    });
                    listContainer.innerHTML += `<div class="pending-heading" style="color:#111b21; border-top:2px solid #eee; margin-top: 10px; padding-top:10px;">Current Members</div>`;
                }

                // --- APPROVED MEMBERS LIST ---
                emails.forEach(email => {
                    const name = email.split('@')[0];
                    const isAdmin = email === ownerEmail;
                    const adminBadge = isAdmin ? '<span class="admin-badge">Admin</span>' : '';
                    
                    const removeBtnHtml = (isCurrentUserAdmin && !isAdmin) 
                        ? `<button class="remove-member-btn" onclick="removeCommunityMember('${email}')">Remove</button>` 
                        : '';
                    
                    listContainer.innerHTML += `
                        <div class="member-list-item">
                            <strong>${name}</strong> ${adminBadge}
                            ${removeBtnHtml}
                            <span class="email">${email}</span>
                        </div>
                    `;
                });
            } catch (error) { console.error(error); listContainer.innerHTML = 'Error loading members.'; }
        });

        // 10. DELETE ENTIRE COMMUNITY
        document.getElementById('btn-delete-comm').addEventListener('click', async () => {
            if (confirm("Are you sure you want to delete this community? This will permanently remove it for all members.")) {
                try {
                    await deleteDoc(doc(db, "communities", activeCommunityId));
                    
                    chatTitle.innerText = "Select a Community";
                    chatActions.classList.add('hidden');
                    chatInputArea.classList.add('hidden');
                    chatMessages.innerHTML = '<div style="text-align: center; color: #667781; margin-top: 20vh;">Community deleted. Select another to start chatting.</div>';
                    activeCommunityId = null;
                } catch (error) {
                    console.error(error); alert("Error deleting community. Check your permissions.");
                }
            }
        });
