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

// Mobile Hamburger Menu Logic
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

// Advanced Drag to Scroll Logic
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
            { id: "birthName", label: "Birthday Person", x: 795, y: 735, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 802, y: 1004, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "ageMilestone", label: "Age or Milestone", x: 850, y: 1274, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "dateTime", label: "Date and Time", x: 865, y: 1545, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "location", label: "Location", x: 789, y: 1817, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "rsvp", label: "RSVP Info", x: 750, y: 2085, font: "bold 60px Arial", color: "#000000", align: "center" }
        ]
    },
    "bd_2": {
        name: "BD 2", src: "bd_2.png",
        fields: [
            { id: "birthName", label: "Birthday Person Name", x: 993, y: 645, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 706, y: 772, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 758, y: 1026, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "location", label: "Location", x: 600, y: 1154, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    // --- BABY SHOWER ---
    "bs_1": {
        name: "BS 1", src: "bs_1.png", 
        fields: [
            { id: "momName", label: "Mom-to-be Name", x: 943, y: 1100, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 811, y: 1244, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 875, y: 1390, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "location", label: "Location", x: 723, y: 1532, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    // --- VALENTINE ---
    "val_1": {
        name: "Val 1", src: "val_12.png", 
        fields: [
            { id: "valName", label: "My Valentine", x: 786, y: 812, font: "bold 60px Arial", color: "#211104", align: "center" },
            { id: "guestName", label: "Nickname/Guest", x: 786, y: 960, font: "bold 60px Arial", color: "#211104", align: "center" }, 
            { id: "valMessage", label: "Love Message", x: 801, y: 1112, font: "bold 60px Arial", color: "#211104", align: "center" },
            { id: "valDate", label: "Date", x: 680, y: 1357, font: "bold 60px Arial", color: "#211104", align: "left" }
        ]
    },
    // --- WEDDING ---
    "wed_1": {
        name: "Wed 1", src: "wed_1.png",
        fields: [
            { id: "coupleNames", label: "Couple's Names", x: 800, y: 600, font: "bold 80px Arial", color: "#2E2136", align: "center" },
            { id: "guestName", label: "Guest Name", x: 800, y: 750, font: "bold 50px Arial", color: "#2E2136", align: "center" },
            { id: "dateTime", label: "Date & Time", x: 800, y: 900, font: "bold 40px Arial", color: "#2E2136", align: "center" },
            { id: "venue", label: "Venue", x: 800, y: 1050, font: "bold 40px Arial", color: "#2E2136", align: "center" }
        ]
    },
    "wed_2": {
        name: "Wed 2", src: "wed_2.png",
        fields: [
            { id: "coupleNames", label: "Couple's Names", x: 500, y: 500, font: "bold 70px Arial", color: "#111111", align: "left" },
            { id: "guestName", label: "Guest Name", x: 500, y: 650, font: "bold 50px Arial", color: "#111111", align: "left" },
            { id: "dateTime", label: "Date & Time", x: 500, y: 800, font: "bold 40px Arial", color: "#111111", align: "left" },
            { id: "venue", label: "Venue", x: 500, y: 950, font: "bold 40px Arial", color: "#111111", align: "left" }
        ]
    },
    "wed_3": {
        name: "Wed 3", src: "wed_3.png",
        fields: [
            { id: "coupleNames", label: "Couple's Names", x: 1100, y: 600, font: "bold 75px Arial", color: "#ffffff", align: "right" },
            { id: "guestName", label: "Guest Name", x: 1100, y: 750, font: "bold 55px Arial", color: "#ffffff", align: "right" },
            { id: "dateTime", label: "Date & Time", x: 1100, y: 900, font: "bold 45px Arial", color: "#ffffff", align: "right" },
            { id: "venue", label: "Venue", x: 1100, y: 1050, font: "bold 45px Arial", color: "#ffffff", align: "right" }
        ]
    },
    // --- FAREWELL ---
    "fare_1": {
        name: "Fare 1", src: "fare_1.png",
        fields: [
            { id: "honoreeName", label: "Honoree Name", x: 800, y: 500, font: "bold 70px Arial", color: "#333333", align: "center" },
            { id: "guestName", label: "Guest Name", x: 800, y: 650, font: "bold 50px Arial", color: "#333333", align: "center" },
            { id: "message", label: "Farewell Message", x: 800, y: 800, font: "bold 40px Arial", color: "#333333", align: "center" },
            { id: "dateTime", label: "Date & Time", x: 800, y: 950, font: "bold 40px Arial", color: "#333333", align: "center" }
        ]
    },
    "fare_2": {
        name: "Fare 2", src: "fare_2.png",
        fields: [
            { id: "honoreeName", label: "Honoree Name", x: 400, y: 450, font: "bold 65px Arial", color: "#222222", align: "left" },
            { id: "guestName", label: "Guest Name", x: 400, y: 600, font: "bold 45px Arial", color: "#222222", align: "left" },
            { id: "dateTime", label: "Date & Time", x: 400, y: 750, font: "bold 35px Arial", color: "#222222", align: "left" },
            { id: "venue", label: "Venue", x: 400, y: 900, font: "bold 35px Arial", color: "#222222", align: "left" }
        ]
    },
    "fare_3": {
        name: "Fare 3", src: "fare_3.png",
        fields: [
            { id: "honoreeName", label: "Honoree Name", x: 800, y: 550, font: "bold 70px Arial", color: "#4A4A4A", align: "center" },
            { id: "guestName", label: "Guest Name", x: 800, y: 700, font: "bold 50px Arial", color: "#4A4A4A", align: "center" },
            { id: "dateTime", label: "Date & Time", x: 800, y: 850, font: "bold 40px Arial", color: "#4A4A4A", align: "center" }
        ]
    },
    "fare_4": {
        name: "Fare 4", src: "fare_4.png",
        fields: [
            { id: "honoreeName", label: "Honoree Name", x: 1200, y: 600, font: "bold 65px Arial", color: "#ffffff", align: "right" },
            { id: "guestName", label: "Guest Name", x: 1200, y: 750, font: "bold 45px Arial", color: "#ffffff", align: "right" },
            { id: "dateTime", label: "Date & Time", x: 1200, y: 900, font: "bold 35px Arial", color: "#ffffff", align: "right" }
        ]
    },
    "fare_5": {
        name: "Fare 5", src: "fare_5.png",
        fields: [
            { id: "honoreeName", label: "Honoree Name", x: 800, y: 400, font: "bold 80px Arial", color: "#1A1A1A", align: "center" },
            { id: "guestName", label: "Guest Name", x: 800, y: 550, font: "bold 50px Arial", color: "#1A1A1A", align: "center" },
            { id: "message", label: "Farewell Message", x: 800, y: 700, font: "bold 40px Arial", color: "#1A1A1A", align: "center" },
            { id: "dateTime", label: "Date & Time", x: 800, y: 850, font: "bold 40px Arial", color: "#1A1A1A", align: "center" }
        ]
    },
    "fare_6": {
        name: "Fare 6", src: "fare_6.png",
        fields: [
            { id: "honoreeName", label: "Honoree Name", x: 600, y: 500, font: "bold 70px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 600, y: 650, font: "bold 50px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date & Time", x: 600, y: 800, font: "bold 40px Arial", color: "#000000", align: "left" }
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
let globalFormData = {}; // Saves inputs when switching templates

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
                renderTemplateInterface(key); // Renders without pop-ups
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

// Replaces the old Auto-Popup with integrated sidebar toggles
function renderTemplateInterface(key) {
    currentTemplateKey = key;
    const config = templates[key];

    inputContainer.innerHTML = ''; // Clear previous inputs

    // --- INJECT INLINE MODE TOGGLE ---
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

    // --- INJECT DYNAMIC INPUTS ---
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
            return; // Skip standard input
        }

        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.innerText = field.label;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = field.id;
        input.placeholder = `Enter ${field.label}`;
        
        // Restore previous value if user typed it in another template
        if (globalFormData[field.id]) {
            input.value = globalFormData[field.id];
        }

        input.addEventListener('input', (e) => {
            globalFormData[field.id] = e.target.value; // Save to global state
            drawCanvas();
        });

        group.appendChild(label);
        group.appendChild(input);
        inputContainer.appendChild(group);
    });

    // Update Download button state
    const dlBtn = document.getElementById('downloadBtn');
    if (generationMode === "guestlist") {
        dlBtn.innerText = `Generate Invitations (${selectedGuestNames.length})`;
    } else {
        dlBtn.innerText = `Download Image`;
    }

    // Load Image onto Canvas
    currentImage.onload = () => {
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        drawCanvas();
    };
    currentImage.src = config.src;
}

// Dedicated Guestlist Trigger Function
function triggerGuestSelection() {
    if (!currentUserUid) {
        alert("Please log in to your account first to access your saved guest list.");
        return;
    }
    
    if (fetchedGuestList.length === 0) {
        alert("No guests found. Please add guests in the Guest List Manager.");
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

// Guest Selection Events
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

// Canvas Drawing Engine
function drawCanvas(overrideGuestName = null) {
    if (!currentTemplateKey || !currentImage.src) return;
    const config = templates[currentTemplateKey];
    const selectedFontFamily = fontSelector.value;
    const selectedColor = colorSelector.value;

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

            ctx.fillStyle = selectedColor || field.color;
            ctx.fillText(text, drawX, drawY);
        }
    });
}

// Download & Batch Generation
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