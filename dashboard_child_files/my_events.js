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

            const card =
            document.createElement(
                "div"
            );

            card.className =
            "event-card";

            card.innerHTML = `

                <h2>
                ${event.eventName}
                </h2>

                <p>
                Type:
                ${event.eventType}
                </p>

                <p>
                State:
                ${event.state}
                </p>

                <p>
                Event:
                ${event.category}
                </p>

                <p>
                Guests:
                ${event.guestCount}
                </p>

                <button
                class="deleteBtn">
                Delete Event
                </button>
            `;

            const deleteBtn =
            card.querySelector(
                ".deleteBtn"
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

            container.appendChild(
                card
            );

        }
    );

}

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

loadEvents();
