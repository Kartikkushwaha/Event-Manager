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
        // If not logged in, at least show one empty row so the UI isn't broken
        if (document.getElementById("guestContainer").innerHTML.trim() === "") {
            createGuest();
        }
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

// Function to create a guest row (can be empty or pre-filled)
function createGuest(name = "", address = "", phone = "") {
    if (!guestContainer) return; 

    const row = document.createElement("div");
    row.classList.add("guest-row");
    
    // Safely inject values to prevent "undefined" from showing up
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

    guestContainer.appendChild(row);
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
                // Clear out the loading state/empty rows
                guestContainer.innerHTML = ""; 
                
                // Rebuild the rows from the database
                data.guests.forEach(guest => {
                    createGuest(guest.name, guest.address, guest.phone);
                });
                return; // Stop here on success
            }
        }
        
        // If the document doesn't exist yet, or the guest array is empty
        if (guestContainer.innerHTML.trim() === "") createGuest();
        
    } catch (error) {
        console.error("Error loading guests:", error);
        // If Firebase blocks the read, show an empty row anyway so the app is usable
        if (guestContainer.innerHTML.trim() === "") createGuest();
        alert("Failed to load your saved data. Check your Firebase Security Rules (allow read).");
    }
}

if (addGuestBtn) {
    addGuestBtn.addEventListener("click", () => createGuest());
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

        // Change button text to show it's working
        const originalText = saveGuestBtn.textContent;
        saveGuestBtn.textContent = "Saving...";

        const rows = document.querySelectorAll(".guest-row");
        const guestList = [];

        rows.forEach((row) => {
            const name = row.querySelector(".guest-name").value.trim();
            const address = row.querySelector(".guest-address").value.trim();
            const phone = row.querySelector(".guest-phone").value.trim();

            if (name) {
                guestList.push({ name, address, phone });
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
        // 1. Ask for confirmation to prevent accidental clicks
        const isConfirmed = confirm("Are you sure you want to delete ALL guests? This cannot be undone.");
        
        if (isConfirmed) {
            // 2. Clear the screen immediately
            guestContainer.innerHTML = ""; 
            createGuest(); // Add one blank row back so the UI isn't completely empty
            updateGuestNumbers();

            // 3. Immediately wipe the data from Firebase if logged in
            if (currentUserUid) {
                removeAllBtn.textContent = "Deleting...";
                
                try {
                    const userDocRef = doc(db, "users", currentUserUid);
                    // Overwrite the guests array with an empty array in the cloud
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

        // 1. Gather all valid guest rows from the screen
        rows.forEach((row) => {
            const name = row.querySelector(".guest-name").value.trim();
            const address = row.querySelector(".guest-address").value.trim();
            const phone = row.querySelector(".guest-phone").value.trim();

            // Only include rows where the user actually entered a name
            if (name) {
                guestData.push([guestData.length + 1, name, address || "-", phone || "-"]);
            }
        });

        // 2. Prevent exporting an empty list
        if (guestData.length === 0) {
            alert("Your guest list is empty! Please add at least one guest before exporting.");
            return;
        }

        // 3. Verify that the library loaded correctly
        if (!window.jspdf) {
            alert("PDF library is still loading or missing. Please check your HTML script tags.");
            return;
        }

        // 4. Initialize the PDF Document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 5. Add Document Branding & Title (EventEase Theme)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235); // EventEase Blue (#2563eb)
        doc.text("EventEase - Guest List", 14, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Guests: ${guestData.length} | Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        // 6. Generate the Styled Table
        doc.autoTable({
            startY: 34,
            head: [["S.No.", "Guest Name", "Address", "Phone Number"]],
            body: guestData,
            theme: "grid",
            headStyles: {
                fillColor: [37, 99, 235], // EventEase Blue header
                textColor: 255,
                fontStyle: "bold",
                halign: "left"
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // Light grey alternate rows
            },
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 6,
                textColor: [15, 23, 42] // Dark slate text
            },
            columnStyles: {
                0: { cellWidth: 18, halign: "center" }, // S.No.
                1: { cellWidth: 50 },                   // Name
                2: { cellWidth: "auto" },               // Address (takes remaining space)
                3: { cellWidth: 42 }                    // Phone
            }
        });

        // 7. Automatically Trigger the File Download
        doc.save("EventEase_Guest_List.pdf");
    });
}