// import { initializeApp }
// from
// "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

// import {
//     getAuth,
//     onAuthStateChanged
// }
// from
// "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// import {
//     getFirestore,
//     collection,
//     getDocs
// }
// from
// "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyDpzCghQIIGbPkySYWTPNXvlcsnzsWoBQM",
//   authDomain: "eventease-c0bd9.firebaseapp.com",
//   projectId: "eventease-c0bd9",
//   storageBucket: "eventease-c0bd9.firebasestorage.app",
//   messagingSenderId: "720737113769",
//   appId: "1:720737113769:web:3a7fb2f8a4750448347bb8"
// };

// const app =
// initializeApp(firebaseConfig);

// const auth =
// getAuth(app);

// const db =
// getFirestore(app);


const container =
document.getElementById(
    "eventsContainer"
);

// onAuthStateChanged(
//     auth,
//     async(user)=>{
    let events =
    JSON.parse(
        localStorage.getItem(
            "events"
        )
    ) || [];

    let workingEvents =
[...events];
        // if(!user){
        //     return;
        // }

function renderEvents(){
        // const snapshot =
        // await getDocs(
container.innerHTML = "";
            // collection(
            //     db,
            //     "users",
            //     user.uid,
            //     "events"
            // )
 if(
        workingEvents.length===0
    ){
        // );

         container.innerHTML =
        "<h2>No Events Found</h2>";

           return;
    }
 workingEvents.forEach(
        (event,index)=>{

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
                ()=>{

                    workingEvents.splice(
                        index,
                        1
                    );

                    renderEvents();

                }
            );

            container
            .appendChild(card);

        }
    );

}

renderEvents();

document
.getElementById(
    "updateBtn"
)
.addEventListener(
    "click",
    ()=>{

        localStorage.setItem(
            "events",
            JSON.stringify(
                workingEvents
            )
        );

        alert(
            "Changes Updated!"
        );
         window.location.href =
        "../dashboard.html";
        

    }
);
