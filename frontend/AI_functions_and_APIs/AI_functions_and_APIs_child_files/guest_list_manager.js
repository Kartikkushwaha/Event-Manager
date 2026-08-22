import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Track login state AND load data if logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        console.log("User is logged in:", currentUserUid);
        loadGuestsFromFirestore(); 
    } else {
        currentUserUid = null;
    }
});

// Theme toggle button
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


// --- GUEST LIST UI & LOGIC ---

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

// Function to create a guest row
function createGuest(name = "", address = "", phone = "", prepend = false, id = null) {
    if (!guestContainer) return; 

    const row = document.createElement("div");
    row.classList.add("guest-row");
    
    // Assign a creation timestamp ID to track Newest/Oldest accurately
    row.dataset.id = id || Date.now() + Math.random();
    
    row.innerHTML = `
        <div class="serial-box"></div>
        <input type="text" class="guest-name" placeholder="Guest Name" value="${name || ""}" required>
        <input type="text" class="guest-address" placeholder="Address" value="${address || ""}">
        <input type="tel" class="guest-phone" placeholder="Phone" value="${phone || ""}">
        <button class="deleteBtn">Delete</button>
    `;

    row.querySelector(".deleteBtn").addEventListener("click", () => {
        row.remove();
        updateGuestNumbers();
    });

    // Insert at the top (row 1) if requested, otherwise append
    if (prepend && guestContainer.firstChild) {
        guestContainer.prepend(row);
    } else {
        guestContainer.appendChild(row);
    }

    updateGuestNumbers();
}

// --- SORTING LOGIC ---
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
            // time-newest: highest timestamp (most recent) at the top
            // time-oldest: lowest timestamp (earliest added) at the top
            return criteria === "time-newest" ? idB - idA : idA - idB;
        }
        return 0;
    });

    // Re-insert rows into container in sorted order
    rows.forEach(row => guestContainer.appendChild(row));
    
    // Update visual S.No sequentially from top to bottom
    updateGuestNumbers();
}

// Function to pull data from Firebase and display it
async function loadGuestsFromFirestore() {
    if (!currentUserUid || !guestContainer) return;

    try {
        const userDocRef = doc(db, "users", currentUserUid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.guests && Array.isArray(data.guests) && data.guests.length > 0) {
                guestContainer.innerHTML = ""; 
                
                // Rebuild rows preserving their original saved ID and order
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

// When user clicks '+ Add Guest', insert at the TOP (prepend = true)
if (addGuestBtn) {
    addGuestBtn.addEventListener("click", () => createGuest("", "", "", true));
}


// --- SAVE LOGIC ---
const saveGuestBtn = document.getElementById("saveGuestBtn");
if (saveGuestBtn) {
    saveGuestBtn.addEventListener("click", async (e) => {
        e.preventDefault(); 

        if (!currentUserUid) {
            alert("You must be logged in to save guests!");
            return;
        }

        const originalText = saveGuestBtn.textContent;
        saveGuestBtn.textContent = "Saving...";

        const rows = document.querySelectorAll(".guest-row");
        const guestList = [];

        rows.forEach((row) => {
            const name = row.querySelector(".guest-name").value.trim();
            const address = row.querySelector(".guest-address").value.trim();
            const phone = row.querySelector(".guest-phone").value.trim();
            const id = parseFloat(row.dataset.id);

            if (name) {
                // Save the dataset ID so Newest/Oldest sorting remains consistent across sessions
                guestList.push({ name, address, phone, id });
            }
        });

        try {
            const userDocRef = doc(db, "users", currentUserUid);
            await setDoc(userDocRef, {
                guests: guestList,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            saveGuestBtn.textContent = "Saved! ✓";
            setTimeout(() => saveGuestBtn.textContent = originalText, 2000);
            
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Failed to save data. You might not have write permission.");
            saveGuestBtn.textContent = originalText;
        }
    });
}

// --- DELETE ALL LOGIC ---
const removeAllBtn = document.getElementById("RemoveGuestBtn");

if (removeAllBtn) {
    removeAllBtn.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to delete ALL guests? This cannot be undone.");
        
        if (isConfirmed) {
            guestContainer.innerHTML = ""; 
            updateGuestNumbers();

            if (currentUserUid) {
                removeAllBtn.textContent = "Deleting...";
                
                try {
                    const userDocRef = doc(db, "users", currentUserUid);
                    await setDoc(userDocRef, {
                        guests: [],
                        lastUpdated: new Date().toISOString()
                    }, { merge: true });

                    removeAllBtn.textContent = "Delete All";
                    alert("All guests have been permanently deleted!");
                    
                } catch (error) {
                    console.error("Error deleting guests: ", error);
                    alert("Failed to delete from cloud. Check console.");
                    removeAllBtn.textContent = "Delete All";
                }
            }
        }
    });
}

// --- EXPORT TO PDF LOGIC ---
const exportBtn = document.getElementById("ExportGuestBtn");

if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        const rows = document.querySelectorAll(".guest-row");
        const guestData = [];

        // Traverses the screen in exact visual DOM order
        rows.forEach((row) => {
            const name = row.querySelector(".guest-name").value.trim();
            const address = row.querySelector(".guest-address").value.trim();
            const phone = row.querySelector(".guest-phone").value.trim();

            if (name) {
                guestData.push([guestData.length + 1, name, address || "-", phone || "-"]);
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
        doc.text("EventEase - Guest List", 14, 20);

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

        doc.save("EventEase_Guest_List.pdf");
    });
}
