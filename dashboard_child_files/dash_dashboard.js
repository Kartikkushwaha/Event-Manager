import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
getFirestore,
collection,
addDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
getAuth,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDpzCghQIIGbPkySYWTPNXvlcsnzsWoBQM",
  authDomain: "eventease-c0bd9.firebaseapp.com",
  projectId: "eventease-c0bd9",
  storageBucket: "eventease-c0bd9.firebasestorage.app",
  messagingSenderId: "720737113769",
  appId: "1:720737113769:web:3a7fb2f8a4750448347bb8"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

// ── Theme toggle ──────────────────────────────────────────────
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙";
    }
});

// ── Save button ───────────────────────────────────────────────
const saveBtn = document.getElementById("saveBtn");

saveBtn.addEventListener("click", async () => {

    // Read all fields
    const nameEl      = document.getElementById("name");
    const eventType   = document.getElementById("eventType");
    const stateEl     = document.getElementById("state");
    const category    = document.getElementById("eventCategory");
    const guestCount  = document.getElementById("guestCount");

    const eventData = {
        eventName:  nameEl.value.trim(),
        eventType:  eventType.value,
        state:      stateEl.value,
        category:   category.value,
        guestCount: guestCount.value
    };

    // ── Validation ────────────────────────────────────────────
    if (!eventData.eventName) {
        alert("Please enter the event name.");
        return;
    }
    if (!eventData.eventType) {
        alert("Please choose the type of event.");
        return;
    }
    if (!eventData.state) {
        alert("Please choose your state.");
        return;
    }
    if (!eventData.category) {
        alert("Please choose the event category.");
        return;
    }
    if (!eventData.guestCount) {
        alert("Please choose the number of invitations.");
        return;
    }

    // ── Resolve UID: prefer live auth, fall back to localStorage ──
    // FIX: Instead of ONLY relying on localStorage (which may be empty
    //      if the login page didn't set it), we now read the live
    //      Firebase Auth user first. This is the primary reason the
    //      save was silently failing for most users.
    let uid = null;

    const currentUser = auth.currentUser;
    if (currentUser) {
        uid = currentUser.uid;
        // Keep localStorage in sync for other pages that read it
        localStorage.setItem("userUID", uid);
    } else {
        // Fall back to localStorage (set by your login page)
        uid = localStorage.getItem("userUID");
    }

    if (!uid) {
        alert("You are not logged in. Please log in first.");
        // Optionally redirect: window.location.href = "login.html";
        return;
    }

    // ── Save to Firestore ─────────────────────────────────────
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";

    try {
        await addDoc(
            collection(db, "users", uid, "events"),
            eventData
        );
        alert("Event Saved!");
        window.location.href = "my_events.html";
    } catch (error) {
        console.error("Firestore save failed:", error);
        alert("Failed to save event:\n" + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
    }
});
