import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
        import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
        // IMPORT arrayRemove added here
        import { getFirestore, collection, addDoc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
            html += `<div>${data.text}</div><span class="time">${timeString}</span>`;
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

        document.getElementById('file-attachment').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                // Placeholder logic - requires Firebase Storage setup
                alert(`You selected: ${file.name}.\n\nTo complete this feature, integrate Firebase Storage to upload 'file' and append the returned downloadURL to your message payload!`);
                e.target.value = ''; // Reset input
            }
        });

        // 6. CREATE COMMUNITY
        document.getElementById('btn-create-community').addEventListener('click', () => {
            document.getElementById('modal-create').classList.remove('hidden');
        });

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
                    createdAt: serverTimestamp()
                });
                await setDoc(doc(db, "referral_codes", code), { is_used: false, community_id: commRef.id });
                
                closeModals();
                document.getElementById('create-comm-name').value = '';
                document.getElementById('create-comm-code').value = '';
            } catch (error) { console.error(error); alert("Error creating community."); }
        });

        // 7. JOIN COMMUNITY VIA REFERRAL CODE
        document.getElementById('btn-join-community').addEventListener('click', () => {
            document.getElementById('modal-join').classList.remove('hidden');
        });

        document.getElementById('submit-join-comm').addEventListener('click', async () => {
            const code = document.getElementById('join-comm-code').value.trim();
            if (!code) return alert("Enter a referral code.");

            try {
                const codeDoc = await getDoc(doc(db, "referral_codes", code));
                if (!codeDoc.exists()) {
                    return alert("Invalid referral code.");
                }

                const commId = codeDoc.data().community_id;
                
                await updateDoc(doc(db, "communities", commId), {
                    members: arrayUnion(currentUser.email)
                });
                
                await setDoc(doc(db, "allowed_users", currentUser.email), { role: "joined_member" }, { merge: true });

                alert("Successfully joined the community!");
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

        // 9. VIEW MEMBERS & ADMIN BADGE
        document.getElementById('btn-view-members').addEventListener('click', async () => {
            const listContainer = document.getElementById('member-list-container');
            listContainer.innerHTML = 'Loading...';
            document.getElementById('modal-members').classList.remove('hidden');

            try {
                const commDoc = await getDoc(doc(db, "communities", activeCommunityId));
                const data = commDoc.data();
                const emails = data.members || [];
                const ownerEmail = data.ownerEmail; 
                const isCurrentUserAdmin = currentUser.email === ownerEmail;
                
                listContainer.innerHTML = '';
                emails.forEach(email => {
                    const name = email.split('@')[0];
                    const isAdmin = email === ownerEmail;
                    const adminBadge = isAdmin ? '<span class="admin-badge">Admin</span>' : '';
                    
                    // Show remove button only if current user is admin, and the target is not the admin
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
