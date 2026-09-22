// guest_list_manager.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAhfKUyOjzZijEblzFhbm8f1budNPThudQ",
    authDomain: "veloevent.firebaseapp.com",
    projectId: "veloevent",
    storageBucket: "veloevent.firebasestorage.app",
    messagingSenderId: "185975138221",
    appId: "1:185975138221:web:762d3d825a5972e4752324",
    measurementId: "G-XVGT5GNNNZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserUid = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        console.log("User is logged in:", currentUserUid);
        loadGuestsFromFirestore(); 
    } else {
        currentUserUid = null;
    }
});

const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}
themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙";
    }
});

const addGuestBtn = document.getElementById("addGuestBtn");
const guestContainer = document.getElementById("guestContainer");
const guestCount = document.getElementById("guestCount");
const sortSelect = document.getElementById("sortGuests");

function updateGuestNumbers() {
    const rows = document.querySelectorAll(".guest-row");
    rows.forEach((row, index) => {
        const serialBox = row.querySelector(".serial-box");
        if(serialBox) serialBox.textContent = index + 1;
    });
    if (guestCount) {
        guestCount.textContent = `Total Guests: ${rows.length}`;
    }
}

// Updated Function to inject the split phone fields into every newly created row dynamically
function createGuest(name = "", address = "", phone = "", prepend = false, id = null) {
    if (!guestContainer) return; 

    const row = document.createElement("div");
    row.classList.add("guest-row");
    row.dataset.id = id || Date.now() + Math.random();

    let defaultCode = "+1";
    let numberOnly = phone || "";
    
    // Parse combined saved formats back into code + number (e.g. "+91 9876543210")
    if (phone && phone.startsWith("+") && phone.includes(" ")) {
        const parts = phone.split(" ");
        defaultCode = parts[0];
        numberOnly = parts.slice(1).join("").replace(/[^0-9]/g, '').slice(0, 10);
    } else if (phone) {
        numberOnly = phone.replace(/[^0-9]/g, '').slice(0, 10);
    }
    
    row.innerHTML = `
        <div class="serial-box"></div>
        <input type="text" class="guest-name" placeholder="Guest Name" value="${name || ""}" required>
        <input type="text" class="guest-address" placeholder="Address" value="${address || ""}">
        
        <div class="phone-container">
            <select class="guest-country">
                <option value="+1" ${defaultCode === "+1" ? "selected" : ""}>🇺🇸 +1</option>
                <option value="+86" ${defaultCode === "+86" ? "selected" : ""}>🇨🇳 +86</option>
                <option value="+49" ${defaultCode === "+49" ? "selected" : ""}>🇩🇪 +49</option>
                <option value="+91" ${defaultCode === "+91" ? "selected" : ""}>🇮🇳 +91</option>
                <option value="+81" ${defaultCode === "+81" ? "selected" : ""}>🇯🇵 +81</option>
                <option value="+44" ${defaultCode === "+44" ? "selected" : ""}>🇬🇧 +44</option>
                <option value="+33" ${defaultCode === "+33" ? "selected" : ""}>🇫🇷 +33</option>
                <option value="+39" ${defaultCode === "+39" ? "selected" : ""}>🇮🇹 +39</option>
                <option value="+7" ${defaultCode === "+7" ? "selected" : ""}>🇷🇺 +7</option>
                <option value="+55" ${defaultCode === "+55" ? "selected" : ""}>🇧🇷 +55</option>
                <option value="+82" ${defaultCode === "+82" ? "selected" : ""}>🇰🇷 +82</option>
                <option value="+61" ${defaultCode === "+61" ? "selected" : ""}>🇦🇺 +61</option>
                <option value="+52" ${defaultCode === "+52" ? "selected" : ""}>🇲🇽 +52</option>
                <option value="+34" ${defaultCode === "+34" ? "selected" : ""}>🇪🇸 +34</option>
                <option value="+62" ${defaultCode === "+62" ? "selected" : ""}>🇮🇩 +62</option>
                <option value="+966" ${defaultCode === "+966" ? "selected" : ""}>🇸🇦 +966</option>
                <option value="+31" ${defaultCode === "+31" ? "selected" : ""}>🇳🇱 +31</option>
                <option value="+90" ${defaultCode === "+90" ? "selected" : ""}>🇹🇷 +90</option>
                <option value="+41" ${defaultCode === "+41" ? "selected" : ""}>🇨🇭 +41</option>
                <option value="+66" ${defaultCode === "+66" ? "selected" : ""}>🇹🇭 +66</option>
                <option value="+353" ${defaultCode === "+353" ? "selected" : ""}>🇮🇪 +353</option>
                <option value="+43" ${defaultCode === "+43" ? "selected" : ""}>🇦🇹 +43</option>
                <option value="+972" ${defaultCode === "+972" ? "selected" : ""}>🇮🇱 +972</option>
                <option value="+971" ${defaultCode === "+971" ? "selected" : ""}>🇦🇪 +971</option>
                <option value="+65" ${defaultCode === "+65" ? "selected" : ""}>🇸🇬 +65</option>
                <option value="+47" ${defaultCode === "+47" ? "selected" : ""}>🇳🇴 +47</option>
                <option value="+84" ${defaultCode === "+84" ? "selected" : ""}>🇻🇳 +84</option>
                <option value="+63" ${defaultCode === "+63" ? "selected" : ""}>🇵🇭 +63</option>
                <option value="+60" ${defaultCode === "+60" ? "selected" : ""}>🇲🇾 +60</option>
                <option value="+45" ${defaultCode === "+45" ? "selected" : ""}>🇩🇰 +45</option>
                <option value="+27" ${defaultCode === "+27" ? "selected" : ""}>🇿🇦 +27</option>
                <option value="+852" ${defaultCode === "+852" ? "selected" : ""}>🇭🇰 +852</option>
                <option value="+57" ${defaultCode === "+57" ? "selected" : ""}>🇨🇴 +57</option>
                <option value="+40" ${defaultCode === "+40" ? "selected" : ""}>🇷🇴 +40</option>
                <option value="+56" ${defaultCode === "+56" ? "selected" : ""}>🇨🇱 +56</option>
                <option value="+420" ${defaultCode === "+420" ? "selected" : ""}>🇨🇿 +420</option>
                <option value="+358" ${defaultCode === "+358" ? "selected" : ""}>🇫🇮 +358</option>
                <option value="+351" ${defaultCode === "+351" ? "selected" : ""}>🇵🇹 +351</option>
                <option value="+64" ${defaultCode === "+64" ? "selected" : ""}>🇳🇿 +64</option>
                <option value="+30" ${defaultCode === "+30" ? "selected" : ""}>🇬🇷 +30</option>
                <option value="+51" ${defaultCode === "+51" ? "selected" : ""}>🇵🇪 +51</option>
            </select>
            <input 
                type="tel" 
                class="guest-phone"
                placeholder="Phone Number" 
                value="${numberOnly}"
                maxlength="10" 
                pattern="[0-9]{1,10}" 
                oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);"
                required>
        </div>
        
        <button class="deleteBtn"><i data-lucide="trash-2"></i></button>
    `;

    row.querySelector(".deleteBtn").addEventListener("click", () => {
        row.remove();
        updateGuestNumbers();
    });

    if (prepend && guestContainer.firstChild) {
        guestContainer.prepend(row);
    } else {
        guestContainer.appendChild(row);
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    updateGuestNumbers();
}

if (sortSelect) {
    sortSelect.addEventListener("change", () => {
        sortGuestList(sortSelect.value);
    });
}

function sortGuestList(criteria) {
    const rows = Array.from(document.querySelectorAll(".guest-row"));
    
    rows.sort((a, b) => {
        if (criteria === "alpha-asc" || criteria === "alpha-desc") {
            const nameA = a.querySelector(".guest-name").value.trim().toLowerCase();
            const nameB = b.querySelector(".guest-name").value.trim().toLowerCase();
            return criteria === "alpha-asc" 
                ? nameA.localeCompare(nameB) 
                : nameB.localeCompare(nameA);
        } else if (criteria === "time-newest" || criteria === "time-oldest") {
            const idA = parseFloat(a.dataset.id);
            const idB = parseFloat(b.dataset.id);
            return criteria === "time-newest" ? idB - idA : idA - idB;
        }
        return 0;
    });

    rows.forEach(row => guestContainer.appendChild(row));
    updateGuestNumbers();
}

async function loadGuestsFromFirestore() {
    if (!currentUserUid || !guestContainer) return;

    try {
        const userDocRef = doc(db, "users", currentUserUid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.guests && Array.isArray(data.guests) && data.guests.length > 0) {
                guestContainer.innerHTML = ""; 
                
                data.guests.forEach((guest, index) => {
                    createGuest(guest.name, guest.address, guest.phone, false, guest.id || (Date.now() + index));
                });
            }
        }
    } catch (error) {
        console.error("Error loading guests:", error);
        alert("Failed to load your saved data. Check your Firebase Security Rules (allow read).");
    }
}

if (addGuestBtn) {
    addGuestBtn.addEventListener("click", () => createGuest("", "", "", true));
}

const saveGuestBtn = document.getElementById("saveGuestBtn");
if (saveGuestBtn) {
    saveGuestBtn.addEventListener("click", async (e) => {
        e.preventDefault(); 

        if (!currentUserUid) {
            alert("You must be logged in to save guests!");
            return;
        }

        const textSpan = saveGuestBtn.querySelector('.btn-text');
        textSpan.textContent = "Saving...";

        const rows = document.querySelectorAll(".guest-row");
        const guestList = [];

        rows.forEach((row) => {
            const name = row.querySelector(".guest-name").value.trim();
            const address = row.querySelector(".guest-address").value.trim();
            const code = row.querySelector(".guest-country").value;
            const number = row.querySelector(".guest-phone").value.trim();
            const phone = number ? `${code} ${number}` : ""; 
            const id = parseFloat(row.dataset.id);

            if (name) {
                guestList.push({ name, address, phone, id });
            }
        });

        try {
            const userDocRef = doc(db, "users", currentUserUid);
            await setDoc(userDocRef, {
                guests: guestList,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            textSpan.textContent = "Saved! ✓";
            setTimeout(() => {
                textSpan.textContent = "Save";
            }, 2000);
            
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Failed to save data. You might not have write permission.");
            textSpan.textContent = "Save";
        }
    });
}

const removeAllBtn = document.getElementById("RemoveGuestBtn");
if (removeAllBtn) {
    removeAllBtn.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to delete ALL guests? This cannot be undone.");
        
        if (isConfirmed) {
            guestContainer.innerHTML = ""; 
            updateGuestNumbers();

            if (currentUserUid) {
                const textSpan = removeAllBtn.querySelector('.btn-text');
                textSpan.textContent = "Deleting...";
                
                try {
                    const userDocRef = doc(db, "users", currentUserUid);
                    await setDoc(userDocRef, {
                        guests: [],
                        lastUpdated: new Date().toISOString()
                    }, { merge: true });

                    textSpan.textContent = "Delete All";
                    alert("All guests have been permanently deleted!");
                    
                } catch (error) {
                    console.error("Error deleting guests: ", error);
                    alert("Failed to delete from cloud. Check console.");
                    textSpan.textContent = "Delete All";
                }
            }
        }
    });
}

const exportBtn = document.getElementById("ExportGuestBtn");
if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        const rows = document.querySelectorAll(".guest-row");
        const guestData = [];

        rows.forEach((row) => {
            const name = row.querySelector(".guest-name").value.trim();
            const address = row.querySelector(".guest-address").value.trim();
            const code = row.querySelector(".guest-country").value;
            const number = row.querySelector(".guest-phone").value.trim();
            const phone = number ? `${code} ${number}` : "-";

            if (name) {
                guestData.push([guestData.length + 1, name, address || "-", phone]);
            }
        });

        if (guestData.length === 0) {
            alert("Your guest list is empty! Please add at least one guest before exporting.");
            return;
        }

        if (!window.jspdf) {
            alert("PDF library is still loading or missing. Please check your HTML script tags.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235); 
        doc.text("VeloEvent - Guest List", 14, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Guests: ${guestData.length} | Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        doc.autoTable({
            startY: 34,
            head: [["S.No.", "Guest Name", "Address", "Phone Number"]],
            body: guestData,
            theme: "grid",
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontStyle: "bold",
                halign: "left"
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] 
            },
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 6,
                textColor: [15, 23, 42] 
            },
            columnStyles: {
                0: { cellWidth: 18, halign: "center" },
                1: { cellWidth: 50 },                 
                2: { cellWidth: "auto" },               
                3: { cellWidth: 42 }                    
            }
        });

        doc.save("veloevent_Guest_List.pdf");
    });
}

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