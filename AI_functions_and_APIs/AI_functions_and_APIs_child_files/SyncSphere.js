 // Import Firebase v10 Modular SDK from CDN
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

        // Your specific EventEase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDpzCghQIIGbPkySYWTPNXvlcsnzsWoBQM",
            authDomain: "eventease-c0bd9.firebaseapp.com",
            projectId: "eventease-c0bd9",
            storageBucket: "eventease-c0bd9.firebasestorage.app",
            messagingSenderId: "720737113769",
            appId: "1:720737113769:web:3a7fb2f8a4750448347bb8"
        };

        // Initialize Services
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const provider = new GoogleAuthProvider();

        // UI Elements
        const loginScreen = document.getElementById('login-screen');
        const referralScreen = document.getElementById('referral-screen');
        const chatScreen = document.getElementById('chat-screen');
        let currentUser = null;

        // --- NAVIGATION HELPER ---
        function showScreen(screen) {
            loginScreen.classList.add('hidden');
            referralScreen.classList.add('hidden');
            chatScreen.classList.add('hidden');
            screen.classList.remove('hidden');
        }

        // --- ONBOARDING LOGIC ---
        async function checkUserAccess(user) {
            currentUser = user;
            const uid = user.uid;
            const email = user.email;

            try {
                // 1. Check if they are already registered
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists() && userDoc.data().is_authorized) {
                    // REDIRECT TO NEW PAGE
                    window.location.href = "SyncSphere_community.html";
                    return;
                }

                // 2. Check whitelist
                const whitelistDoc = await getDoc(doc(db, "allowed_users", email));
                if (whitelistDoc.exists()) {
                    await setDoc(doc(db, "users", uid), {
                        email: email,
                        displayName: user.displayName,
                        is_authorized: true,
                        joinedVia: "whitelist",
                        timestamp: new Date()
                    });
                    // REDIRECT TO NEW PAGE
                    window.location.href = "SyncSphere_community.html";
                    return;
                }

                // 3. If neither, show referral screen
                showScreen(referralScreen);

            } catch (error) {
                console.error("Error checking access:", error);
                alert("Database permission denied. Have you set up Firestore Rules?");
            }
        }

        // --- REFERRAL CODE LOGIC ---
        // --- REFERRAL CODE LOGIC ---
        document.getElementById('submit-referral-btn').addEventListener('click', async () => {
            const code = document.getElementById('referral-input').value.trim();
            if (!code) return alert("Please enter a code.");

            try {
                const codeRef = doc(db, "referral_codes", code);
                const codeSnap = await getDoc(codeRef);

                if (!codeSnap.exists()) return alert("Invalid code.");
                if (codeSnap.data().is_used) return alert("Code already claimed.");

                await updateDoc(codeRef, { is_used: true, claimedBy: currentUser.email });
                await setDoc(doc(db, "users", currentUser.uid), {
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    is_authorized: true,
                    joinedVia: "referral",
                    timestamp: new Date()
                });

                // REDIRECT TO NEW PAGE
                window.location.href = "community_chat.html";

            } catch (error) {
                console.error("Referral Error:", error);
                alert("Error validating code. Check console.");
            }
        });

        // --- AUTHENTICATION TRIGGERS ---
        document.getElementById('login-btn').addEventListener('click', () => {
            signInWithPopup(auth, provider).catch(error => console.error("Login failed", error));
        });

        const handleLogout = () => signOut(auth).then(() => showScreen(loginScreen));
        document.getElementById('logout-btn-1').addEventListener('click', handleLogout);
        document.getElementById('logout-btn-2').addEventListener('click', handleLogout);

        // --- GLOBAL AUTH LISTENER ---
        onAuthStateChanged(auth, (user) => {
            if (user) {
                checkUserAccess(user); // Triggers the gatekeeper
            } else {
                showScreen(loginScreen); // Resets to login
            }
        });

