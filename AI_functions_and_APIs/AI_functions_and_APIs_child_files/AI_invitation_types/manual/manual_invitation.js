// --- UI LOGIC ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
}

// --- FABRIC JS LOGIC ---
const canvas = new fabric.Canvas('myCanvas', {
    backgroundColor: '#ffffff',
    preserveObjectStacking: true
});

window.addEventListener('resize', () => { canvas.calcOffset(); });

let borderObj = null;

// Default Text
const defaultText = new fabric.IText("You're Invited!\nSpecial Celebration", {
    left: canvas.width / 2, top: 120, fontSize: 36, fill: '#333333', fontFamily: "'Pacifico', cursive", textAlign: 'center', originX: 'center'
});
canvas.add(defaultText);

function downloadCard() {
    canvas.discardActiveObject(); 
    canvas.renderAll();
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1.0 });
    const link = document.createElement('a');
    link.download = 'My_Invitation_5x7.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function deleteSelected() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
        activeObjects.forEach(obj => { if(obj !== borderObj) canvas.remove(obj); });
        canvas.discardActiveObject(); 
    }
}

function clearCanvas() {
    if(confirm("Are you sure you want to clear everything?")) {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        borderObj = null;
        document.getElementById('borderWidth').value = 0;
        document.getElementById('borderWidthVal').innerText = '0';
        canvas.renderAll();
    }
}

window.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.type === 'i-text' && activeObj.isEditing) return; 
        deleteSelected();
    }
});

// --- MAIN BORDER STYLING ---
function updateBorder() {
    let color = document.getElementById('borderColor').value;
    let width = parseInt(document.getElementById('borderWidth').value);
    let style = document.getElementById('borderStyle').value;
    
    document.getElementById('borderWidthVal').innerText = width;
    
    if (borderObj) { canvas.remove(borderObj); }
    
    if (width > 0) {
        let dashArray = null;
        if (style === 'dashed') dashArray = [width * 3, width * 2]; // Responsive dash size
        if (style === 'dotted') dashArray = [width, width * 1.5]; // Responsive dot size

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
}

canvas.on('object:added', function(e) {
    if (borderObj && e.target !== borderObj) { canvas.bringToFront(borderObj); }
});

// --- IMAGE CORNER RADIUS & STYLING LOGIC ---
// Updates Sliders when an Image is selected
canvas.on('selection:created', loadSelectedItemSettings);
canvas.on('selection:updated', loadSelectedItemSettings);

function loadSelectedItemSettings(e) {
    const activeObj = e.selected[0];
    if (activeObj && activeObj.type === 'image') {
        document.getElementById('imgBorderColor').value = activeObj.stroke || '#000000';
        
        let sWidth = activeObj.strokeWidth || 0;
        document.getElementById('imgBorderWidth').value = sWidth;
        document.getElementById('imgBorderWidthVal').innerText = sWidth;
        
        let radius = 0;
        if (activeObj.clipPath && activeObj.clipPath.rx) {
            radius = activeObj.clipPath.rx;
        }
        document.getElementById('imgBorderRadius').value = radius;
        document.getElementById('imgBorderRadiusVal').innerText = radius;
    }
}

// Applies Sliders to Selected Image
function updateSelectedImage() {
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    const color = document.getElementById('imgBorderColor').value;
    const width = parseInt(document.getElementById('imgBorderWidth').value);
    const radius = parseInt(document.getElementById('imgBorderRadius').value);

    document.getElementById('imgBorderWidthVal').innerText = width;
    document.getElementById('imgBorderRadiusVal').innerText = radius;

    activeObj.set({ stroke: color, strokeWidth: width });

    if (radius > 0) {
        // Apply a clip path to cut the corners
        const clipPath = new fabric.Rect({
            width: activeObj.width,
            height: activeObj.height,
            rx: radius,
            ry: radius,
            originX: 'center',
            originY: 'center'
        });
        activeObj.set('clipPath', clipPath);
    } else {
        activeObj.set('clipPath', null);
    }
    canvas.renderAll();
}


// --- BACKGROUNDS ---
function changeSolidBackground(color) {
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas)); 
    canvas.backgroundColor = color;
    canvas.renderAll();
}

function applyCanvasGradient() {
    let c1 = document.getElementById('bgGrad1').value;
    let c2 = document.getElementById('bgGrad2').value;
    let type = document.getElementById('bgGradType').value;
    let coords = type === 'linear' ? { x1: 0, y1: 0, x2: canvas.width, y2: canvas.height } : { r1: 0, r2: canvas.width/1.5, x1: canvas.width/2, y1: canvas.height/2, x2: canvas.width/2, y2: canvas.height/2 };
    let gradient = new fabric.Gradient({ type: type, coords: coords, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] });
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas));
}

function uploadBackgroundImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, function(img) {
            img.set({ scaleX: canvas.width / img.width, scaleY: canvas.height / img.height });
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        });
    };
    reader.readAsDataURL(file);
}

// --- TEXT TOOLS ---
function addText() {
    const newText = new fabric.IText("Double tap to edit", { left: canvas.width / 2, top: 250, fontSize: 28, fill: document.getElementById('textColorPicker').value, fontFamily: "'Poppins', sans-serif", originX: 'center' });
    canvas.add(newText);
    canvas.setActiveObject(newText);
}

function changeFontFamily(fontName) {
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === 'i-text') { activeObj.set('fontFamily', fontName); canvas.renderAll(); }
}

function changeSolidTextColor(color) {
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === 'i-text') { activeObj.set('fill', color); canvas.renderAll(); document.getElementById('metallicType').value = ""; }
}

function applyMetallicFont(type) {
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'i-text') { alert("Please select a text object first!"); document.getElementById('metallicType').value = ""; return; }
    let colorStops = [];
    if (type === 'gold') colorStops = [{offset: 0, color: '#BF953F'}, {offset: 0.5, color: '#FCF6BA'}, {offset: 1, color: '#B38728'}];
    else if (type === 'silver') colorStops = [{offset: 0, color: '#8A8D91'}, {offset: 0.5, color: '#E3E6E8'}, {offset: 1, color: '#979A9E'}];
    else if (type === 'bronze') colorStops = [{offset: 0, color: '#CD7F32'}, {offset: 0.5, color: '#FCDeb3'}, {offset: 1, color: '#A0522D'}];
    else return;
    let gradient = new fabric.Gradient({ type: 'linear', coords: { x1: 0, y1: 0, x2: activeObj.width, y2: 0 }, colorStops: colorStops });
    activeObj.set('fill', gradient);
    canvas.renderAll();
}

function toggleTextStyle(property, value, unsetValue) {
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === 'i-text') { activeObj.set(property, activeObj.get(property) === value ? unsetValue : value); canvas.renderAll(); }
}

function changeTextAlign(alignment) {
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.type === 'i-text') { activeObj.set('textAlign', alignment); canvas.renderAll(); }
}

// --- IMAGES & SHAPES ---
function uploadImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, function(img) {
            if (img.width > 250) { img.scaleToWidth(250); }
            img.set({ left: canvas.width / 2, top: canvas.height / 2, originX: 'center', originY: 'center', strokeUniform: true });
            canvas.add(img);
            canvas.setActiveObject(img);
        });
    };
    reader.readAsDataURL(file);
}

function addShape(type, isFilled) {
    let color = document.getElementById('shapeColor').value;
    let commonOptions = { left: canvas.width / 2, top: canvas.height / 2, originX: 'center', originY: 'center', fill: isFilled ? color : 'transparent', stroke: isFilled ? 'transparent' : color, strokeWidth: isFilled ? 0 : 3 };
    let shape;
    if (type === 'rect') shape = new fabric.Rect({ ...commonOptions, width: 100, height: 100 });
    else if (type === 'circle') shape = new fabric.Circle({ ...commonOptions, radius: 50 });
    else if (type === 'triangle') shape = new fabric.Triangle({ ...commonOptions, width: 110, height: 110 });
    if (shape) { canvas.add(shape); canvas.setActiveObject(shape); }
}

function bringForward() {
    const activeObj = canvas.getActiveObject();
    if (activeObj) { canvas.bringForward(activeObj); if (borderObj) canvas.bringToFront(borderObj); canvas.renderAll(); }
}

function sendBackward() {
    const activeObj = canvas.getActiveObject();
    if (activeObj) { canvas.sendBackwards(activeObj); canvas.renderAll(); }
}
