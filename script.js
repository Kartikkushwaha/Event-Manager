import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
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

const provider = new GoogleAuthProvider();



//for main page slide animation
const slides = document.querySelectorAll(".slide");

let current = 0;

slides[current].classList.add("active");

setInterval(() => {

    slides[current].classList.remove("active");

    current++;

    if(current >= slides.length){
        current = 0;
    }

    slides[current].classList.add("active");

}, 3000);


document.getElementById("googleBtn")
.addEventListener("click", async (e) => {

    e.preventDefault();

    try {

        const result =
        await signInWithPopup(auth, provider);

        const user = result.user;

        localStorage.setItem(
            "userName",
            user.displayName
        );

        localStorage.setItem(
            "userEmail",
            user.email
        );

        localStorage.setItem(
            "userPhoto",
            user.photoURL || ""
        );
      
      localStorage.setItem(
    "userUID",
    user.uid
);

        window.location.href =
        "dashboard.html";

    }

    catch(error){

        console.error(error);

    }

});



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
