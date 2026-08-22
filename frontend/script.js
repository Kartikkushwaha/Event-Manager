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

// ==========================================
// SPA ROUTING ENGINE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll("[data-view]");
    const views = document.querySelectorAll(".view-section");

    function switchView(targetViewId) {
        views.forEach(view => {
            view.classList.remove("active-view");
        });

        document.querySelectorAll(".nav-links a").forEach(link => {
            link.classList.remove("active-link");
        });

        const targetView = document.getElementById(targetViewId);
        if (targetView) {
            targetView.classList.add("active-view");
        }

        const activeNavLink = document.querySelector(`.nav-links a[data-view="${targetViewId}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add("active-link");
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetViewId = item.getAttribute("data-view");
            if (targetViewId) {
                switchView(targetViewId);
            }
        });
    });
});

// ==========================================
// HERO SLIDE ANIMATION
// ==========================================
const slides = document.querySelectorAll(".slide");
let current = 0;
if (slides.length > 0) {
    slides[current].classList.add("active");
    setInterval(() => {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
    }, 4000);
}

// ==========================================
// AUTHENTICATION
// ==========================================
const googleBtn = document.getElementById("googleBtn");
if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            localStorage.setItem("userName", user.displayName);
            localStorage.setItem("userEmail", user.email);
            localStorage.setItem("userPhoto", user.photoURL || "");
            localStorage.setItem("userUID", user.uid);

            window.location.href = "dashboard.html";
        } catch (error) {
            console.error(error);
        }
    });
}

// ==========================================
// THEME CONTROLLER
// ==========================================
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
});

// ==========================================
// NUMBER COUNTER ANIMATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".counter");
    const duration = 2000; 

    const startCounting = (counter) => {
        const target = +counter.getAttribute("data-target");
        let startTime = null;

        const updateCount = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out quad formula for smoother deceleration
            const easeOutProgress = 1 - (1 - progress) * (1 - progress);
            const currentCount = Math.floor(easeOutProgress * target);

            counter.innerText = currentCount.toLocaleString() + "+";

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                counter.innerText = target.toLocaleString() + "+";
            }
        };
        requestAnimationFrame(updateCount);
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
});