import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signOut
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
const name =
localStorage.getItem("userName");

const email =
localStorage.getItem("userEmail");
if(!email){

    window.location.href =
    "index.html";

}

const photo =
localStorage.getItem("userPhoto");

document.getElementById("name")
.textContent = name;

document.getElementById("email")
.textContent = email;

if(photo){

    const img =
    document.getElementById(
        "profilePhoto"
    );

    img.src = photo;

    img.style.display = "block";

}

else{

    document.getElementById(
        "profileLetter"
    ).textContent =
    name.charAt(0).toUpperCase();

}

document
.getElementById("logoutBtn")
.addEventListener("click", async () => {

    await signOut(auth);

    localStorage.clear();

    window.location.href =
    "index.html";

});



