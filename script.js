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

// authentication 
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

// day and night mode 

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

// counting animation for premium look
document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".counter");
    const duration = 2500; // Total counting time in milliseconds (2.5 seconds)

    const startCounting = (counter) => {
        const target = +counter.getAttribute("data-target");
        let startTime = null;

        const updateCount = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;

            // Calculate progress as a percentage from 0.0 to 1.0
            const progress = Math.min(elapsed / duration, 1);

            // Multiply target by the progress percentage
            const currentCount = Math.floor(progress * target);

            counter.innerText = currentCount.toLocaleString() + "+";

            // Continue the animation loop until 100% progress is reached
            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                // Guarantee the exact final number is displayed at the end
                counter.innerText = target.toLocaleString() + "+";
            }
        };

        requestAnimationFrame(updateCount);
    };

    // Optional: Only start counting when the section scrolls into view
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting(entry.target);
                observer.unobserve(entry.target); // Run animation once
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
});