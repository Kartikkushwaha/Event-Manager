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


document.getElementById("loginbtn")
.addEventListener("click", async (e) => {

    e.preventDefault();

    try {

        const result =
        await signInWithPopup(auth, provider);

        const user = result.user;

        alert(
          `Welcome ${user.displayName}`
        );

        console.log(user);

    } catch(error) {

        console.error(error);

        alert("Login Failed");

    }

});


document.getElementById("signupbtn")
.addEventListener("click", async (e) => {

    e.preventDefault();

    try {

        const result =
        await signInWithPopup(auth, provider);

        const user = result.user;

        alert(
          `Account Created: ${user.displayName}`
        );

        console.log(user);

    } catch(error) {

        console.error(error);

        alert("Signup Failed");

    }

});


