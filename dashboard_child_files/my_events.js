import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
getFirestore,
collection,
getDocs,
deleteDoc,
doc
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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


const container =
document.getElementById(
    "eventsContainer"
);

let workingEvents = [];

async function loadEvents(){

    const uid =
    localStorage.getItem(
        "userUID"
    );

    const snapshot =
    await getDocs(
        collection(
            db,
            "users",
            uid,
            "events"
        )
    );

    workingEvents = [];

    snapshot.forEach(
        (docSnap)=>{

            workingEvents.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        }
    );

    renderEvents();
}

function renderEvents(){

    container.innerHTML = "";

    if(
        workingEvents.length===0
    ){

        container.innerHTML =
        "<h2>No Events Found</h2>";

        return;
    }

workingEvents.forEach(
    (event)=>{

        const formattedDate =
event.date_time
? new Date(event.date_time)
    .toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    )
: "Not Specified";

        const card =
        document.createElement(
            "div"
        );

        card.className =
        "event-card";

        card.innerHTML = `

            <h2>${event.eventName}</h2>

            <p>Type: ${event.eventType}</p>

            <p>Religion: ${event.relationChoice}</p>

            <p>State: ${event.state}</p>

            <p>Event: ${event.category}</p>

            <p>Guests: ${event.guestCount}</p>

            <p>Timeline: ${formattedDate}</p>

            <button class="deleteBtn">
            Delete Event
            </button>

            <button class="AIbutton">
            Plan Event with AI
            </button>
        `;

        const deleteBtn =
        card.querySelector(
            ".deleteBtn"
        );

      const AIbutton =
        card.querySelector(
            ".AIbutton"
        );

        deleteBtn
        .addEventListener(
            "click",
            async ()=>{

                const uid =
                localStorage.getItem(
                    "userUID"
                );

                await deleteDoc(
                    doc(
                        db,
                        "users",
                        uid,
                        "events",
                        event.id
                    )
                );

                loadEvents();

            }
        );

      AIbutton.addEventListener(
            "click",
            () => {
                window.location.href = "Event-Manager/AI functions and APIs/AI_plan.html";
            }
        );

        container.appendChild(
            card
        );

    }
);


}
// Update button
document
.getElementById(
    "updateBtn"
)
.addEventListener(
    "click",
    ()=>{

        window.location.href =
        "../dashboard.html";

    }
);
// Go to Dashboard button
document
.getElementById(
    "goToDash"
)
.addEventListener(
    "click",
    ()=>{

        window.location.href =
        "../dashboard.html";

    }
);

// Create more Events button

document
.getElementById(
    "crtMreEvent"
)
.addEventListener(
    "click",
    ()=>{

        window.location.href =
        "dash_dashboard.html";

    }
);


loadEvents();
