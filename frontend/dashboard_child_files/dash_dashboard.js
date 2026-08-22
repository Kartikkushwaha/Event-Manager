import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDpzCghQIIGbPkySYWTPNXvlcsnzsWoBQM",
    authDomain: "eventease-c0bd9.firebaseapp.com",
    projectId: "eventease-c0bd9",
    storageBucket: "eventease-c0bd9.firebasestorage.app",
    messagingSenderId: "720737113769",
    appId: "1:720737113769:web:3a7fb2f8a4750448347bb8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Theme Toggle Logic ---
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if(savedTheme === "dark"){
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if(document.body.classList.contains("dark-mode")){
        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙";
    }
});

// --- Dynamic Input Logic ---
const eventCategoryDropdown = document.getElementById("eventCategory");
const eventTypeDropdown = document.getElementById("eventType");
const specialPersonGroup = document.getElementById("specialPersonGroup");
const specialPersonInput = document.getElementById("specialPerson");

function checkSpecialPersonVisibility() {
    // Check if a selection exists before reading .text to avoid errors
    const categoryText = eventCategoryDropdown.selectedIndex > 0 
        ? eventCategoryDropdown.options[eventCategoryDropdown.selectedIndex].text.toLowerCase() 
        : "";
        
    const typeText = eventTypeDropdown.selectedIndex > 0 
        ? eventTypeDropdown.options[eventTypeDropdown.selectedIndex].text.toLowerCase() 
        : "";

    // If "wedding" or "birthday" is selected in either dropdown, show the input
    if (categoryText.includes("wedding") || categoryText.includes("birthday") || 
        typeText.includes("wedding") || typeText.includes("birthday")) {
        specialPersonGroup.style.display = "flex";
    } else {
        // Otherwise, hide it and clear the value
        specialPersonGroup.style.display = "none";
        specialPersonInput.value = "";
    }
}

// Listen for changes on both dropdowns
eventCategoryDropdown.addEventListener("change", checkSpecialPersonVisibility);
eventTypeDropdown.addEventListener("change", checkSpecialPersonVisibility);


// --- Save Button Logic ---
const saveBtn = document.getElementById("saveBtn");

saveBtn.addEventListener("click", async () => {
    try {
        const eventType = document.getElementById("eventType");
        const relchose = document.getElementById("relchose");
        const state = document.getElementById("state");
        const category = document.getElementById("eventCategory");
        const guestCount = document.getElementById("guestCount");
        const eventName = document.getElementById("name").value.trim();
        const dateTime = document.getElementById("date_time").value.trim();
        const budget = document.getElementById("budget").value.trim();

        // Validations
        if (eventName === "") {
            alert("Please enter an event name");
            return;
        }
        if (dateTime === "") {
            alert("Please choose date and time of Event");
            return;
        }
        if (budget === "") {
            alert("Please Enter the budget of the Event");
            return;
        }
        
        // If the special person field is visible, ensure they filled it out (Optional validation)
        if (specialPersonGroup.style.display === "flex" && specialPersonInput.value.trim() === "") {
            alert("Please enter the name of the Special Person / Couple");
            return;
        }

        if (eventType.selectedIndex <= 0 || relchose.selectedIndex <= 0 || 
            state.selectedIndex <= 0 || category.selectedIndex <= 0 || 
            guestCount.selectedIndex <= 0) {
            alert("Please fill all dropdown fields");
            return;
        }

        // Build the data object
        const eventData = {
            eventName: eventName,
            eventType: eventType.options[eventType.selectedIndex].text,
            relationChoice: relchose.options[relchose.selectedIndex].text,
            state: state.options[state.selectedIndex].text,
            category: category.options[category.selectedIndex].text,
            guestCount: guestCount.options[guestCount.selectedIndex].text,
            date_time: dateTime,
            budget: budget,
            // Grab the special person name. If hidden, it will save as an empty string.
            specialPerson: specialPersonInput.value.trim() 
        };

        const uid = localStorage.getItem("userUID");

        if(!uid){
            alert("userUID not found. Please log in.");
            return;
        }

        console.log("UID =", uid);
        console.log("EVENT =", eventData);

        await addDoc(collection(db, "users", uid, "events"), eventData);

        alert("Event Saved Successfully!");
        window.location.href = "my_events.html";

    } catch(error) {
        console.error(error);
        alert("Firebase Error:\n\n" + error.message);
    }
});
