// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

let currentUserUid = null;
let fetchedGuestList = []; 

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        try {
            const userDocRef = doc(db, "users", currentUserUid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.guests && Array.isArray(data.guests)) {
                    fetchedGuestList = data.guests;
                }
            }
        } catch (error) {}
    } else {
        currentUserUid = null;
        fetchedGuestList = [];
    }
});

// ==========================================
// 2. THEME & UI LOGIC
// ==========================================
const themeBtn = document.getElementById('themeToggle');
const root = document.documentElement;

const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  root.setAttribute('data-theme', 'dark');
  themeBtn.textContent = '☀️';
}

themeBtn.addEventListener('click', () => {
  let theme = root.getAttribute('data-theme');
  if (theme === 'dark') {
    root.removeAttribute('data-theme');
    themeBtn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
    themeBtn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            navLinks.classList.toggle('active-menu');
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active-menu') && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active-menu');
            }
        });
    }
});

const slider = document.getElementById('carousel');
let isDown = false, startX, startY, scrollLeft, scrollTop, isDragging = false; 

slider.addEventListener('mousedown', (e) => {
  isDown = true;
  isDragging = false; 
  startX = e.pageX - slider.offsetLeft;
  startY = e.pageY - slider.offsetTop;
  scrollLeft = slider.scrollLeft;
  scrollTop = slider.scrollTop;
});
slider.addEventListener('mouseleave', () => isDown = false);
slider.addEventListener('mouseup', (e) => {
  isDown = false;
  if (isDragging) {
    const card = e.target.closest('.card');
    if (card) {
      card.style.pointerEvents = 'none';
      setTimeout(() => card.style.pointerEvents = 'auto', 50);
    }
  }
});

slider.addEventListener('mousemove', (e) => {
  if (!isDown) return; 
  e.preventDefault(); 
  isDragging = true; 
  
  if (window.innerWidth > 900) {
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5; 
      slider.scrollLeft = scrollLeft - walk;
  } else {
      const y = e.pageY - slider.offsetTop;
      const walk = (y - startY) * 1.5;
      slider.scrollTop = scrollTop - walk;
  }
});

// ==========================================
// 3. FULL TEMPLATE DATABASE
// ==========================================
const templates = {
    // --- BIRTHDAY ---
    "bd_1": {
        name: "BD 1", src: "bd_1.png", 
        fields: [
            { id: "birthName", label: "Birthday Person", x: 795, y: 735, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 802, y: 1004, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "ageMilestone", label: "Age or Milestone", x: 850, y: 1274, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 865, y: 1545, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "location", label: "Location", x: 789, y: 1817, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "rsvp", label: "RSVP Info", x: 750, y: 2085, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "bd_2": {
        name: "BD 2", src: "bd_2.png",
        fields: [
            { id: "birthName", label: "Birthday Person", x: 993, y: 645, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 772, y: 772, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "ageMilestone", label: "Age or Milestone", x: 847, y: 898, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 758, y: 1026, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "location", label: "Location", x: 600, y: 1154, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "rsvp", label: "RSVP Info", x: 650, y: 1289, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "bd_9": {
        name: "BD 9", src: "bd_9.png",
        fields: [
            { id: "birthName", label: "Birthday Person", x: 795, y: 881, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 795, y: 1110, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "ageMilestone", label: "Age or Milestone", x: 795, y: 1339, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 795, y: 1568, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "location", label: "Location", x: 795, y: 1796, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "rsvp", label: "RSVP Info", x: 795, y: 2025, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    
    // --- BABY SHOWER ---
    "bs_1": {
        name: "BS 1", src: "bs_1.png", 
        fields: [
            { id: "f1", label: "Detail 1", x: 943, y: 1100, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 811, y: 1244, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 875, y: 1390, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 723, y: 1532, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 763, y: 1676, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 768, y: 1821, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "bs_3": {
        name: "BS 3", src: "bs_3.png", 
        fields: [
            { id: "f1", label: "Detail 1", x: 876, y: 604, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 736, y: 695, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f3", label: "Detail 3", x: 801, y: 789, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f4", label: "Detail 4", x: 639, y: 880, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f5", label: "Detail 5", x: 685, y: 973, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f6", label: "Detail 6", x: 687, y: 1062, font: "bold 60px Arial", color: "#000000", align: "center" }
        ]
    },
    "bs_12": {
        name: "BS 12", src: "bs_12.png", 
        fields: [
            { id: "f1", label: "Detail 1", x: 905, y: 494, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 796, y: 574, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f3", label: "Detail 3", x: 849, y: 653, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f4", label: "Detail 4", x: 713, y: 729, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f5", label: "Detail 5", x: 758, y: 809, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f6", label: "Detail 6", x: 761, y: 885, font: "bold 60px Arial", color: "#000000", align: "center" }
        ]
    },

    // --- FAREWELL ---
    "fare_1": {
        name: "Fare 1", src: "fare_1.jpeg",
        fields: [
            { id: "f1", label: "Detail 1", x: 440, y: 573, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 505, y: 692, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 428, y: 816, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 445, y: 963, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 505, y: 1084, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 600, y: 1214, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 543, y: 1308, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "fare_2": {
        name: "Fare 2", src: "fare_2.jpeg",
        fields: [
            { id: "f1", label: "Detail 1", x: 364, y: 521, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 411, y: 618, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 356, y: 774, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 368, y: 920, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 318, y: 1059, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 523, y: 1192, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 466, y: 1294, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "fare_3": {
        name: "Fare 3", src: "fare_3.jpeg",
        fields: [
            { id: "f1", label: "Detail 1", x: 408, y: 582, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 468, y: 691, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 405, y: 803, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 420, y: 945, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 363, y: 1083, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 561, y: 1215, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 521, y: 1288, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "fare_4": {
        name: "Fare 4", src: "fare_4.jpeg",
        fields: [
            { id: "f1", label: "Detail 1", x: 416, y: 585, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 469, y: 667, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 411, y: 807, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 411, y: 839, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 411, y: 870, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 425, y: 962, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 454, y: 995, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f8", label: "Detail 8", x: 383, y: 1082, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 580, y: 1210, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 519, y: 1288, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "fare_5": {
        name: "Fare 5", src: "fare_5.jpeg",
        fields: [
            { id: "f1", label: "Detail 1", x: 392, y: 559, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 437, y: 660, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 359, y: 806, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 359, y: 840, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 359, y: 875, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 375, y: 964, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 404, y: 1001, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f8", label: "Detail 8", x: 344, y: 1089, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 539, y: 1214, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 497, y: 1297, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "fare_6": {
        name: "Fare 6", src: "fare_6.jpeg",
        fields: [
            { id: "f1", label: "Detail 1", x: 425, y: 551, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 465, y: 660, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 409, y: 790, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 409, y: 822, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 409, y: 856, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 423, y: 952, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 453, y: 986, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f8", label: "Detail 8", x: 385, y: 1074, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 583, y: 1202, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 517, y: 1286, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },

    // --- VALENTINE ---
    "val_3": {
        name: "Val 3", src: "val_3.png", 
        fields: [
            { id: "f1", label: "Detail 1", x: 837, y: 797, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 713, y: 928, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 837, y: 1060, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 887, y: 1283, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 546, y: 1415, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 531, y: 1548, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 576, y: 1679, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f8", label: "Detail 8", x: 885, y: 1808, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 948, y: 1940, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 766, y: 2071, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "val_4": {
        name: "Val 4", src: "val_4.png", 
        fields: [
            { id: "f1", label: "Detail 1", x: 814, y: 875, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 718, y: 984, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f3", label: "Detail 3", x: 804, y: 1095, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 858, y: 1298, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 569, y: 1432, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 566, y: 1538, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 597, y: 1649, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f8", label: "Detail 8", x: 844, y: 1763, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 847, y: 1874, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 763, y: 1985, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    "val_12": {
        name: "Val 12", src: "val_12.png", 
        fields: [
            { id: "f1", label: "Detail 1", x: 786, y: 812, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 786, y: 960, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f3", label: "Detail 3", x: 801, y: 1112, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f4", label: "Detail 4", x: 839, y: 1264, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f5", label: "Detail 5", x: 680, y: 1357, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 682, y: 1446, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f7", label: "Detail 7", x: 710, y: 1532, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f8", label: "Detail 8", x: 761, y: 1689, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f9", label: "Detail 9", x: 978, y: 1174, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 768, y: 1936, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },

    // --- WEDDING ---
    "wed_1": {
        name: "Wed 1", src: "wed_1.png",
        fields: [
            { id: "f1", label: "Detail 1", x: 447, y: 373, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 469, y: 509, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f3", label: "Detail 3", x: 267, y: 750, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 445, y: 750, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 626, y: 750, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 426, y: 864, font: "bold 35px Arial", color: "#000000", align: "center" },
            { id: "f7", label: "Detail 7", x: 426, y: 906, font: "bold 35px Arial", color: "#000000", align: "center" },
            { id: "f8", label: "Detail 8", x: 286, y: 1158, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 574, y: 1154, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 385, y: 1236, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f11", label: "Detail 11", x: 381, y: 1275, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f12", label: "Detail 12", x: 369, y: 1446, font: "bold 35px Arial", color: "#000000", align: "center" }
        ]
    },
    "wed_2": {
        name: "Wed 2", src: "wed_2.png",
        fields: [
            { id: "f1", label: "Detail 1", x: 412, y: 347, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 445, y: 515, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f3", label: "Detail 3", x: 234, y: 780, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 433, y: 780, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 644, y: 780, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 410, y: 912, font: "bold 35px Arial", color: "#000000", align: "center" },
            { id: "f7", label: "Detail 7", x: 415, y: 960, font: "bold 35px Arial", color: "#000000", align: "center" },
            { id: "f8", label: "Detail 8", x: 278, y: 1216, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 530, y: 1216, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 407, y: 1300, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f11", label: "Detail 11", x: 377, y: 1339, font: "bold 35px Arial", color: "#000000", align: "left" }
        ]
    },
    "wed_3": {
        name: "Wed 3", src: "wed_3.png",
        fields: [
            { id: "f1", label: "Detail 1", x: 436, y: 308, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 442, y: 490, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "f3", label: "Detail 3", x: 215, y: 769, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f4", label: "Detail 4", x: 417, y: 769, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f5", label: "Detail 5", x: 641, y: 769, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f6", label: "Detail 6", x: 398, y: 905, font: "bold 35px Arial", color: "#000000", align: "center" },
            { id: "f7", label: "Detail 7", x: 404, y: 955, font: "bold 35px Arial", color: "#000000", align: "center" },
            { id: "f8", label: "Detail 8", x: 253, y: 1233, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f9", label: "Detail 9", x: 571, y: 1233, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f10", label: "Detail 10", x: 360, y: 1322, font: "bold 35px Arial", color: "#000000", align: "left" },
            { id: "f11", label: "Detail 11", x: 355, y: 1365, font: "bold 35px Arial", color: "#000000", align: "left" }
        ]
    }
};

// ==========================================
// 4. GENERATOR & MULTI-GUEST LOGIC
// ==========================================
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const inputContainer = document.getElementById('inputContainer');
const templateSelector = document.getElementById('templateSelector');
const fontSelector = document.getElementById('fontSelector');
const colorSelector = document.getElementById('colorSelector');
const modal = document.getElementById('generatorModal');

let currentTemplateKey = null;
let currentImage = new Image();
let generationMode = "manual"; 
let selectedGuestNames = []; 
let globalFormData = {}; 

fontSelector.addEventListener('change', () => drawCanvas());
colorSelector.addEventListener('input', () => drawCanvas());

window.onclick = function(event) {
    if (event.target == modal) window.closeModal();
    if (event.target == document.getElementById('guestSelectionModal')) window.closeGuestSelectionModal();
}

window.openModal = function(categoryPrefix) {
    if(isDragging) return; 
    
    modal.style.display = 'block';
    const titleMap = {
        'bd_': 'Birthday Templates',
        'val_': 'Valentine Templates',
        'bs_': 'Baby Shower Templates',
        'wed_': 'Wedding Templates',
        'fare_': 'Farewell Templates'
    };
    document.getElementById('modalCategoryTitle').innerText = titleMap[categoryPrefix] || 'Select Template';

    templateSelector.innerHTML = '';
    let firstKey = null;

    for (const key in templates) {
        if (key.startsWith(categoryPrefix)) {
            if (!firstKey) firstKey = key;
            const btn = document.createElement('button');
            btn.className = 'template-btn';
            btn.innerText = templates[key].name;
            
            btn.onclick = (e) => {
                document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                renderTemplateInterface(key);
            };
            templateSelector.appendChild(btn);
        }
    }
    
    if (firstKey) {
        templateSelector.firstChild.classList.add('active');
        renderTemplateInterface(firstKey);
    }
}

window.closeModal = function() { 
    modal.style.display = 'none'; 
}

window.closeGuestSelectionModal = function() { 
    document.getElementById('guestSelectionModal').style.display = 'none'; 
}

function renderTemplateInterface(key) {
    currentTemplateKey = key;
    const config = templates[key];

    inputContainer.innerHTML = '';

    // --- FONT SIZE SELECTOR ---
    let fontContainer = document.getElementById('fontContainerWrapper');
    if (!fontContainer) {
        const colorContainer = document.getElementById('colorSelector').parentNode;
        fontContainer = document.createElement('div');
        fontContainer.id = 'fontContainerWrapper';
        fontContainer.style.flex = '0 0 70px';
        fontContainer.innerHTML = `
            <label for="fontSizeSelector">Size</label>
            <input type="number" id="fontSizeSelector" value="60" style="width: 100%; height: 43px; padding: 5px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color-1); color: var(--text-main); outline: none;">
        `;
        colorContainer.parentNode.insertBefore(fontContainer, colorContainer);
        
        const fontSizeSelector = document.getElementById('fontSizeSelector');
        fontSizeSelector.addEventListener('input', () => drawCanvas());
    }

    // Toggle Font Size Selector visibility for wedding cards
    if (key.startsWith('wed_')) {
        fontContainer.style.display = 'none';
    } else {
        fontContainer.style.display = 'block';
    }

    // --- INLINE MODE TOGGLE ---
    const modeToggleContainer = document.createElement('div');
    modeToggleContainer.style.display = 'flex';
    modeToggleContainer.style.gap = '10px';
    modeToggleContainer.style.marginBottom = '20px';
    modeToggleContainer.style.paddingBottom = '15px';
    modeToggleContainer.style.borderBottom = '1px solid var(--border-color)';

    const manBtn = document.createElement('button');
    manBtn.innerText = 'Manual Entry';
    manBtn.className = generationMode === 'manual' ? 'action-btn primary' : 'action-btn ghost';
    manBtn.style.flex = '1';
    manBtn.style.padding = '10px';
    manBtn.style.fontSize = '13px';
    manBtn.onclick = () => {
        generationMode = 'manual';
        renderTemplateInterface(key);
    };

    const guestBtn = document.createElement('button');
    guestBtn.innerText = 'From Guestlist';
    guestBtn.className = generationMode === 'guestlist' ? 'action-btn primary' : 'action-btn ghost';
    guestBtn.style.flex = '1';
    guestBtn.style.padding = '10px';
    guestBtn.style.fontSize = '13px';
    guestBtn.onclick = triggerGuestSelection;

    modeToggleContainer.appendChild(manBtn);
    modeToggleContainer.appendChild(guestBtn);
    inputContainer.appendChild(modeToggleContainer);

    // --- DYNAMIC INPUTS ---
    let guestFieldRendered = false;
    
    config.fields.forEach(field => {
        if (generationMode === "guestlist" && field.id === "guestName") {
            if (!guestFieldRendered) {
                const infoMsg = document.createElement('div');
                infoMsg.style.fontSize = '13px';
                infoMsg.style.color = 'var(--text-main)';
                infoMsg.style.marginBottom = '15px';
                infoMsg.style.padding = '12px';
                infoMsg.style.background = 'var(--border-highlight)';
                infoMsg.style.borderRadius = '8px';
                infoMsg.style.border = '1px dashed var(--accent-color)';
                infoMsg.innerHTML = `<strong>✓ ${selectedGuestNames.length} guests selected.</strong><br><span style="opacity:0.8; font-size:11.5px;">Names will be injected automatically during generation.</span>`;
                inputContainer.appendChild(infoMsg);
                guestFieldRendered = true;
            }
            return; 
        }

        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.innerText = field.label;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = field.id;
        input.placeholder = `Enter ${field.label}`;
        
        if (globalFormData[field.id]) {
            input.value = globalFormData[field.id];
        }

        input.addEventListener('input', (e) => {
            globalFormData[field.id] = e.target.value; 
            drawCanvas();
        });

        group.appendChild(label);
        group.appendChild(input);
        inputContainer.appendChild(group);
    });

    const dlBtn = document.getElementById('downloadBtn');
    if (generationMode === "guestlist") {
        dlBtn.innerText = `Generate Invitations (${selectedGuestNames.length})`;
    } else {
        dlBtn.innerText = `Download Image`;
    }

    currentImage.onload = () => {
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        drawCanvas();
    };
    currentImage.src = config.src;
}

function triggerGuestSelection() {
    if (!currentUserUid) {
        alert("Please log in to your account first to access your saved guest list.");
        return;
    }
    
    if (fetchedGuestList.length === 0) {
        alert("No guests found. Please add guests in the Dashboard -> Guest List Manager first.");
        return;
    }

    const container = document.getElementById('guestChecklist');
    container.innerHTML = '';
    
    fetchedGuestList.forEach(guest => {
        if (!guest.name) return;
        const lbl = document.createElement('label');
        lbl.className = 'checklist-item custom-checkbox';
        lbl.innerHTML = `
            <input type="checkbox" class="guest-cb" value="${guest.name}" ${selectedGuestNames.includes(guest.name) ? 'checked' : ''}>
            <span class="checkmark"></span>
            ${guest.name}
        `;
        container.appendChild(lbl);
    });

    document.getElementById('selectAllGuests').checked = (selectedGuestNames.length > 0 && selectedGuestNames.length === fetchedGuestList.length);
    document.getElementById('guestSelectionModal').style.display = 'block';
}

document.getElementById('selectAllGuests').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.guest-cb');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
});

document.getElementById('btnProceedGuests').addEventListener('click', () => {
    const checkedBoxes = document.querySelectorAll('.guest-cb:checked');
    selectedGuestNames = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (selectedGuestNames.length === 0) {
        alert("Please select at least one guest!");
        return;
    }

    generationMode = "guestlist";
    window.closeGuestSelectionModal();
    renderTemplateInterface(currentTemplateKey);
});

function drawCanvas(overrideGuestName = null) {
    if (!currentTemplateKey || !currentImage.src) return;
    const config = templates[currentTemplateKey];
    const selectedFontFamily = fontSelector.value;
    const selectedColor = colorSelector.value;
    
    const fontSizeInput = document.getElementById('fontSizeSelector');
    const baseFontSize = fontSizeInput ? parseInt(fontSizeInput.value) : 60;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);

    config.fields.forEach((field, index) => {
        let text = "";

        if (generationMode === "guestlist" && field.id === "guestName") {
            text = overrideGuestName || "[Dynamic Guest Name]"; 
        } else {
            const inputElement = document.getElementById(field.id);
            if (inputElement && inputElement.value) {
                text = inputElement.value;
            }
        }
        
        if (text) {
            ctx.textAlign = field.align;
            ctx.textBaseline = "middle";

            const drawX = (field.align === 'center') ? (canvas.width / 2) : field.x;
            const drawY = field.y;

            // Enforce Strict Size Rule for Wedding Cards
            let currentFontSize;
            if (currentTemplateKey.startsWith('wed_')) {
                currentFontSize = (index < 2) ? 60 : 45;
            } else {
                currentFontSize = baseFontSize;
            }

            const fontParts = field.font.split(/\d+px/);
            const fontStyle = fontParts[0].trim(); 

            ctx.font = `${fontStyle} ${currentFontSize}px ${selectedFontFamily}`;

            const maxTextWidth = canvas.width - 80;
            while (ctx.measureText(text).width > maxTextWidth && currentFontSize > 10) {
                currentFontSize -= 2; 
                ctx.font = `${fontStyle} ${currentFontSize}px ${selectedFontFamily}`;
            }

            ctx.fillStyle = selectedColor || field.color;
            ctx.fillText(text, drawX, drawY);
        }
    });
}

document.getElementById('downloadBtn').addEventListener('click', async () => {
    if (generationMode === "manual") {
        const link = document.createElement('a');
        link.download = `${currentTemplateKey}_invitation.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
    }

    const dlBtn = document.getElementById('downloadBtn');
    const originalText = dlBtn.innerText;
    dlBtn.innerText = "Generating...";
    dlBtn.disabled = true;

    for (let i = 0; i < selectedGuestNames.length; i++) {
        const currentName = selectedGuestNames[i];
        
        drawCanvas(currentName);
        await new Promise(r => setTimeout(r, 100)); 

        const link = document.createElement('a');
        const safeFileName = currentName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); 
        link.download = `${currentTemplateKey}_for_${safeFileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        await new Promise(r => setTimeout(r, 500)); 
    }

    drawCanvas(); 
    dlBtn.innerText = "Completed ✓";
    
    setTimeout(() => {
        dlBtn.innerText = originalText;
        dlBtn.disabled = false;
    }, 2000);
});