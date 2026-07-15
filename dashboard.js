import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

let currentFirebaseUser = null;
let userKey = ""; // This ensures data is saved uniquely for the logged-in user!

// --- 1. Authentication & Core Data Renderer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentFirebaseUser = user;
        // Create a unique prefix for this specific user (using email or UID)
        userKey = user.email; 
        renderDashboard();
    } else {
        // Redirect to login if not authenticated
        window.location.href = "index.html";
    }
});

function renderDashboard() {
    if (!currentFirebaseUser) return;

    // Retrieve data saved specifically for THIS user email
    const customName = localStorage.getItem(`userName_${userKey}`);
    const customPhoto = localStorage.getItem(`userPhoto_${userKey}`);
    const phone = localStorage.getItem(`userPhone_${userKey}`);
    const address = localStorage.getItem(`userAddress_${userKey}`);

    // HIERARCHY: Custom Saved Value > Google Auth Default > Fallback Text
    const defaultName = currentFirebaseUser.displayName || currentFirebaseUser.email.split('@')[0];
    const finalName = customName || defaultName;
    const finalPhoto = customPhoto || currentFirebaseUser.photoURL;

    // Populate DOM
    document.getElementById("name").textContent = finalName;
    document.getElementById("email").textContent = currentFirebaseUser.email;

    // Profile Picture vs Letter Fallback Logic
    const imgEl = document.getElementById("profilePhoto");
    const letterEl = document.getElementById("profileLetter");

    if (finalPhoto) {
        imgEl.src = finalPhoto;
        imgEl.style.display = "block";
        letterEl.style.display = "none";
    } else {
        // Fallback: First letter of their name/email in the center
        letterEl.textContent = finalName.charAt(0).toUpperCase();
        letterEl.style.display = "flex";
        imgEl.style.display = "none";
    }

    // Optional Fields
    const phoneEl = document.getElementById("phoneDisplay");
    if (phone) {
        phoneEl.textContent = `📞 ${phone}`;
        phoneEl.style.display = "block";
    } else {
        phoneEl.style.display = "none";
    }

    const addressEl = document.getElementById("addressDisplay");
    if (address) {
        addressEl.textContent = `📍 ${address}`;
        addressEl.style.display = "block";
    } else {
        addressEl.style.display = "none";
    }
}

// --- 2. Theme Toggle (Day/Night Mode) ---
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
});

// --- 3. Logout Handler ---
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    // Notice: We NO LONGER call localStorage.clear()! 
    // Your saved photo, phone, and address remain stored in the browser safely tied to your email.
    window.location.href = "index.html";
});

// --- 4. Dynamic Settings Modal & Live Updaters ---
const modal = document.getElementById("settingsModal");
const modalTitle = document.getElementById("modalTitle");
const inputContainer = document.getElementById("inputContainer");
const closeBtn = document.querySelector(".close-btn");
let currentSettingType = "";

document.querySelectorAll(".setting-option").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        currentSettingType = e.target.getAttribute("data-type");
        inputContainer.innerHTML = ""; 

        if (currentSettingType === "photo") {
            modalTitle.textContent = "Upload Profile Photo";
            inputContainer.innerHTML = `<input type="file" id="settingInput" accept="image/*" required>`;
        } else if (currentSettingType === "name") {
            modalTitle.textContent = "Change User Name";
            inputContainer.innerHTML = `<input type="text" id="settingInput" placeholder="Enter new name" required>`;
        } else if (currentSettingType === "phone") {
            modalTitle.textContent = "Save Phone Number";
            inputContainer.innerHTML = `<input type="tel" id="settingInput" placeholder="Enter phone number" required>`;
        } else if (currentSettingType === "address") {
            modalTitle.textContent = "Save Address";
            inputContainer.innerHTML = `<textarea id="settingInput" rows="3" placeholder="Enter your full address" required></textarea>`;
        }

        modal.style.display = "flex";
    });
});

closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});

document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputElement = document.getElementById("settingInput");

    if (currentSettingType === "photo") {
        const file = inputElement.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = function () {
                // Save photo tied specifically to the user's email
                localStorage.setItem(`userPhoto_${userKey}`, reader.result);
                renderDashboard();
                modal.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    } else {
        const value = inputElement.value.trim();
        if (value) {
            // Save settings tied specifically to the user's email
            if (currentSettingType === "name") localStorage.setItem(`userName_${userKey}`, value);
            if (currentSettingType === "phone") localStorage.setItem(`userPhone_${userKey}`, value);
            if (currentSettingType === "address") localStorage.setItem(`userAddress_${userKey}`, value);
            
            renderDashboard(); 
            modal.style.display = "none";
        }
    }
});
