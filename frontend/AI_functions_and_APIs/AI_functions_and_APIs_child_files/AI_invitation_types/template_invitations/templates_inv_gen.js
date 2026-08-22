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
        console.log("User is logged in. Fetching guests...");
        
        try {
            const userDocRef = doc(db, "users", currentUserUid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.guests && Array.isArray(data.guests)) {
                    fetchedGuestList = data.guests;
                }
            }
        } catch (error) {
            console.error("Error loading guests:", error);
        }
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

const mobileBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
mobileBtn.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  mobileBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
});

const slider = document.getElementById('carousel');
let isDown = false, startX, scrollLeft, isDragging = false; 

slider.addEventListener('mousedown', (e) => {
  isDown = true;
  isDragging = false; 
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
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
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 1.5; 
  slider.scrollLeft = scrollLeft - walk;
});

// ==========================================
// 3. TEMPLATE GENERATOR CONFIGURATION
// ==========================================
const templates = {
    // --- BIRTHDAY TEMPLATES ---
    "bd_1": {
        name: "BD 1", src: "bd_1.png", 
        fields: [
            { id: "birthName", label: "Birthday Person Name", x: 795, y: 735, font: "bold 60px Arial", align: "center" },
            { id: "guestName", label: "Guest Name", x: 802, y: 1004, font: "bold 60px Arial", align: "center" },
            { id: "ageMilestone", label: "Age or Milestone", x: 850, y: 1274, font: "bold 60px Arial", align: "center" },
            { id: "dateTime", label: "Date and Time", x: 865, y: 1545, font: "bold 60px Arial", align: "center" },
            { id: "location", label: "Location", x: 789, y: 1817, font: "bold 60px Arial", align: "center" },
            { id: "rsvp", label: "RSVP Info", x: 750, y: 2085, font: "bold 60px Arial", align: "center" }
        ]
    },
    "bd_2": {
        name: "BD 2", src: "bd_2.png",
        fields: [
            { id: "birthName", label: "Birthday Person Name", x: 993, y: 645, font: "bold 60px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 706, y: 772, font: "bold 60px Arial", align: "left" },
            { id: "ageMilestone", label: "Age or Milestone", x: 847, y: 898, font: "bold 60px Arial", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 758, y: 1026, font: "bold 60px Arial", align: "left" },
            { id: "location", label: "Location", x: 600, y: 1154, font: "bold 60px Arial", align: "left" },
            { id: "rsvp", label: "RSVP Info", x: 650, y: 1289, font: "bold 60px Arial", align: "left" }
        ]
    },
    // --- VALENTINE'S DAY TEMPLATES ---
    "val_1": {
        name: "Val 1", src: "val_12.png", 
        fields: [
            { id: "valName", label: "My Valentine", x: 786, y: 812, font: "bold 60px Arial", align: "center" },
            { id: "guestName", label: "Nickname/Guest", x: 786, y: 960, font: "bold 60px Arial", align: "center" }, 
            { id: "valMessage", label: "Love Message", x: 801, y: 1112, font: "bold 60px Arial", align: "center" },
            { id: "valMemory", label: "Special Memory", x: 839, y: 1264, font: "bold 60px Arial", align: "center" },
            { id: "valDate", label: "Date", x: 680, y: 1357, font: "bold 60px Arial", align: "left" },
            { id: "valTime", label: "Time", x: 682, y: 1446, font: "bold 60px Arial", align: "left" },
            { id: "valVenue", label: "Venue", x: 710, y: 1532, font: "bold 60px Arial", align: "left" },
            { id: "valSurprise", label: "Special Surprise", x: 761, y: 1689, font: "bold 60px Arial", align: "center" },
            { id: "valRSVP", label: "RSVP / Contact", x: 978, y: 1774, font: "bold 60px Arial", align: "left" },
            { id: "valClosing", label: "Closing Line", x: 768, y: 1936, font: "bold 60px Arial", align: "left" }
        ]
    },
    // --- BABY SHOWER TEMPLATES ---
    "bs_1": {
        name: "BS 1", src: "bs_1.png", 
        fields: [
            { id: "momName", label: "Mom-to-be Name", x: 943, y: 1100, font: "bold 60px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 811, y: 1244, font: "bold 60px Arial", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 875, y: 1390, font: "bold 60px Arial", align: "left" },
            { id: "location", label: "Location", x: 723, y: 1532, font: "bold 60px Arial", align: "left" },
            { id: "hostedBy", label: "Hosted By", x: 763, y: 1676, font: "bold 60px Arial", align: "left" },
            { id: "rsvp", label: "RSVP Info", x: 768, y: 1821, font: "bold 60px Arial", align: "left" }
        ]
    },
    // --- FAREWELL TEMPLATES ---
    "fare_1": {
        name: "Farewell 1", src: "fare_1.png", 
        fields: [
            { id: "event", label: "Event Details", x: 440, y: 573, font: "bold 40px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 505, y: 692, font: "bold 40px Arial", align: "left" },
            { id: "dateTime", label: "When (Date & Time)", x: 428, y: 816, font: "bold 40px Arial", align: "left" },
            { id: "location", label: "Where (Location)", x: 445, y: 963, font: "bold 40px Arial", align: "left" },
            { id: "highlights", label: "Highlights", x: 505, y: 1084, font: "bold 40px Arial", align: "left" },
            { id: "dressCode", label: "Dress Code", x: 600, y: 1214, font: "bold 40px Arial", align: "left" },
            { id: "rsvp", label: "Contact / RSVP", x: 543, y: 1308, font: "bold 40px Arial", align: "left" }
        ]
    },
    "fare_2": {
        name: "Farewell 2", src: "fare_2.png", 
        fields: [
            { id: "event", label: "Event Details", x: 364, y: 521, font: "bold 40px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 411, y: 618, font: "bold 40px Arial", align: "left" },
            { id: "dateTime", label: "When (Date & Time)", x: 356, y: 774, font: "bold 40px Arial", align: "left" },
            { id: "location", label: "Where (Location)", x: 368, y: 920, font: "bold 40px Arial", align: "left" },
            { id: "highlights", label: "Highlights", x: 318, y: 1059, font: "bold 40px Arial", align: "left" },
            { id: "dressCode", label: "Dress Code", x: 523, y: 1192, font: "bold 40px Arial", align: "left" },
            { id: "rsvp", label: "Contact / RSVP", x: 466, y: 1294, font: "bold 40px Arial", align: "left" }
        ]
    },
    "fare_3": {
        name: "Farewell 3", src: "fare_3.png", 
        fields: [
            { id: "event", label: "Event Details", x: 408, y: 582, font: "bold 40px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 468, y: 691, font: "bold 40px Arial", align: "left" },
            { id: "dateTime", label: "When (Date & Time)", x: 405, y: 803, font: "bold 40px Arial", align: "left" },
            { id: "location", label: "Where (Location)", x: 420, y: 945, font: "bold 40px Arial", align: "left" },
            { id: "highlights", label: "Highlights", x: 363, y: 1083, font: "bold 40px Arial", align: "left" },
            { id: "dressCode", label: "Dress Code", x: 561, y: 1215, font: "bold 40px Arial", align: "left" },
            { id: "rsvp", label: "Contact / RSVP", x: 521, y: 1288, font: "bold 40px Arial", align: "left" }
        ]
    },
    "fare_4": {
        name: "Farewell 4", src: "fare_4.png", 
        fields: [
            { id: "event", label: "Event Details", x: 416, y: 585, font: "bold 35px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 469, y: 667, font: "bold 35px Arial", align: "left" },
            { id: "date", label: "Date", x: 411, y: 807, font: "bold 28px Arial", align: "left" },
            { id: "day", label: "Day", x: 411, y: 839, font: "bold 28px Arial", align: "left" },
            { id: "time", label: "Time", x: 411, y: 870, font: "bold 28px Arial", align: "left" },
            { id: "venue", label: "Venue", x: 425, y: 962, font: "bold 28px Arial", align: "left" },
            { id: "location", label: "Location", x: 454, y: 995, font: "bold 28px Arial", align: "left" },
            { id: "highlights", label: "Highlights", x: 383, y: 1082, font: "bold 28px Arial", align: "left" },
            { id: "dressCode", label: "Dress Code", x: 580, y: 1210, font: "bold 35px Arial", align: "left" },
            { id: "rsvp", label: "Contact / RSVP", x: 519, y: 1288, font: "bold 35px Arial", align: "left" }
        ]
    },
    "fare_5": {
        name: "Farewell 5", src: "fare_5.png", 
        fields: [
            { id: "event", label: "Event Details", x: 392, y: 559, font: "bold 35px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 437, y: 660, font: "bold 35px Arial", align: "left" },
            { id: "date", label: "Date", x: 359, y: 806, font: "bold 28px Arial", align: "left" },
            { id: "day", label: "Day", x: 359, y: 840, font: "bold 28px Arial", align: "left" },
            { id: "time", label: "Time", x: 359, y: 875, font: "bold 28px Arial", align: "left" },
            { id: "venue", label: "Venue", x: 375, y: 964, font: "bold 28px Arial", align: "left" },
            { id: "location", label: "Location", x: 404, y: 1001, font: "bold 28px Arial", align: "left" },
            { id: "highlights", label: "Highlights", x: 344, y: 1089, font: "bold 28px Arial", align: "left" },
            { id: "dressCode", label: "Dress Code", x: 539, y: 1214, font: "bold 35px Arial", align: "left" },
            { id: "rsvp", label: "Contact / RSVP", x: 497, y: 1297, font: "bold 35px Arial", align: "left" }
        ]
    },
    "fare_6": {
        name: "Farewell 6", src: "fare_6.png", 
        fields: [
            { id: "event", label: "Event Details", x: 425, y: 551, font: "bold 35px Arial", align: "left" },
            { id: "guestName", label: "Guest Name", x: 465, y: 660, font: "bold 35px Arial", align: "left" },
            { id: "date", label: "Date", x: 409, y: 790, font: "bold 28px Arial", align: "left" },
            { id: "day", label: "Day", x: 409, y: 822, font: "bold 28px Arial", align: "left" },
            { id: "time", label: "Time", x: 409, y: 856, font: "bold 28px Arial", align: "left" },
            { id: "venue", label: "Venue", x: 423, y: 952, font: "bold 28px Arial", align: "left" },
            { id: "location", label: "Location", x: 453, y: 986, font: "bold 28px Arial", align: "left" },
            { id: "highlights", label: "Highlights", x: 385, y: 1074, font: "bold 28px Arial", align: "left" },
            { id: "dressCode", label: "Dress Code", x: 583, y: 1202, font: "bold 35px Arial", align: "left" },
            { id: "rsvp", label: "Contact / RSVP", x: 517, y: 1286, font: "bold 35px Arial", align: "left" }
        ]
        
    },
    // --- WEDDING TEMPLATES ---
    "wed_1": {
        name: "Wedding 1", src: "wed_1.png",
        fields: [
            { id: "partner1", label: "Partner 1 Name", x: 447, y: 373, font: "bold 50px Arial", align: "center" },
            { id: "partner2", label: "Partner 2 Name", x: 469, y: 509, font: "bold 50px Arial", align: "center" },
            { id: "date", label: "Wedding Date", x: 261, y: 754, font: "bold 30px Arial", align: "left" },
            { id: "day", label: "Day", x: 450, y: 754, font: "bold 30px Arial", align: "left" },
            { id: "time", label: "Time", x: 632, y: 754, font: "bold 30px Arial", align: "left" },
            { id: "venue", label: "Venue Name", x: 426, y: 869, font: "bold 35px Arial", align: "center" },
            { id: "address", label: "City / Address", x: 426, y: 905, font: "bold 30px Arial", align: "center" },
            { id: "ceremony", label: "Ceremony Time", x: 286, y: 1158, font: "bold 30px Arial", align: "left" },
            { id: "reception", label: "Reception Time", x: 574, y: 1154, font: "bold 30px Arial", align: "left" },
            { id: "rsvpName", label: "RSVP Contact", x: 385, y: 1236, font: "bold 30px Arial", align: "left" },
            { id: "rsvpEmail", label: "RSVP Email", x: 381, y: 1275, font: "bold 30px Arial", align: "left" },
            { id: "blessing", label: "Optional Message", x: 369, y: 1446, font: "bold 30px Arial", align: "center" }
        ]
    },
    "wed_2": {
        name: "Wedding 2", src: "wed_2.png",
        fields: [
            { id: "partner1", label: "Partner 1 Name", x: 412, y: 347, font: "bold 50px Arial", align: "center" },
            { id: "partner2", label: "Partner 2 Name", x: 445, y: 515, font: "bold 50px Arial", align: "center" },
            { id: "date", label: "Wedding Date", x: 234, y: 780, font: "bold 30px Arial", align: "left" },
            { id: "day", label: "Day", x: 445, y: 780, font: "bold 30px Arial", align: "left" },
            { id: "time", label: "Time", x: 649, y: 780, font: "bold 30px Arial", align: "left" },
            { id: "venue", label: "Venue Name", x: 410, y: 912, font: "bold 35px Arial", align: "center" },
            { id: "address", label: "City / Address", x: 415, y: 960, font: "bold 30px Arial", align: "center" },
            { id: "ceremony", label: "Ceremony Time", x: 283, y: 1216, font: "bold 30px Arial", align: "left" },
            { id: "reception", label: "Reception Time", x: 550, y: 1216, font: "bold 30px Arial", align: "left" },
            { id: "rsvpName", label: "RSVP Contact", x: 407, y: 1300, font: "bold 30px Arial", align: "left" },
            { id: "rsvpEmail", label: "RSVP Email", x: 377, y: 1339, font: "bold 30px Arial", align: "left" }
        ]
    },
    "wed_3": {
        name: "Wedding 3", src: "wed_3.png",
        fields: [
            { id: "partner1", label: "Partner 1 Name", x: 436, y: 308, font: "bold 50px Arial", align: "center" },
            { id: "partner2", label: "Partner 2 Name", x: 442, y: 490, font: "bold 50px Arial", align: "center" },
            { id: "date", label: "Wedding Date", x: 215, y: 769, font: "bold 30px Arial", align: "left" },
            { id: "day", label: "Day", x: 423, y: 769, font: "bold 30px Arial", align: "left" },
            { id: "time", label: "Time", x: 649, y: 769, font: "bold 30px Arial", align: "left" },
            { id: "venue", label: "Venue Name", x: 398, y: 905, font: "bold 35px Arial", align: "center" },
            { id: "address", label: "City / Address", x: 404, y: 955, font: "bold 30px Arial", align: "center" },
            { id: "ceremony", label: "Ceremony Time", x: 260, y: 1233, font: "bold 30px Arial", align: "left" },
            { id: "reception", label: "Reception Time", x: 583, y: 1233, font: "bold 30px Arial", align: "left" },
            { id: "rsvpName", label: "RSVP Contact", x: 360, y: 1322, font: "bold 30px Arial", align: "left" },
            { id: "rsvpEmail", label: "RSVP Email", x: 355, y: 1365, font: "bold 30px Arial", align: "left" }
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
const colorSelector = document.getElementById('colorSelector'); // New Color Selector
const modal = document.getElementById('generatorModal');

let currentTemplateKey = null;
let currentImage = new Image();
let generationMode = "manual"; 
let pendingTemplateKey = null;
let selectedGuestNames = []; 

// Redraw on settings change
fontSelector.addEventListener('change', () => drawCanvas());
colorSelector.addEventListener('input', () => drawCanvas());

window.onclick = function(event) {
    if (event.target == modal) window.closeModal();
    if (event.target == document.getElementById('modeSelectionModal')) window.closeModeModal();
    if (event.target == document.getElementById('guestSelectionModal')) window.closeGuestSelectionModal();
}

// -----------------------------------------------------------------
// WINDOW EXPORTS FOR HTML ONCLICK HANDLERS
// -----------------------------------------------------------------
window.openModal = function(categoryPrefix) {
    if(isDragging) return; 
    
    modal.style.display = 'block';
    const titleMap = {
        'bd_': 'Birthday Templates',
        'val_': 'Valentine Templates',
        'bs_': 'Baby Shower Templates',
        'fare_': 'Farewell Templates',
        'wed_': 'Wedding Templates'
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
                pendingTemplateKey = key;
                document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // ONLY ask for Guestlist mode if it's Birthday or Baby Shower
                if (categoryPrefix === 'bd_' || categoryPrefix === 'bs_') {
                    document.getElementById('modeSelectionModal').style.display = 'block';
                } else {
                    generationMode = "manual";
                    renderTemplateInterface(pendingTemplateKey);
                }
            };
            templateSelector.appendChild(btn);
        }
    }
    
    if (firstKey) {
        pendingTemplateKey = firstKey;
        setTimeout(() => {
            if(templateSelector.firstChild) {
                templateSelector.firstChild.classList.add('active');
                
                if (categoryPrefix === 'bd_' || categoryPrefix === 'bs_') {
                    document.getElementById('modeSelectionModal').style.display = 'block';
                } else {
                    generationMode = "manual";
                    renderTemplateInterface(pendingTemplateKey);
                }
            }
        }, 10);
    }
}

window.closeModal = function() {
    modal.style.display = 'none';
}

window.closeModeModal = function() {
    document.getElementById('modeSelectionModal').style.display = 'none';
}

window.closeGuestSelectionModal = function() {
    document.getElementById('guestSelectionModal').style.display = 'none';
}

// -----------------------------------------------------------------
// MODE SELECTION HANDLERS
// -----------------------------------------------------------------
document.getElementById('btnManualMode').addEventListener('click', () => {
    generationMode = "manual";
    window.closeModeModal();
    renderTemplateInterface(pendingTemplateKey);
});

document.getElementById('btnGuestlistMode').addEventListener('click', () => {
    window.closeModeModal();
    
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
            <input type="checkbox" class="guest-cb" value="${guest.name}">
            <span class="checkmark"></span>
            ${guest.name}
        `;
        container.appendChild(lbl);
    });

    document.getElementById('selectAllGuests').checked = false;
    document.getElementById('guestSelectionModal').style.display = 'block';
});

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
    renderTemplateInterface(pendingTemplateKey);
});

// -----------------------------------------------------------------
// RENDERING & CANVAS DRAWING
// -----------------------------------------------------------------
function renderTemplateInterface(key) {
    currentTemplateKey = key;
    const config = templates[key];

    inputContainer.innerHTML = '';
    config.fields.forEach(field => {
        if (generationMode === "guestlist" && field.id === "guestName") {
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
        input.addEventListener('input', () => drawCanvas());

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

function drawCanvas(overrideGuestName = null) {
    if (!currentTemplateKey || !currentImage.src) return;
    const config = templates[currentTemplateKey];
    const selectedFontFamily = fontSelector.value;
    const selectedColor = colorSelector.value; // Global Text Color

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);

    config.fields.forEach(field => {
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

            const sizeMatch = field.font.match(/(\d+)px/);
            let currentFontSize = sizeMatch ? parseInt(sizeMatch[1]) : 60;
            const fontPrefix = field.font.split(/\d+px/)[0];

            ctx.font = `${fontPrefix}${currentFontSize}px ${selectedFontFamily}`;

            const maxTextWidth = canvas.width - 80;
            while (ctx.measureText(text).width > maxTextWidth && currentFontSize > 10) {
                currentFontSize -= 2; 
                ctx.font = `${fontPrefix}${currentFontSize}px ${selectedFontFamily}`;
            }

            // Apply selected global color instead of field.color
            ctx.fillStyle = selectedColor; 
            ctx.fillText(text, drawX, drawY);
        }
    });
}

// -----------------------------------------------------------------
// DOWNLOAD & BULK GENERATION PROCESS
// -----------------------------------------------------------------
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