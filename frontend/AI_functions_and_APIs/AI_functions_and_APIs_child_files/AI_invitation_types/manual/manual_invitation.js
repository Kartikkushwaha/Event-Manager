// ==========================================
// THEME & MOBILE NAVIGATION LOGIC
// ==========================================
const themeToggleBtn = document.getElementById('themeToggleBtn');
const htmlElement = document.body;

const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    htmlElement.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️';
}

themeToggleBtn.addEventListener('click', () => {
    htmlElement.classList.toggle('dark-mode');
    const isDark = htmlElement.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
});

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            navLinks.classList.toggle('active-menu');
            
            if (sidebarToggleBtn) {
                if (navLinks.classList.contains('active-menu')) {
                    sidebarToggleBtn.classList.add('tools-btn-hidden');
                } else if (!sidebar.classList.contains('open')) {
                    sidebarToggleBtn.classList.remove('tools-btn-hidden');
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active-menu') && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active-menu');
                if (sidebarToggleBtn && !sidebar.classList.contains('open')) {
                    sidebarToggleBtn.classList.remove('tools-btn-hidden');
                }
            }
        });
    }
});

// ==========================================
// SIDEBAR LOGIC
// ==========================================
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const overlay = document.getElementById('overlay');
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
    if (sidebarToggleBtn) sidebarToggleBtn.classList.toggle('tools-btn-hidden');
    
    // Recalculate canvas hit-boxes after layout changes on mobile
    setTimeout(() => canvas.calcOffset(), 300);
}

if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', toggleSidebar);
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', toggleSidebar);
if (overlay) overlay.addEventListener('click', toggleSidebar);

// ==========================================
// FABRIC.JS ENGINE & CORE FUNCTIONS
// ==========================================
const canvas = new fabric.Canvas('myCanvas', {
    backgroundColor: '#ffffff',
    preserveObjectStacking: true
});

window.addEventListener('resize', () => canvas.calcOffset());
let borderObj = null;

// Default Text
const defaultText = new fabric.IText("You're Invited!\nSpecial Celebration", {
    left: canvas.width / 2, top: 120, fontSize: 36, fill: '#333333', fontFamily: "'Pacifico', cursive", textAlign: 'center', originX: 'center'
});
canvas.add(defaultText);


// 1. FINALIZED: Download High-Res Invitation (Blob conversion for Mobile compatibility)
window.downloadCard = window.downloadInvitation = function() {
    try {
        canvas.discardActiveObject(); 
        canvas.renderAll();
        
        // Lowered multiplier slightly to 2 (1000x1400) to prevent mobile browser memory crashes
        const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2, quality: 1.0 }); 
        
        // Convert Base64 string to a raw Blob file
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'My_Event_Invitation.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up browser memory
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
        alert("Download failed. Please ensure you are not uploading images from restricted external websites.");
        console.error(err);
    }
};

// 2. FINALIZED: Bug-Free Delete Function
window.deleteSelected = window.deleteSelectedObjects = function() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
        canvas.discardActiveObject(); // CRITICAL FIX: Detach selection before removing
        activeObjects.forEach(obj => { 
            if(obj !== borderObj) canvas.remove(obj); 
        });
        canvas.renderAll();
    }
};

// 3. FINALIZED: Safely Clear Everything
window.clearCanvas = window.clearAllCanvas = function() {
    if(confirm("Are you sure you want to clear everything and start fresh?")) {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        borderObj = null;
        
        // Reset HTML Inputs safely
        const bWidth = document.getElementById('borderWidth');
        if (bWidth) bWidth.value = 0;
        const bVal = document.getElementById('borderWidthVal');
        if (bVal) bVal.innerText = '0';
        
        canvas.renderAll();
    }
};

// 4. FINALIZED: Keyboard Hook (Prevents deleting when typing in forms)
window.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject();
        // Do nothing if user is typing in a text field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (activeObj && activeObj.type === 'i-text' && activeObj.isEditing) return; 
        
        window.deleteSelectedObjects();
    }
});

// ==========================================
// CARD BORDER & BACKGROUNDS
// ==========================================
window.updateBorder = function() {
    let color = document.getElementById('borderColor').value;
    let width = parseInt(document.getElementById('borderWidth').value);
    let style = document.getElementById('borderStyle').value;
    
    document.getElementById('borderWidthVal').innerText = width;
    if (borderObj) canvas.remove(borderObj); 
    
    if (width > 0) {
        let dashArray = null;
        if (style === 'dashed') dashArray = [width * 3, width * 2]; 
        if (style === 'dotted') dashArray = [width, width * 1.5]; 

        borderObj = new fabric.Rect({
            left: canvas.width / 2, top: canvas.height / 2, 
            originX: 'center', originY: 'center', 
            width: canvas.width - width, height: canvas.height - width, 
            fill: 'transparent', stroke: color, strokeWidth: width, 
            strokeDashArray: dashArray,
            selectable: false, evented: false, strokeUniform: true 
        });
        canvas.add(borderObj);
        canvas.bringToFront(borderObj);
    }
    canvas.renderAll();
};

canvas.on('object:added', function(e) {
    if (borderObj && e.target !== borderObj) { canvas.bringToFront(borderObj); }
});

window.changeSolidBackground = function(color) {
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas)); 
    canvas.backgroundColor = color;
    canvas.renderAll();
};

window.applyCanvasGradient = function() {
    let c1 = document.getElementById('bgGrad1').value;
    let c2 = document.getElementById('bgGrad2').value;
    let type = document.getElementById('bgGradType').value;
    let coords = type === 'linear' ? { x1: 0, y1: 0, x2: canvas.width, y2: canvas.height } : { r1: 0, r2: canvas.width/1.5, x1: canvas.width/2, y1: canvas.height/2, x2: canvas.width/2, y2: canvas.height/2 };
    let gradient = new fabric.Gradient({ type: type, coords: coords, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] });
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas));
};

window.uploadBackgroundImage = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, function(img) {
            // Scales background perfectly to fill canvas
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            img.set({
                scaleX: scale, scaleY: scale,
                originX: 'center', originY: 'center',
                left: canvas.width / 2, top: canvas.height / 2
            });
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        });
    };
    reader.readAsDataURL(file);
};

// ==========================================
// TEXT FORMATTING (Multi-Select Supported)
// ==========================================
window.addText = function() {
    const newText = new fabric.IText("Double tap to edit", { left: canvas.width / 2, top: 250, fontSize: 28, fill: document.getElementById('textColorPicker').value, fontFamily: "'Poppins', sans-serif", originX: 'center' });
    canvas.add(newText);
    canvas.setActiveObject(newText);
};

window.changeFontFamily = function(fontName) {
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach(obj => { if (obj.type === 'i-text') obj.set('fontFamily', fontName); });
    canvas.renderAll();
};

window.changeSolidTextColor = function(color) {
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach(obj => { if (obj.type === 'i-text') obj.set('fill', color); });
    canvas.renderAll();
    document.getElementById('metallicType').value = ""; 
};

window.applyMetallicFont = function(type) {
    const textObjects = canvas.getActiveObjects().filter(obj => obj.type === 'i-text');
    if (textObjects.length === 0) { 
        alert("Please select a text object first!"); 
        document.getElementById('metallicType').value = ""; 
        return; 
    }
    
    let colorStops = [];
    if (type === 'gold') colorStops = [{offset: 0, color: '#BF953F'}, {offset: 0.5, color: '#FCF6BA'}, {offset: 1, color: '#B38728'}];
    else if (type === 'silver') colorStops = [{offset: 0, color: '#8A8D91'}, {offset: 0.5, color: '#E3E6E8'}, {offset: 1, color: '#979A9E'}];
    else if (type === 'bronze') colorStops = [{offset: 0, color: '#CD7F32'}, {offset: 0.5, color: '#FCDeb3'}, {offset: 1, color: '#A0522D'}];
    else return;

    textObjects.forEach(obj => {
        let gradient = new fabric.Gradient({ type: 'linear', coords: { x1: 0, y1: 0, x2: obj.width, y2: 0 }, colorStops: colorStops });
        obj.set('fill', gradient);
    });
    canvas.renderAll();
};

window.toggleTextStyle = function(property, value, unsetValue) {
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach(obj => { 
        if (obj.type === 'i-text') obj.set(property, obj.get(property) === value ? unsetValue : value); 
    });
    canvas.renderAll();
};

window.changeTextAlign = function(alignment) {
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach(obj => { if (obj.type === 'i-text') obj.set('textAlign', alignment); });
    canvas.renderAll();
};

// ==========================================
// IMAGES, SHAPES, & LAYERING
// ==========================================
window.uploadImage = function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(f) {
            fabric.Image.fromURL(f.target.result, function(img) {
                img.scaleToWidth(200); 
                canvas.add(img);
                canvas.centerObject(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
    });
    event.target.value = ''; 
};

window.addShape = function(type, isFilled) {
    let color = document.getElementById('shapeColor').value;
    let commonOptions = { left: canvas.width / 2, top: canvas.height / 2, originX: 'center', originY: 'center', fill: isFilled ? color : 'transparent', stroke: isFilled ? 'transparent' : color, strokeWidth: isFilled ? 0 : 3 };
    let shape;
    if (type === 'rect') shape = new fabric.Rect({ ...commonOptions, width: 100, height: 100 });
    else if (type === 'circle') shape = new fabric.Circle({ ...commonOptions, radius: 50 });
    else if (type === 'triangle') shape = new fabric.Triangle({ ...commonOptions, width: 110, height: 110 });
    if (shape) { canvas.add(shape); canvas.setActiveObject(shape); }
};

window.bringForward = function() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) { 
        activeObjects.forEach(obj => canvas.bringForward(obj)); 
        if (borderObj) canvas.bringToFront(borderObj); 
        canvas.renderAll(); 
    }
};

window.sendBackward = function() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) { 
        activeObjects.forEach(obj => canvas.sendBackwards(obj)); 
        canvas.renderAll(); 
    }
};