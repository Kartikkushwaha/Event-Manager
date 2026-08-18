// ==========================================
// 1. THEME & UI LOGIC
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
// 2. TEMPLATE GENERATOR CONFIGURATION
// ==========================================
// Replace the 'src' properties here with your Google Drive direct image links.
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
    // --- VALENTINE'S DAY TEMPLATES ---
    "val_1": {
        name: "Val 1",
        src: "val_1.png",
        fields: [
            { id: "val_f1", label: "Headline", x: 791, y: 640, font: "bold 60px Arial", color: "#211104", align: "left" },
            { id: "val_f2", label: "Guest Name", x: 718, y: 771, font: "bold 60px Arial", color: "#211104", align: "left" },
            { id: "val_f3", label: "Message", x: 665, y: 979, font: "bold 60px Arial", color: "#211104", align: "center" }
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
            { id: "location", label: "Location", x: 723, y: 1532, font: "bold 60px Arial", color: "#000000", align: "left" }
        ]
    }
    // Add the rest of your 12 templates for each category exactly like this...
};

// ==========================================
// 3. GENERATOR LOGIC
// ==========================================
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const inputContainer = document.getElementById('inputContainer');
const templateSelector = document.getElementById('templateSelector');
const fontSelector = document.getElementById('fontSelector');
const modal = document.getElementById('generatorModal');

let currentTemplateKey = null;
let currentImage = new Image();

// Redraw canvas on font change
fontSelector.addEventListener('change', drawCanvas);

// Modal Controls
function openModal(categoryPrefix) {
    if(isDragging) return; // Prevent open if user was swiping the carousel
    modal.style.display = 'block';
    
    // Set Modal Title based on prefix
    const titleMap = {
        'bd_': 'Birthday Templates',
        'val_': 'Valentine Templates',
        'bs_': 'Baby Shower Templates'
    };
    document.getElementById('modalCategoryTitle').innerText = titleMap[categoryPrefix] || 'Select Template';

    loadCategoryTemplates(categoryPrefix);
}

function closeModal() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) closeModal();
}

function loadCategoryTemplates(prefix) {
    templateSelector.innerHTML = '';
    let firstKey = null;

    for (const key in templates) {
        if (key.startsWith(prefix)) {
            if (!firstKey) firstKey = key;
            const btn = document.createElement('button');
            btn.className = 'template-btn';
            btn.innerText = templates[key].name;
            btn.onclick = (e) => loadTemplate(key, e);
            templateSelector.appendChild(btn);
        }
    }
    
    if (firstKey) {
        loadTemplate(firstKey);
        // Highlight first button
        setTimeout(() => {
            if(templateSelector.firstChild) templateSelector.firstChild.classList.add('active');
        }, 10);
    }
}

function loadTemplate(key, event) {
    currentTemplateKey = key;
    const config = templates[key];

    // Manage active state on buttons
    document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
    if (event) event.target.classList.add('active');

    // Build Inputs
    inputContainer.innerHTML = '';
    config.fields.forEach(field => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.innerText = field.label;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = field.id;
        input.placeholder = `Enter ${field.label}`;
        input.addEventListener('input', drawCanvas);

        group.appendChild(label);
        group.appendChild(input);
        inputContainer.appendChild(group);
    });

    // Load Image and Draw
    currentImage.onload = () => {
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        drawCanvas();
    };
    currentImage.src = config.src;
}

function drawCanvas() {
    if (!currentTemplateKey || !currentImage.src) return;
    const config = templates[currentTemplateKey];
    const selectedFontFamily = fontSelector.value;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);

    config.fields.forEach(field => {
        const inputElement = document.getElementById(field.id);
        
        if (inputElement && inputElement.value) {
            const text = inputElement.value;
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

document.getElementById('downloadBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `${currentTemplateKey}_invitation.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});