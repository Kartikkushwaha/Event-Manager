import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
// 1. ADD THE AUTH IMPORT
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
// 2. INITIALIZE AUTH
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
        container.innerHTML = "<h2>No Events Found</h2>";
        return;
    }

    workingEvents.forEach((event)=>{
        const formattedDate = event.date_time 
            ? new Date(event.date_time).toLocaleString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
                hour: "numeric", minute: "2-digit"
            }) 
            : "Not Specified";

        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
            <h2>${event.eventName}</h2>
            <p>Type: ${event.eventType}</p>
            <p>Religion: ${event.relationChoice}</p>
            <p>State: ${event.state}</p>
            <p>Event: ${event.category}</p>
            <p>Guests: ${event.guestCount}</p>
            <p>Timeline: ${formattedDate}</p>
            <p>Budget: ${event.budget}</p>

            <button class="deleteBtn">Delete Event</button>
            <button class="AIbutton">Plan Event with AI</button>
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

// 3. WAIT FOR AUTHENTICATION TO LOAD EVENTS
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in securely, safe to fetch data!
        // We also ensure the local storage UID matches the actual secure user session
        localStorage.setItem("userUID", user.uid);
        loadEvents();
    } else {
        // User is not logged in, redirect them or show an error
        container.innerHTML = "<h2>Please log in to view your events.</h2>";
    }
});
