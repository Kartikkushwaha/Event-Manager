import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
getFirestore,
collection,
addDoc
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyDpzCghQIIGbPkySYWTPNXvlcsnzsWoBQM",
  authDomain: "eventease-c0bd9.firebaseapp.com",
  projectId: "eventease-c0bd9",
  storageBucket: "eventease-c0bd9.firebasestorage.app",
  messagingSenderId: "720737113769",
  appId: "1:720737113769:web:3a7fb2f8a4750448347bb8"
};
const app =
initializeApp(firebaseConfig);
const db =
getFirestore(app);
const themeBtn =
document.getElementById(
    "themeToggle"
);
const savedTheme =
localStorage.getItem(
    "theme"
);
if(savedTheme==="dark"){
    document.body.classList.add(
        "dark-mode"
    );
    themeBtn.textContent="☀️";
}
themeBtn.addEventListener(
    "click",
    ()=>{
        document.body.classList.toggle(
            "dark-mode"
        );
        if(
            document.body.classList.contains(
                "dark-mode"
            )
        ){
            localStorage.setItem(
                "theme",
                "dark"
            );
            themeBtn.textContent="☀️";
        }
        else{
            localStorage.setItem(
                "theme",
                "light"
            );
            themeBtn.textContent="🌙";
        }
    }
);
const saveBtn =
document.getElementById("saveBtn");
saveBtn.addEventListener(
    "click",
   async ()=>{
        const eventType =
        document.getElementById(
            "eventType"
        );
        const state =
        document.getElementById(
            "state"
        );
        const category =
        document.getElementById(
            "eventCategory"
        );
        const guestCount =
        document.getElementById(
            "guestCount"
        );
        const eventData = {
            eventName:
            document.getElementById(
                "name"
            ).value,
            eventType:
            eventType.options[
                eventType.selectedIndex
            ].text,
            state:
            state.options[
                state.selectedIndex
            ].text,
            category:
            category.options[
                category.selectedIndex
            ].text,
            guestCount:
            guestCount.options[
                guestCount.selectedIndex
            ].text
        };
        if(
            eventData.eventName.trim()
            === ""
        ){
            alert(
                "Please enter event name"
            );
            return;
        }
        // FIX 3: Validate all dropdowns are selected before attempting to save
        if(
            eventType.selectedIndex === 0 ||
            state.selectedIndex === 0 ||
            category.selectedIndex === 0 ||
            guestCount.selectedIndex === 0
        ){
            alert(
                "Please fill in all fields before saving"
            );
            return;
        }
 // let events =
 //        JSON.parse(
 //            localStorage.getItem(
 //                "events"
 //            )
 //        ) || [];
        
 //  events.push(
 //            eventData
 //        );
 //     localStorage.setItem(
 //            "events",
 //            JSON.stringify(events)
 //        );
            const uid =
            localStorage.getItem(
            "userUID"
            );
            // FIX 4: Guard against missing userUID in localStorage —
            // previously this caused addDoc to silently fail or throw
            // an uncaught error, making the Save button appear broken
            if(!uid){
                alert(
                    "User session not found. Please log in again."
                );
                return;
            }
            // FIX 5: Wrapped addDoc in try/catch so any Firestore error
            // surfaces as a readable alert instead of a silent failure
            try{
                await addDoc(
                collection(
                db,
                "users",
                uid,
                "events"
                ),
                eventData
                );
                alert(
                    "Event Saved!"
                );
                window.location.href =
                "my_events.html";
            }catch(error){
                console.error(
                    "Firestore save failed:",
                    error
                );
                alert(
                    "Failed to save event: " + error.message
                );
            }
    }
);
