import { initializeApp }
from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs
}
from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

const auth =
getAuth(app);

const db =
getFirestore(app);


const container =
document.getElementById(
    "eventsContainer"
);

onAuthStateChanged(
    auth,
    async(user)=>{

        if(!user){
            return;
        }

        const snapshot =
        await getDocs(

            collection(
                db,
                "users",
                user.uid,
                "events"
            )

        );

        container.innerHTML="";

        snapshot.forEach(doc=>{

            const event =
            doc.data();

            const card =
            document.createElement(
                "div"
            );

            card.className =
            "event-card";

            card.innerHTML=`

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

            `;

            container.appendChild(
                card
            );

        });

    }
);
