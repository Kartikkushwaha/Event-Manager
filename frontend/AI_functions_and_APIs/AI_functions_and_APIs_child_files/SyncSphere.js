import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage, ref } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

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
let unsubscribeCommunity = null; 

// Elements
const commList = document.getElementById('community-list');
const chatMessages = document.getElementById('chat-messages');
const chatTitle = document.getElementById('chat-title');
const chatActions = document.getElementById('chat-actions');
const chatInputArea = document.getElementById('chat-input-area');
const messageInput = document.getElementById('message-input');
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileActionsBtn = document.getElementById('mobile-actions-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// -----------------------------------------
// UI, LAYOUT & THEME LOGIC
// -----------------------------------------
mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
});

// Mobile Actions Menu Toggle Logic
if (mobileActionsBtn) {
    mobileActionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatActions.classList.toggle('show-menu');
    });
}

// Close mobile actions menu when clicking outside
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && chatActions && !chatActions.contains(e.target) && !mobileActionsBtn.contains(e.target)) {
        chatActions.classList.remove('show-menu');
    }
});

window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
}

messageInput.addEventListener('focus', () => {
    setTimeout(() => { if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight; }, 300);
});

// Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
const bodyElement = document.body;
if (localStorage.getItem('theme') === 'dark') {
    bodyElement.classList.add('dark-mode');
    themeToggle.innerText = '☀️';
}
themeToggle.addEventListener('click', () => {
    bodyElement.classList.toggle('dark-mode');
    if (bodyElement.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerText = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.innerText = '🌙';
    }
});

// -----------------------------------------
// 1. AUTH & INIT
// -----------------------------------------
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('user-greeting').innerText = user.displayName || user.email.split('@')[0];
        loadSidebarCommunities();
    } else {
        window.location.href = "index.html"; 
    }
});

// -----------------------------------------
// 2. LOAD SIDEBAR COMMUNITIES
// -----------------------------------------
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

// -----------------------------------------
// 3. SELECT A COMMUNITY & DETECT DELETION
// -----------------------------------------
function selectCommunity(commId, commData) {
    activeCommunityId = commId;
    chatTitle.innerText = commData.name;
    
    chatActions.classList.remove('hidden');
    if (mobileActionsBtn) mobileActionsBtn.classList.remove('hidden');
    chatInputArea.classList.remove('hidden');
    
    document.querySelectorAll('.community-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const deleteBtn = document.getElementById('btn-delete-comm');
    const leaveBtn = document.getElementById('btn-leave-comm');
    
    // Admin checking logic
    if (currentUser.uid === commData.ownerId) {
        deleteBtn.classList.remove('hidden');
        leaveBtn.classList.add('hidden'); // Admin cannot leave, must delete
        deleteBtn.dataset.referralCode = commData.referralCode; 
    } else {
        deleteBtn.classList.add('hidden');
        leaveBtn.classList.remove('hidden'); // Members can leave
    }
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        chatActions.classList.remove('show-menu'); 
    }

    if (unsubscribeCommunity) unsubscribeCommunity();
    unsubscribeCommunity = onSnapshot(doc(db, "communities", commId), (docSnap) => {
        if (!docSnap.exists()) {
            alert("This community has been deleted by the admin.");
            window.location.reload(); 
        }
    });

    // Load Messages
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

// -----------------------------------------
// 4. RENDER MESSAGE
// -----------------------------------------
function renderMessage(docId, data) {
    const isSentByMe = data.uid === currentUser.uid;
    const div = document.createElement('div');
    div.className = `message ${isSentByMe ? 'sent' : 'received'}`;

    let timeString = data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    let html = !isSentByMe ? `<div class="sender-name">${data.senderName}</div>` : '';

    if (data.text) { html += `<div>${data.text}</div>`; }
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

// -----------------------------------------
// 5. SEND MESSAGE
// -----------------------------------------
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

messageInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') document.getElementById('send-btn').click(); 
});

// -----------------------------------------
// 6. CREATE COMMUNITY
// -----------------------------------------
document.getElementById('btn-create-community').addEventListener('click', () => {
    document.getElementById('modal-create').classList.remove('hidden');
});

document.getElementById('submit-create-comm').addEventListener('click', async () => {
    const name = document.getElementById('create-comm-name').value.trim();
    const code = document.getElementById('create-comm-code').value.trim();
    if (!name || !code) return alert("Fill all fields.");

    try {
        const codeDoc = await getDoc(doc(db, "referral_codes", code));
        if (codeDoc.exists()) {
            alert("Already in use. Please create a unique referral code!");
            return; 
        }

        const commRef = await addDoc(collection(db, "communities"), {
            name: name,
            ownerId: currentUser.uid,
            ownerEmail: currentUser.email,
            referralCode: code,
            members: [currentUser.email], 
            pendingMembers: [],
            createdAt: serverTimestamp()
        });
        
        await setDoc(doc(db, "referral_codes", code), { is_used: false, community_id: commRef.id });
        
        closeModals();
        document.getElementById('create-comm-name').value = '';
        document.getElementById('create-comm-code').value = '';
    } catch (error) { console.error(error); alert("Error creating community."); }
});

// -----------------------------------------
// 7. JOIN COMMUNITY
// -----------------------------------------
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
            pendingMembers: arrayUnion(currentUser.email)
        });
        
        alert("Join request sent! The admin must approve your request before you can chat.");
        closeModals();
        document.getElementById('join-comm-code').value = '';
    } catch (error) { console.error(error); alert("Error joining community."); }
});

// -----------------------------------------
// 8. ADD MEMBER DIRECTLY (WITH DUPLICATION CHECK)
// -----------------------------------------
document.getElementById('btn-add-member').addEventListener('click', () => {
    document.getElementById('modal-add').classList.remove('hidden');
    if(window.innerWidth <= 768) chatActions.classList.remove('show-menu');
});

document.getElementById('submit-add-member').addEventListener('click', async () => {
    const email = document.getElementById('add-member-email').value.trim();
    if (!email) return alert("Enter an email address.");

    try {
        // Fetch current community state to check for duplicates
        const commDoc = await getDoc(doc(db, "communities", activeCommunityId));
        if (commDoc.exists()) {
            const data = commDoc.data();
            // Check if already a member
            if (data.members && data.members.includes(email)) {
                return alert("This user is already a member of the community.");
            }
            // Check if request is already pending
            if (data.pendingMembers && data.pendingMembers.includes(email)) {
                return alert("This user already has a pending join request.");
            }
        }

        await updateDoc(doc(db, "communities", activeCommunityId), {
            members: arrayUnion(email)
        });
        await setDoc(doc(db, "allowed_users", email), { role: "invited_member" }, { merge: true });
        
        alert(`${email} has been added!`);
        closeModals();
        document.getElementById('add-member-email').value = '';
    } catch (error) { console.error(error); alert("Error adding member."); }
});

// -----------------------------------------
// 9. MEMBER MANAGEMENT
// -----------------------------------------
document.getElementById('btn-view-members').addEventListener('click', async () => {
    const listContainer = document.getElementById('member-list-container');
    listContainer.innerHTML = 'Loading...';
    document.getElementById('modal-members').classList.remove('hidden');
    
    if(window.innerWidth <= 768) chatActions.classList.remove('show-menu');

    try {
        const commDoc = await getDoc(doc(db, "communities", activeCommunityId));
        const data = commDoc.data();
        const emails = data.members || [];
        const pendingEmails = data.pendingMembers || [];
        const ownerEmail = data.ownerEmail; 
        const isCurrentUserAdmin = currentUser.email === ownerEmail;
        
        listContainer.innerHTML = '';

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

window.approveMember = async (memberEmail) => {
    try {
        await updateDoc(doc(db, "communities", activeCommunityId), {
            pendingMembers: arrayRemove(memberEmail),
            members: arrayUnion(memberEmail)
        });
        await setDoc(doc(db, "allowed_users", memberEmail), { role: "joined_member" }, { merge: true });
        document.getElementById('btn-view-members').click(); 
    } catch (error) { console.error(error); alert("Error approving member."); }
};

window.rejectMember = async (memberEmail) => {
    if(confirm(`Are you sure you want to reject ${memberEmail}'s request?`)) {
        try {
            await updateDoc(doc(db, "communities", activeCommunityId), {
                pendingMembers: arrayRemove(memberEmail)
            });
            document.getElementById('btn-view-members').click(); 
        } catch (error) { console.error(error); alert("Error rejecting member."); }
    }
};

window.removeCommunityMember = async (memberEmail) => {
    if(confirm(`Are you sure you want to remove ${memberEmail} from this community?`)) {
        try {
            await updateDoc(doc(db, "communities", activeCommunityId), {
                members: arrayRemove(memberEmail)
            });
            document.getElementById('btn-view-members').click();
        } catch (error) { console.error(error); alert("Error removing member."); }
    }
};

// -----------------------------------------
// 10. DELETE ENTIRE COMMUNITY (DEEP WIPE)
// -----------------------------------------
document.getElementById('btn-delete-comm').addEventListener('click', async (event) => {
    if(window.innerWidth <= 768) chatActions.classList.remove('show-menu');
    
    if (confirm("Are you sure you want to completely delete this community? This will permanently erase all messages and data for everyone.")) {
        
        const deleteBtn = event.target;
        const originalText = deleteBtn.innerText;
        deleteBtn.innerText = "Deleting...";
        deleteBtn.disabled = true;

        try {
            const codeToDelete = deleteBtn.dataset.referralCode;
            if (codeToDelete) {
                await deleteDoc(doc(db, "referral_codes", codeToDelete));
            }

            const messagesQuery = query(collection(db, `communities/${activeCommunityId}/messages`));
            const querySnapshot = await getDocs(messagesQuery);
            
            const deletePromises = [];
            querySnapshot.forEach((docSnap) => {
                deletePromises.push(deleteDoc(doc(db, `communities/${activeCommunityId}/messages`, docSnap.id)));
            });
            
            await Promise.all(deletePromises);
            await deleteDoc(doc(db, "communities", activeCommunityId));
            
        } catch (error) {
            console.error(error); 
            alert("Error deleting community data. Check console for details.");
            deleteBtn.innerText = originalText;
            deleteBtn.disabled = false;
        }
    }
});

// -----------------------------------------
// 11. LEAVE COMMUNITY
// -----------------------------------------
const leaveCommBtn = document.getElementById('btn-leave-comm');
if (leaveCommBtn) {
    leaveCommBtn.addEventListener('click', async () => {
        if (!activeCommunityId) return;
        if(window.innerWidth <= 768) chatActions.classList.remove('show-menu');

        if (confirm("Are you sure you want to leave this community? You will need to request access again if you wish to rejoin.")) {
            try {
                await updateDoc(doc(db, "communities", activeCommunityId), {
                    members: arrayRemove(currentUser.email)
                });

                alert("You have left the community.");

                if (unsubscribeMessages) unsubscribeMessages();
                if (unsubscribeCommunity) unsubscribeCommunity();

                activeCommunityId = null;
                chatTitle.innerText = "Select a Community";
                chatActions.classList.add('hidden');
                chatActions.classList.remove('show-menu');
                if (mobileActionsBtn) mobileActionsBtn.classList.add('hidden');
                chatInputArea.classList.add('hidden');
                chatMessages.innerHTML = '';

            } catch (error) {
                console.error("Error leaving community:", error);
                alert("Failed to leave the community. Check console for details.");
            }
        }
    });
}