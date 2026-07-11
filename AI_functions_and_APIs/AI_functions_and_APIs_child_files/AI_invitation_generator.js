/* ==========================================
   1. GLOBAL THEME & NAVBAR MANAGER
========================================== */
const themeBtn = document.getElementById("themeToggle");
const mobileBtn = document.getElementById("mobileMenuBtn");
const navLinks = document.getElementById("navLinks");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
    if (root.getAttribute("data-theme") === "dark") {
        root.removeAttribute("data-theme");
        themeBtn.textContent = "🌙";
        localStorage.setItem("theme", "light");
    } else {
        root.setAttribute("data-theme", "dark");
        themeBtn.textContent = "☀️";
        localStorage.setItem("theme", "dark");
    }
});

mobileBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    mobileBtn.textContent = navLinks.classList.contains("active") ? "✕" : "☰";
});


/* ==========================================
   2. HISTORY API SPA ROUTER & VIEW ENGINE
========================================== */
const appContent = document.getElementById("app-content");

const views = {
    "/home": `
        <div class="card-container">
            <div class="card">
                <h3>AI-Powered Creator</h3>
                <p>Leverage advanced artificial intelligence to instantly generate personalized and stunning invitations tailored specifically to your event's tone.</p>
                <a href="/ai" class="card-btn" data-link>Launch AI Generator</a>
            </div>
            <div class="card">
                <h3>Template-Based Creator</h3>
                <p>Browse our curated collection of professional templates. Customize colors, fonts, and layouts to match your theme seamlessly and effortlessly.</p>
                <a href="/templates" class="card-btn" data-link>Browse Templates</a>
            </div>
            <div class="card">
                <h3>Custom Manual Creator</h3>
                <p>Take absolute control of your design. Start from a blank canvas and build your invitation from scratch utilizing our advanced editing tools.</p>
                <a href="/manual" class="card-btn" data-link>Start from Scratch</a>
            </div>
        </div>
    `,
    "/templates": `
        <div class="header-text">
            <h1>Design premium invitations with exclusive templates</h1>
            <p>Hover to expand on desktop. Swipe or drag to explore.</p>
        </div>
        <div class="carousel-wrapper" id="carousel">
            <div class="template-track">
                ${['💍 Wedding', '🎉 Anniversary', '🎂 Birthday', '🍼 Baby Shower', '🎓 College Fest', '💼 Corporate', '👋 Farewell', '💖 Valentine'].map(item => {
                    const [icon, title] = item.split(' ');
                    return `
                    <div class="t-card" onclick="alert('Loading ${title} template...')">
                        <div style="font-size: 2.5rem; margin-bottom: 15px;">${icon}</div>
                        <h2>${title}</h2>
                        <p>Craft a stunning, personalized digital invitation tailored specifically for your celebration with clean aesthetics.</p>
                        <div class="t-card-footer">Start Designing &rarr;</div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `,
    "/manual": `
        <div class="editor-layout">
            <div class="tools-bar">
                <button class="menu-btn" id="sidebarToggleBtn">☰ Tools & Elements</button>
            </div>
            <div class="main-workspace">
                <div class="canvas-wrapper">
                    <canvas id="myCanvas" width="480" height="670"></canvas>
                </div>
            </div>
        </div>
        <div class="overlay" id="overlay"></div>
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h3>🎨 Creative Tools</h3>
                <button class="close-btn" id="closeSidebarBtn">×</button>
            </div>
            <div class="section">
                <button class="tool-btn btn-success" id="downloadBtn">💾 Download Invitation</button>
                <div class="btn-group">
                    <button class="tool-btn btn-danger" id="deleteBtn">🗑️ Delete</button>
                    <button class="tool-btn btn-danger" style="background:#f59e0b;" id="clearBtn">⚠️ Clear All</button>
                </div>
            </div>
            <div class="section">
                <div class="section-title">1. Background</div>
                <label>Solid Color:</label>
                <input type="color" value="#ffffff" id="bgColorPicker">
                <label style="margin-top:8px;">Gradient Background:</label>
                <div class="flex-row">
                    <div><input type="color" id="bgGrad1" value="#ff9a9e"></div>
                    <div><input type="color" id="bgGrad2" value="#fecfef"></div>
                </div>
                <select id="bgGradType" style="margin-top:6px;"><option value="linear">Linear</option><option value="radial">Radial</option></select>
                <button class="tool-btn btn-secondary" style="margin-top:8px;" id="applyGradBtn">Apply Gradient</button>
                <label style="margin-top:8px;">Upload BG Image:</label>
                <input type="file" accept="image/*" id="bgImageInput">
            </div>
            <div class="section">
                <div class="section-title">2. Card Border</div>
                <select id="borderStyle"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select>
                <div class="flex-row" style="margin-top:6px;">
                    <div><input type="color" id="borderColor" value="#d4af37"></div>
                    <div><input type="range" id="borderWidth" min="0" max="30" value="0"></div>
                </div>
            </div>
            <div class="section">
                <div class="section-title">3. Text Styling</div>
                <button class="tool-btn btn-success" id="addTextBtn">+ Add New Text</button>
                <select id="fontSelector" style="margin:8px 0;">
                    <option value="Arial">Arial</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Pacifico', cursive" class="f-pacifico">Pacifico</option>
                    <option value="'Oswald', sans-serif" class="f-oswald">Oswald</option>
                    <option value="'Lavishly Yours', cursive" class="f-lavishly">Lavishly Yours</option>
                </select>
                <input type="color" value="#333333" id="textColorPicker">
                <div class="btn-group" style="margin-top:8px;">
                    <button class="tool-btn btn-secondary" id="boldBtn"><b>B</b></button>
                    <button class="tool-btn btn-secondary" id="italicBtn"><i>I</i></button>
                    <button class="tool-btn btn-secondary" id="alignCenterBtn">Center</button>
                </div>
            </div>
            <div class="section">
                <div class="section-title">4. Stickers & Shapes</div>
                <input type="file" accept="image/*" multiple id="stickerInput">
                <div class="btn-group" style="margin-top:8px;">
                    <button class="tool-btn btn-secondary" id="shapeRectBtn">Square</button>
                    <button class="tool-btn btn-secondary" id="shapeCircBtn">Circle</button>
                </div>
                <div class="btn-group" style="margin-top:8px;">
                    <button class="tool-btn btn-secondary" id="forwardBtn">⬆️ Forward</button>
                    <button class="tool-btn btn-secondary" id="backwardBtn">⬇️ Backward</button>
                </div>
            </div>
        </aside>
    `,
    "/ai": `
        <div class="header-text" style="margin-top: 10vh;">
            <h1>🤖 AI Invitation Generator</h1>
            <p>This module is currently under development. Check back soon for automated generative layouts!</p>
            <br>
            <a href="/home" class="card-btn" data-link style="max-width: 200px; margin: 0 auto;">Return Home</a>
        </div>
    `
};

// Core History API Navigation
function navigateTo(url) {
    window.history.pushState(null, null, url);
    router();
}

function router() {
    let path = window.location.pathname;
    if (path === "/" || path === "/index.html" || !views[path]) {
        path = "/home";
    }

    appContent.innerHTML = views[path] || views["/home"];

    document.querySelectorAll(".nav-links a").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === path) {
            link.classList.add("active");
        }
    });

    navLinks.classList.remove("active");

    if (path === "/templates") initCarouselController();
    if (path === "/manual") initManualEditorController();
}

document.addEventListener("click", e => {
    if (e.target.matches("[data-link]")) {
        e.preventDefault();
        navigateTo(e.target.getAttribute("href"));
    }
});

window.addEventListener("popstate", router);
document.addEventListener("DOMContentLoaded", router);


/* ==========================================
   3. TEMPLATES CAROUSEL CONTROLLER
========================================== */
function initCarouselController() {
    const slider = document.getElementById("carousel");
    if (!slider) return;
    let isDown = false, startX, scrollLeft, isDragging = false;

    slider.addEventListener("mousedown", (e) => {
        isDown = true;
        isDragging = false;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener("mouseleave", () => isDown = false);
    
    slider.addEventListener("mouseup", (e) => {
        isDown = false;
        if (isDragging) {
            // Prevent click if we were dragging
            const card = e.target.closest('.t-card');
            if (card) {
                card.style.pointerEvents = 'none';
                setTimeout(() => card.style.pointerEvents = 'auto', 50);
            }
        }
    });
    
    slider.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true;
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
    });
}


/* ==========================================
   4. MANUAL EDITOR CONTROLLER (Fabric.js)
========================================== */
function initManualEditorController() {
    const canvasEl = document.getElementById("myCanvas");
    if (!canvasEl) return;

    const canvas = new fabric.Canvas("myCanvas", {
        backgroundColor: "#ffffff",
        preserveObjectStacking: true
    });

    let borderObj = null;

    const defaultText = new fabric.IText("You're Invited!\nSpecial Celebration", {
        left: canvas.width / 2, top: 120, fontSize: 32, fill: "#333333",
        fontFamily: "'Pacifico', cursive", textAlign: "center", originX: "center"
    });
    canvas.add(defaultText);

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const toggleSidebar = () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("open");
    };
    document.getElementById("sidebarToggleBtn").addEventListener("click", toggleSidebar);
    document.getElementById("closeSidebarBtn").addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", toggleSidebar);

    document.getElementById("downloadBtn").addEventListener("click", () => {
        canvas.discardActiveObject().renderAll();
        const link = document.createElement("a");
        link.download = "Invitation_Card.png";
        link.href = canvas.toDataURL({ format: "png", quality: 1.0 });
        link.click();
    });

    document.getElementById("deleteBtn").addEventListener("click", () => {
        canvas.getActiveObjects().forEach(obj => { if (obj !== borderObj) canvas.remove(obj); });
        canvas.discardActiveObject().renderAll();
    });

    document.getElementById("clearBtn").addEventListener("click", () => {
        if (confirm("Clear the entire canvas?")) {
            canvas.clear();
            canvas.backgroundColor = "#ffffff";
            borderObj = null;
            canvas.renderAll();
        }
    });

    document.getElementById("bgColorPicker").addEventListener("input", (e) => {
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        canvas.backgroundColor = e.target.value;
        canvas.renderAll();
    });

    document.getElementById("applyGradBtn").addEventListener("click", () => {
        const c1 = document.getElementById("bgGrad1").value;
        const c2 = document.getElementById("bgGrad2").value;
        const type = document.getElementById("bgGradType").value;
        const coords = type === "linear" ? { x1: 0, y1: 0, x2: canvas.width, y2: canvas.height } : { r1: 0, r2: canvas.width / 1.5, x1: canvas.width / 2, y1: canvas.height / 2, x2: canvas.width / 2, y2: canvas.height / 2 };
        const gradient = new fabric.Gradient({ type, coords, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] });
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas));
    });

    document.getElementById("bgImageInput").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                img.set({ scaleX: canvas.width / img.width, scaleY: canvas.height / img.height });
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            });
        };
        reader.readAsDataURL(file);
    });

    const updateBorder = () => {
        const color = document.getElementById("borderColor").value;
        const width = parseInt(document.getElementById("borderWidth").value);
        const style = document.getElementById("borderStyle").value;
        if (borderObj) canvas.remove(borderObj);
        if (width > 0) {
            let dashArray = null;
            if (style === "dashed") dashArray = [width * 3, width * 2];
            if (style === "dotted") dashArray = [width, width * 1.5];
            borderObj = new fabric.Rect({
                left: canvas.width / 2, top: canvas.height / 2, originX: "center", originY: "center",
                width: canvas.width - width, height: canvas.height - width,
                fill: "transparent", stroke: color, strokeWidth: width, strokeDashArray: dashArray,
                selectable: false, evented: false
            });
            canvas.add(borderObj);
            canvas.bringToFront(borderObj);
        }
        canvas.renderAll();
    };
    document.getElementById("borderColor").addEventListener("input", updateBorder);
    document.getElementById("borderWidth").addEventListener("input", updateBorder);
    document.getElementById("borderStyle").addEventListener("change", updateBorder);

    document.getElementById("addTextBtn").addEventListener("click", () => {
        const text = new fabric.IText("Double tap to edit", {
            left: canvas.width / 2, top: 250, fontSize: 24, fill: document.getElementById("textColorPicker").value,
            fontFamily: "'Poppins', sans-serif", originX: "center"
        });
        canvas.add(text).setActiveObject(text);
    });

    document.getElementById("fontSelector").addEventListener("change", (e) => {
        const active = canvas.getActiveObject();
        if (active && active.type === "i-text") { active.set("fontFamily", e.target.value); canvas.renderAll(); }
    });

    document.getElementById("textColorPicker").addEventListener("input", (e) => {
        const active = canvas.getActiveObject();
        if (active && active.type === "i-text") { active.set("fill", e.target.value); canvas.renderAll(); }
    });

    document.getElementById("boldBtn").addEventListener("click", () => {
        const active = canvas.getActiveObject();
        if (active && active.type === "i-text") { active.set("fontWeight", active.fontWeight === "bold" ? "normal" : "bold"); canvas.renderAll(); }
    });

    document.getElementById("italicBtn").addEventListener("click", () => {
        const active = canvas.getActiveObject();
        if (active && active.type === "i-text") { active.set("fontStyle", active.fontStyle === "italic" ? "normal" : "italic"); canvas.renderAll(); }
    });

    document.getElementById("alignCenterBtn").addEventListener("click", () => {
        const active = canvas.getActiveObject();
        if (active && active.type === "i-text") { active.set("textAlign", "center"); canvas.renderAll(); }
    });

    document.getElementById("stickerInput").addEventListener("change", (e) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (f) => {
                fabric.Image.fromURL(f.target.result, (img) => {
                    img.scaleToWidth(180);
                    canvas.add(img).centerObject(img).setActiveObject(img).renderAll();
                });
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    });

    const addShape = (type) => {
        const shape = type === "rect" 
            ? new fabric.Rect({ left: 200, top: 200, width: 80, height: 80, fill: "#2563eb", originX: "center", originY: "center" })
            : new fabric.Circle({ left: 200, top: 200, radius: 40, fill: "#f59e0b", originX: "center", originY: "center" });
        canvas.add(shape).setActiveObject(shape);
    };
    document.getElementById("shapeRectBtn").addEventListener("click", () => addShape("rect"));
    document.getElementById("shapeCircBtn").addEventListener("click", () => addShape("circ"));

    document.getElementById("forwardBtn").addEventListener("click", () => {
        const active = canvas.getActiveObject();
        if (active) { canvas.bringForward(active); if (borderObj) canvas.bringToFront(borderObj); canvas.renderAll(); }
    });

    document.getElementById("backwardBtn").addEventListener("click", () => {
        const active = canvas.getActiveObject();
        if (active) { canvas.sendBackwards(active); canvas.renderAll(); }
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
            const active = canvas.getActiveObject();
            if (active && active.type === "i-text" && active.isEditing) return;
            if (active && active !== borderObj) { canvas.remove(active); canvas.discardActiveObject().renderAll(); }
        }
    });
}