import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

// --- Theme Logic ---
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if(savedTheme==="dark"){
    document.body.classList.add("dark-mode");
    themeBtn.textContent="☀️";
}

themeBtn.addEventListener("click", ()=>{
    document.body.classList.toggle("dark-mode");
    if(document.body.classList.contains("dark-mode")){
        localStorage.setItem("theme", "dark");
        themeBtn.textContent="☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeBtn.textContent="🌙";
    }
});

// --- Event Rendering Logic ---
const container = document.getElementById("eventsContainer");
let workingEvents = [];

async function loadEvents(){
    const uid = localStorage.getItem("userUID");
    
    try {
        const snapshot = await getDocs(
            collection(db, "users", uid, "events")
        );

        workingEvents = [];
        snapshot.forEach((docSnap)=>{
            workingEvents.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderEvents();
    } catch (error) {
        console.error("Error fetching events: ", error);
        alert("Failed to load events. Check console for details.");
    }
}

function renderEvents(){
    container.innerHTML = "";

    if(workingEvents.length === 0){
        container.innerHTML = "<h2 style='grid-column: 1/-1; text-align:left;'>No Events Found</h2>";
        return;
    }

    workingEvents.forEach((event)=>{
        const formattedDate = event.date_time 
            ? new Date(event.date_time).toLocaleString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
                hour: "numeric", minute: "2-digit"
            }) 
            : "Not Specified";

        const typeLower = (event.eventType || "").toLowerCase();
        const categoryLower = (event.category || "").toLowerCase();
        
        let specialPersonHTML = "";
        
        if (typeLower.includes("wedding") || typeLower.includes("birthday") || 
            categoryLower.includes("wedding") || categoryLower.includes("birthday")) {
            const personName = event.specialPerson || "Not Specified"; 
            specialPersonHTML = `<p><strong>Special person/Couples:</strong> ${personName}</p>`;
        }

        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
            <h2>${event.eventName}</h2>
            <p><strong>Type:</strong> ${event.eventType}</p>
            <p><strong>Religion:</strong> ${event.relationChoice}</p>
            <p><strong>State:</strong> ${event.state}</p>
            <p><strong>Event:</strong> ${event.category}</p>
            ${specialPersonHTML} 
            <p><strong>Guests:</strong> ${event.guestCount}</p>
            <p><strong>Timeline:</strong> ${formattedDate}</p>
            <p><strong>Budget:</strong> ₹${event.budget}</p>

            <div class="card-buttons">
                <button class="deleteBtn">Delete Event</button>
                <button class="AIbutton">Plan Event with AI</button>
            </div>
        `;

        const deleteBtn = card.querySelector(".deleteBtn");
        const AIbutton = card.querySelector(".AIbutton");

        deleteBtn.addEventListener("click", async ()=>{
            const uid = localStorage.getItem("userUID");
            try {
                await deleteDoc(doc(db, "users", uid, "events", event.id));
                loadEvents(); // Reload the list after deleting
            } catch (error) {
                console.error("Error deleting event:", error);
                alert("Could not delete event.");
            }
        });

        AIbutton.addEventListener("click", () => {
            localStorage.setItem("currentEventId", event.id);
            window.location.href = "../AI_functions_and_APIs/AI_plan.html";
        });
        
        container.appendChild(card);
    });
}

// --- Button Listeners ---
document.getElementById("updateBtn")?.addEventListener("click", ()=>{
    window.location.href = "../dashboard.html";
});

document.getElementById("goToDash")?.addEventListener("click", ()=>{
    window.location.href = "../dashboard.html";
});

document.getElementById("crtMreEvent")?.addEventListener("click", ()=>{
    window.location.href = "dash_dashboard.html";
});

// WAIT FOR AUTHENTICATION TO LOAD EVENTS
onAuthStateChanged(auth, (user) => {
    if (user) {
        localStorage.setItem("userUID", user.uid);
        loadEvents();
    } else {
        container.innerHTML = "<h2 style='text-align:left;'>Please log in to view your events.</h2>";
    }
});

// --- Mobile Sidebar Expand Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const actionSidebar = document.getElementById('actionSidebar');

    if (sidebarToggle && actionSidebar) {
        sidebarToggle.addEventListener('click', () => {
            actionSidebar.classList.toggle('expanded');
        });
    }
});