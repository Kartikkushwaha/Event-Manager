@import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
getFirestore,
collection,
addDoc
}
 // temporary ends
import {
  getAuth,
  onAuthStateChanged
}
 
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
// temporary end
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

// temp

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {

    console.log("AUTH USER =", user);

});
// temp
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

        try{

            const eventType =
            document.getElementById("eventType");

            const state =
            document.getElementById("state");

            const category =
            document.getElementById("eventCategory");

            const guestCount =
            document.getElementById("guestCount");

            if(
                document.getElementById("name").value.trim() === ""
            ){
                alert("Please enter event name");
                return;
            }

            if(
                eventType.selectedIndex <= 0 ||
                state.selectedIndex <= 0 ||
                category.selectedIndex <= 0 ||
                guestCount.selectedIndex <= 0
            ){
                alert("Please fill all dropdown fields");
                return;
            }

            const eventData = {

                eventName:
                document.getElementById("name").value,

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

            const uid =
            localStorage.getItem("userUID");

            if(!uid){
                alert("userUID not found");
                return;
            }

            console.log("UID =", uid);
            console.log("EVENT =", eventData);
         // temp
console.log(
    "UID FROM LOCALSTORAGE =",
    localStorage.getItem("userUID")
);
         // temp
            await addDoc(
                collection(
                    db,
                    "users",
                    uid,
                    "events"
                ),
                eventData
            );

            alert("Event Saved!");

            window.location.href =
            "my_events.html";

        }
        catch(error){

            console.error(error);

            alert(
                "Firebase Error:\n\n" +
                error.message
            );

        }

    }
);
