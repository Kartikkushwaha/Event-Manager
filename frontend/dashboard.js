import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

let currentFirebaseUser = null;
let userKey = ""; 

// Arrays to hold cross-event saved items and events
let globalVendors = [];
let globalVenues = [];
let globalEvents = [];
let globalShopWishlist = [];
let globalProductWishlist = [];

// --- 1. Authentication & Core Data Renderer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentFirebaseUser = user;
        userKey = user.email; 
        
        localStorage.setItem("userUID", user.uid); 
        
        renderDashboard();
        loadNearestUpcomingEvent(user.uid); 
        loadDashboardStats(user.uid); 
    } else {
        window.location.href = "index.html";
    }
});

function renderDashboard() {
    if (!currentFirebaseUser) return;

    const customName = localStorage.getItem(`userName_${userKey}`);
    const customPhoto = localStorage.getItem(`userPhoto_${userKey}`);
    const phone = localStorage.getItem(`userPhone_${userKey}`);
    const address = localStorage.getItem(`userAddress_${userKey}`);

    const defaultName = currentFirebaseUser.displayName || currentFirebaseUser.email.split('@')[0];
    const finalName = customName || defaultName;
    const finalPhoto = customPhoto || currentFirebaseUser.photoURL;

    document.getElementById("name").textContent = finalName;
    document.getElementById("email").textContent = currentFirebaseUser.email;

    const imgEl = document.getElementById("profilePhoto");
    const letterEl = document.getElementById("profileLetter");

    if (finalPhoto) {
        imgEl.src = finalPhoto;
        imgEl.style.display = "block";
        letterEl.style.display = "none";
    } else {
        letterEl.textContent = finalName.charAt(0).toUpperCase();
        letterEl.style.display = "flex";
        imgEl.style.display = "none";
    }

    const phoneEl = document.getElementById("phoneDisplay");
    if (phone) {
        phoneEl.textContent = `📞 ${phone}`;
        phoneEl.style.display = "block";
    } else {
        phoneEl.style.display = "none";
    }

    const addressEl = document.getElementById("addressDisplay");
    if (address) {
        addressEl.textContent = `📍 ${address}`;
        addressEl.style.display = "block";
    } else {
        addressEl.style.display = "none";
    }
}

// --- Dynamic Stats & Pop-up Logic ---
async function loadDashboardStats(uid) {
    try {
        const eventsRef = collection(db, "users", uid, "events");
        const snapshot = await getDocs(eventsRef);
        
        // Reset arrays on load
        globalVendors = [];
        globalVenues = [];
        globalEvents = [];
        globalShopWishlist = [];
        globalProductWishlist = [];

        // Keywords indicating a place/venue
        const venueKeywords = [
            'place', 'location', 'site', 'hotel', 'restaurant', 
            'dhaba', 'arena', 'center', 'cafe', 'beach', 
            'palace', 'venue', 'garden', 'banquet', 'resort', 'lawn'
        ];

        snapshot.forEach(doc => {
            const data = doc.data();
            const shopWishlist = data.shopWishlist || [];
            const productWishlistObj = data.wishlist || {};
            const eventName = data.eventName || "Unnamed Event";

            // Save basic event data for the events popup
            globalEvents.push({
                eventName: eventName,
                date_time: data.date_time,
                category: data.category || "General",
                state: data.state || "Not Specified"
            });

            // 1. Process Shops & Venues
            shopWishlist.forEach(shop => {
                const category = typeof shop.category === 'string' ? shop.category.toLowerCase() : "";
                const shopName = typeof shop.name === 'string' ? shop.name.toLowerCase() : "";
                
                const isVenue = venueKeywords.some(keyword => 
                    category.includes(keyword) || shopName.includes(keyword)
                );

                const shopData = { ...shop, savedForEvent: eventName };
                globalShopWishlist.push(shopData); // Add to unified shop wishlist

                if (isVenue) {
                    globalVenues.push(shopData);
                } else {
                    globalVendors.push(shopData);
                }
            });

            // 2. Process Product Wishlist
            // The product wishlist is stored as a dictionary of categories containing arrays
            Object.values(productWishlistObj).forEach(itemArray => {
                if (Array.isArray(itemArray)) {
                    itemArray.forEach(product => {
                        globalProductWishlist.push({ ...product, savedForEvent: eventName });
                    });
                }
            });
        });

        // Target the parent stat boxes
        const statBoxes = document.querySelectorAll(".stat-box");
        if (statBoxes.length >= 3) {
            statBoxes[0].querySelector("h2").textContent = globalEvents.length;
            statBoxes[1].querySelector("h2").textContent = globalVendors.length;
            statBoxes[2].querySelector("h2").textContent = globalVenues.length;

            // Make Events box clickable
            statBoxes[0].style.cursor = "pointer";
            const oldEventBox = statBoxes[0].cloneNode(true);
            statBoxes[0].replaceWith(oldEventBox);
            oldEventBox.addEventListener("click", () => openListModal("Planned Events", globalEvents, "events"));

            // Make Vendor/Venue boxes clickable
            statBoxes[1].style.cursor = "pointer";
            const oldVendorBox = statBoxes[1].cloneNode(true);
            statBoxes[1].replaceWith(oldVendorBox);
            oldVendorBox.addEventListener("click", () => openListModal("Saved Vendors", globalVendors, "shops"));

            statBoxes[2].style.cursor = "pointer";
            const oldVenueBox = statBoxes[2].cloneNode(true);
            statBoxes[2].replaceWith(oldVenueBox);
            oldVenueBox.addEventListener("click", () => openListModal("Wishlisted Venues", globalVenues, "shops"));
        }

        // UPDATE RECOMMENDED VENDORS ON THE DASHBOARD
        updateRecommendedVendors(globalVendors);

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
    }
}

// --- Smart Recommendation Logic ---
function updateRecommendedVendors(vendors) {
    const vendorGrid = document.querySelector('.vendor-grid');
    if (!vendorGrid) return;

    const getBestVendor = (keywords) => {
        const matches = vendors.filter(v => {
            const cat = (v.category || "").toLowerCase();
            const name = (v.name || "").toLowerCase();
            return keywords.some(kw => cat.includes(kw) || name.includes(kw));
        });

        if (matches.length === 0) return null;
        if (matches.length === 1) return matches[0];
        
        matches.sort((a, b) => {
            const distA = parseFloat(a.distKm) || 9999;
            const distB = parseFloat(b.distKm) || 9999;
            return distA - distB;
        });
        return matches[0];
    };

    const bestDecorator = getBestVendor(['decor', 'florist', 'flower', 'party', 'event', 'design']);
    const bestCaterer = getBestVendor(['cater', 'food', 'sweet', 'bakery', 'delicatessen', 'snack']);
    const bestPhotographer = getBestVendor(['photo', 'video', 'studio', 'camera', 'film']);

    const renderCard = (vendor, defaultName, defaultService) => {
        if (vendor) {
            return `
                <div class="vendor-card" style="border: 1px solid var(--primary-color);">
                    <h3 style="color: var(--primary-color);">${vendor.name}</h3>
                    <p style="font-weight: 600;">${defaultService}</p>
                    <p style="font-size: 0.85em; color: var(--text-sub); margin-top: 5px;">📍 ${vendor.distKm} km away</p>
                </div>
            `;
        } else {
            return `
                <div class="vendor-card">
                    <h3>${defaultName}</h3>
                    <p>${defaultService}</p>
                    <p style="font-size: 0.8em; color: var(--text-sub); margin-top: 5px;"><i>(Save a vendor to see it here)</i></p>
                </div>
            `;
        }
    };

    vendorGrid.innerHTML = `
        ${renderCard(bestDecorator, "Dream Decorators", "Decoration Services")}
        ${renderCard(bestCaterer, "Royal Caterers", "Catering Services")}
        ${renderCard(bestPhotographer, "Elite Photography", "Photography Services")}
    `;
}

// --- Navbar Wishlist Modal Logic ---
document.getElementById("wishlist").addEventListener("click", (e) => {
    e.preventDefault();
    openNavWishlistModal();
});

function openNavWishlistModal() {
    let existingModal = document.getElementById("navWishlistModal");
    if (existingModal) existingModal.remove();

    // Section 1: Shops/Vendors
    let shopsHtml = globalShopWishlist.length === 0 
        ? `<p style="color:var(--text-sub); text-align:center; padding: 10px 0;">No shops or vendors saved in your wishlist.</p>` 
        : globalShopWishlist.map(item => `
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 14px; border-radius: 8px; margin-bottom: 10px;">
                <h4 style="margin: 0; color: var(--primary-color); font-size: 1.05em;">${item.name}</h4>
                <p style="margin: 4px 0 2px 0; font-size: 0.85em; color: var(--text-main);">📍 ${item.address}</p>
                <p style="margin: 0 0 6px 0; font-size: 0.85em; color: var(--text-main);">📞 ${item.phone || 'Not provided'}</p>
                <div style="font-size: 0.8em; color: var(--text-sub); display: flex; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 6px;">
                    <span><b>Category:</b> ${item.category || 'General'}</span>
                    <span><b>Event:</b> ${item.savedForEvent}</span>
                </div>
            </div>
        `).join('');

    // Section 2: Products
    let productsHtml = globalProductWishlist.length === 0 
        ? `<p style="color:var(--text-sub); text-align:center; padding: 10px 0;">No products saved in your wishlist.</p>` 
        : globalProductWishlist.map(item => `
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 14px; border-radius: 8px; margin-bottom: 10px;">
                <h4 style="margin: 0 0 6px 0; color: var(--primary-color); font-size: 1em; line-height: 1.3;">${item.name}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.05em; font-weight: 700; color: #10b981;">${item.price}</span>
                    <span style="font-size: 0.75em; color: #475569; background: #e2e8f0; padding: 3px 8px; border-radius: 12px; font-weight: 600;">${item.source}</span>
                </div>
                <div style="margin-top: 10px; font-size: 0.8em; color: var(--text-sub); display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                    <span><b>Event:</b> ${item.savedForEvent}</span>
                    <a href="${item.link}" target="_blank" style="color: var(--primary-color); text-decoration: none; font-weight: 600;">View Product &rarr;</a>
                </div>
            </div>
        `).join('');

    const modalTemplate = `
        <div id="navWishlistModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-height: 85vh; overflow-y: auto; max-width: 600px; width: 100%; padding: 24px;">
                <span class="close-btn" id="closeNavWishlistBtn">&times;</span>
                <h2 style="margin-top: 0; color: var(--text-main); font-size: 1.5em; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">Global Master Wishlist</h2>
                
                <div style="margin-top: 24px;">
                    <h3 style="color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">1. Shops & Vendors</h3>
                    <div style="margin-top: 12px; max-height: 28vh; overflow-y: auto; padding-right: 6px;">
                        ${shopsHtml}
                    </div>
                </div>

                <div style="margin-top: 32px;">
                    <h3 style="color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">2. Products</h3>
                    <div style="margin-top: 12px; max-height: 28vh; overflow-y: auto; padding-right: 6px;">
                        ${productsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalTemplate);

    document.getElementById("closeNavWishlistBtn").addEventListener("click", () => {
        document.getElementById("navWishlistModal").remove();
    });

    document.getElementById("navWishlistModal").addEventListener("click", (e) => {
        if (e.target.id === "navWishlistModal") {
            e.target.remove();
        }
    });
}

// Modal Generation Function (Supports both Shops and Events for Stat Boxes)
function openListModal(title, itemsList, listType = "shops") {
    let existingModal = document.getElementById("dynamicListModal");
    if (existingModal) existingModal.remove();

    let listHtml = "";
    if (itemsList.length === 0) {
        listHtml = `<p style="text-align:center; color: var(--text-sub); margin-top: 20px;">You don't have any items in this category yet.</p>`;
    } else {
        if (listType === "shops") {
            listHtml = itemsList.map(item => `
                <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <h4 style="margin: 0; color: var(--primary-color); font-size: 1.1em;">${item.name}</h4>
                    <p style="margin: 0; font-size: 0.9em; color: var(--text-main);">📍 ${item.address}</p>
                    <p style="margin: 0; font-size: 0.9em; color: var(--text-main);">📞 ${item.phone || 'Not provided'}</p>
                    <div style="margin-top: 8px; font-size: 0.85em; color: var(--text-sub); display: flex; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                        <span><b>Category:</b> ${item.category || 'General'}</span>
                        <span><b>Event:</b> ${item.savedForEvent}</span>
                    </div>
                </div>
            `).join('');
        } else if (listType === "events") {
            listHtml = itemsList.map(item => {
                let formattedDate = "Not Specified";
                if (item.date_time) {
                    formattedDate = new Date(item.date_time).toLocaleString("en-US", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "numeric", minute: "2-digit"
                    });
                }
                return `
                <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <h4 style="margin: 0; color: var(--primary-color); font-size: 1.1em;">${item.eventName}</h4>
                    <p style="margin: 0; font-size: 0.9em; color: var(--text-main);">🗓️ <b>Timeline:</b> ${formattedDate}</p>
                    <div style="margin-top: 8px; font-size: 0.85em; color: var(--text-sub); display: flex; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                        <span><b>Category:</b> ${item.category}</span>
                        <span><b>Location:</b> ${item.state}</span>
                    </div>
                </div>
                `;
            }).join('');
        }
    }

    const modalTemplate = `
        <div id="dynamicListModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-height: 80vh; overflow-y: auto; max-width: 500px; width: 100%;">
                <span class="close-btn" id="closeListModalBtn">&times;</span>
                <h3 style="margin-top: 0; border-bottom: 2px solid var(--primary-color); padding-bottom: 10px;">${title}</h3>
                <div style="margin-top: 16px;">
                    ${listHtml}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalTemplate);

    const listModalElement = document.getElementById("dynamicListModal");
    document.getElementById("closeListModalBtn").addEventListener("click", () => {
        listModalElement.remove();
    });

    listModalElement.addEventListener("click", (e) => {
        if (e.target === listModalElement) {
            listModalElement.remove();
        }
    });
}

// --- Fetch & Render Nearest Upcoming Event ---
async function loadNearestUpcomingEvent(uid) {
    try {
        const eventsRef = collection(db, "users", uid, "events");
        const snapshot = await getDocs(eventsRef);

        if (snapshot.empty) {
            renderUpcomingEventState(null);
            return;
        }

        const now = new Date();
        let nearestEvent = null;
        let minDiff = Infinity;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.date_time) {
                const eventDate = new Date(data.date_time);
                const diff = eventDate.getTime() - now.getTime();

                if (diff > 0 && diff < minDiff) {
                    minDiff = diff;
                    nearestEvent = data;
                }
            }
        });

        renderUpcomingEventState(nearestEvent);

    } catch (error) {
        console.error("Error fetching upcoming event:", error);
    }
}

function renderUpcomingEventState(eventData) {
    const eventCard = document.querySelector(".section .event-card");
    if (!eventCard) return;

    if (eventData) {
        const formattedDate = new Date(eventData.date_time).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        eventCard.innerHTML = `
            <h3>${eventData.eventName}</h3>
            <p>Date: ${formattedDate}</p>
            <p>Location: ${eventData.state}</p>
            <p>Category: ${eventData.category} | Guests: ${eventData.guestCount}</p>
        `;
    } else {
        eventCard.innerHTML = `
            <h3>No Upcoming Events</h3>
            <p>You don't have any events scheduled.</p>
        `;
    }
}


// --- 2. Theme Toggle (Day/Night Mode) ---
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
});

// --- 3. Logout Handler ---
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});

// --- 4. Dynamic Settings Modal & Live Updaters ---
const modal = document.getElementById("settingsModal");
const modalTitle = document.getElementById("modalTitle");
const inputContainer = document.getElementById("inputContainer");
const closeBtn = document.querySelector(".close-btn");
let currentSettingType = "";

document.querySelectorAll(".setting-option").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        currentSettingType = e.target.getAttribute("data-type");
        inputContainer.innerHTML = ""; 

        if (currentSettingType === "photo") {
            modalTitle.textContent = "Upload Profile Photo";
            inputContainer.innerHTML = `<input type="file" id="settingInput" accept="image/*" required>`;
        } else if (currentSettingType === "name") {
            modalTitle.textContent = "Change User Name";
            inputContainer.innerHTML = `<input type="text" id="settingInput" placeholder="Enter new name" required>`;
        } else if (currentSettingType === "phone") {
            modalTitle.textContent = "Save Phone Number";
            inputContainer.innerHTML = `<input type="tel" id="settingInput" placeholder="Enter phone number" required>`;
        } else if (currentSettingType === "address") {
            modalTitle.textContent = "Save Address";
            inputContainer.innerHTML = `<textarea id="settingInput" rows="3" placeholder="Enter your full address" required></textarea>`;
        }

        modal.style.display = "flex";
    });
});

closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});

document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputElement = document.getElementById("settingInput");

    if (currentSettingType === "photo") {
        const file = inputElement.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = function () {
                localStorage.setItem(`userPhoto_${userKey}`, reader.result);
                renderDashboard();
                modal.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    } else {
        const value = inputElement.value.trim();
        if (value) {
            if (currentSettingType === "name") localStorage.setItem(`userName_${userKey}`, value);
            if (currentSettingType === "phone") localStorage.setItem(`userPhone_${userKey}`, value);
            if (currentSettingType === "address") localStorage.setItem(`userAddress_${userKey}`, value);
            
            renderDashboard(); 
            modal.style.display = "none";
        }
    }
});