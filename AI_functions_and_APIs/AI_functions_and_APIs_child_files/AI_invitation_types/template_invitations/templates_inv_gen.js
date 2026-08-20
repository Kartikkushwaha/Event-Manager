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
        
        // Fetch User's Guest List
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

// Drag to Scroll Logic 
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
        name: "BD 1",
        src: "bd_1.png", 
        fields: [
            { id: "birthName", label: "Birthday Person Name", x: 795, y: 735, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "guestName", label: "Guest Name", x: 802, y: 1004, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "ageMilestone", label: "Age or Milestone", x: 850, y: 1274, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "dateTime", label: "Date and Time", x: 865, y: 1545, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "location", label: "Location", x: 789, y: 1817, font: "bold 60px Arial", color: "#000000", align: "center" },
            { id: "rsvp", label: "RSVP Info", x: 750, y: 2085, font: "bold 60px Arial", color: "#000000", align: "center" }
        ]
    },
    "bd_2": {
        name: "BD 2",
        src: "bd_2.png",
        fields: [
            { id: "birthName", label: "Birthday Person Name", x: 993, y: 645, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 706, y: 772, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "ageMilestone", label: "Age or Milestone", x: 847, y: 898, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 758, y: 1026, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "location", label: "Location", x: 600, y: 1154, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "rsvp", label: "RSVP Info", x: 650, y: 1289, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    // --- BABY SHOWER TEMPLATES ---
    "bs_1": {
        name: "BS 1",
        src: "bs_1.png", 
        fields: [
            { id: "momName", label: "Mom-to-be Name", x: 943, y: 1100, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "guestName", label: "Guest Name", x: 811, y: 1244, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "dateTime", label: "Date and Time", x: 875, y: 1390, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "location", label: "Location", x: 723, y: 1532, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "hostedBy", label: "Hosted By", x: 763, y: 1676, font: "bold 60px Arial", color: "#000000", align: "left" },
            { id: "rsvp", label: "RSVP Info", x: 768, y: 1821, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    },
    // --- VALENTINE'S DAY TEMPLATES ---
    "val_1": {
        name: "Val 1",
        src: "val_12.png", 
        fields: [
            { id: "valName", label: "My Valentine", x: 786, y: 812, font: "bold 60px Arial", color: "#211104", align: "center" },
            { id: "guestName", label: "Nickname/Guest", x: 786, y: 960, font: "bold 60px Arial", color: "#211104", align: "center" }, /* Standardized to guestName for logic */
            { id: "valMessage", label: "Love Message", x: 801, y: 1112, font: "bold 60px Arial", color: "#211104", align: "center" },
            { id: "valMemory", label: "Special Memory", x: 839, y: 1264, font: "bold 60px Arial", color: "#211104", align: "center" },
            { id: "valDate", label: "Date", x: 680, y: 1357, font: "bold 60px Arial", color: "#211104", align: "left" },
            { id: "valTime", label: "Time", x: 682, y: 1446, font: "bold 60px Arial", color: "#211104", align: "left" },
            { id: "valVenue", label: "Venue", x: 710, y: 1532, font: "bold 60px Arial", color: "#211104", align: "left" },
            { id: "valSurprise", label: "Special Surprise", x: 761, y: 1689, font: "bold 60px Arial", color: "#211104", align: "center" },
            { id: "valRSVP", label: "RSVP / Contact", x: 978, y: 1774, font: "bold 60px Arial", color: "#211104", align: "left" },
            { id: "valClosing", label: "Closing Line", x: 768, y: 1936, font: "bold 60px Arial", color: "#211104", align: "left" }
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
const modal = document.getElementById('generatorModal');

let currentTemplateKey = null;
let currentImage = new Image();
let generationMode = "manual"; // "manual" | "guestlist"
let pendingTemplateKey = null;
let selectedGuestNames = []; // Stores the guests selected from the modal

fontSelector.addEventListener('change', () => drawCanvas());

// Close Modal Window Clicks
window.onclick = function(event) {
    if (event.target == modal) window.closeModal();
    if (event.target == document.getElementById('modeSelectionModal')) window.closeModeModal();
    if (event.target == document.getElementById('guestSelectionModal')) window.closeGuestSelectionModal();
}

// -----------------------------------------------------------------
// WINDOW EXPORTS FOR HTML ONCLICK HANDLERS (Since this is a module)
// -----------------------------------------------------------------
window.openModal = function(categoryPrefix) {
    if(isDragging) return; 
    
    // Configure Top Level Category Modal
    modal.style.display = 'block';
    const titleMap = {
        'bd_': 'Birthday Templates',
        'val_': 'Valentine Templates',
        'bs_': 'Baby Shower Templates'
    };
    document.getElementById('modalCategoryTitle').innerText = titleMap[categoryPrefix] || 'Select Template';

    // Load Buttons
    templateSelector.innerHTML = '';
    let firstKey = null;

    for (const key in templates) {
        if (key.startsWith(categoryPrefix)) {
            if (!firstKey) firstKey = key;
            const btn = document.createElement('button');
            btn.className = 'template-btn';
            btn.innerText = templates[key].name;
            
            // Intercept Template click to ask for Generation Mode
            btn.onclick = (e) => {
                pendingTemplateKey = key;
                document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show Mode Selection Modal First
                document.getElementById('modeSelectionModal').style.display = 'block';
            };
            templateSelector.appendChild(btn);
        }
    }
    
    if (firstKey) {
        pendingTemplateKey = firstKey;
        setTimeout(() => {
            if(templateSelector.firstChild) {
                templateSelector.firstChild.classList.add('active');
                // Automatically prompt on first load
                document.getElementById('modeSelectionModal').style.display = 'block';
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

    // Populate Checkboxes
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

    // Reset Select All
    document.getElementById('selectAllGuests').checked = false;

    // Show Guest List Modal
    document.getElementById('guestSelectionModal').style.display = 'block';
});

// Select All Checkbox Logic
document.getElementById('selectAllGuests').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.guest-cb');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
});

// Proceed with Selected Guests Logic
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

    // Build Inputs
    inputContainer.innerHTML = '';
    config.fields.forEach(field => {
        // If in Guestlist Mode, hide the Guest Name input field
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

    // Update Download Button Text Contextually
    const dlBtn = document.getElementById('downloadBtn');
    if (generationMode === "guestlist") {
        dlBtn.innerText = `Generate Invitations (${selectedGuestNames.length})`;
    } else {
        dlBtn.innerText = `Download Image`;
    }

    // Load Image and Draw
    currentImage.onload = () => {
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        drawCanvas();
    };
    currentImage.src = config.src;
}

// Accepts an optional override parameter specifically for bulk rendering
function drawCanvas(overrideGuestName = null) {
    if (!currentTemplateKey || !currentImage.src) return;
    const config = templates[currentTemplateKey];
    const selectedFontFamily = fontSelector.value;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);

    config.fields.forEach(field => {
        let text = "";

        if (generationMode === "guestlist" && field.id === "guestName") {
            // Use the override during the loop, or show a preview placeholder
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

            ctx.fillStyle = field.color;
            ctx.fillText(text, drawX, drawY);
        }
    });
}

// -----------------------------------------------------------------
// DOWNLOAD & BULK GENERATION PROCESS
// -----------------------------------------------------------------
document.getElementById('downloadBtn').addEventListener('click', async () => {
    
    // Single Manual Download
    if (generationMode === "manual") {
        const link = document.createElement('a');
        link.download = `${currentTemplateKey}_invitation.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
    }

    // Bulk Generation
    const dlBtn = document.getElementById('downloadBtn');
    const originalText = dlBtn.innerText;
    dlBtn.innerText = "Generating...";
    dlBtn.disabled = true;

    for (let i = 0; i < selectedGuestNames.length; i++) {
        const currentName = selectedGuestNames[i];
        
        // 1. Draw Canvas with specific guest name
        drawCanvas(currentName);
        
        // 2. Await tiny delay to ensure rendering context finishes
        await new Promise(r => setTimeout(r, 100)); 

        // 3. Trigger Download
        const link = document.createElement('a');
        // Clean filename (remove spaces, etc.)
        const safeFileName = currentName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); 
        link.download = `${currentTemplateKey}_for_${safeFileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // 4. Await delay to prevent browser from blocking multiple automatic downloads (Spam protection)
        await new Promise(r => setTimeout(r, 500)); 
    }

    // Reset UI to preview state
    drawCanvas(); 
    dlBtn.innerText = "Completed ✓";
    
    setTimeout(() => {
        dlBtn.innerText = originalText;
        dlBtn.disabled = false;
    }, 2000);
});