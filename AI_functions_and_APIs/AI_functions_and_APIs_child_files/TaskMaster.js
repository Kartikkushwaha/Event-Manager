// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Your Firebase project configuration
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
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});

// Main DOM Elements
const guestCountInput = document.getElementById('guest-count-input');
const totalBudgetInput = document.getElementById('total-budget-input');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const tabBudget = document.getElementById('tab-budget');
const tabMarket = document.getElementById('tab-market');
const viewBudget = document.getElementById('budget-view');
const viewMarket = document.getElementById('market-view');

// ==========================================
// THEME TOGGLE LOGIC
// ==========================================
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if(themeToggle) themeToggle.textContent = '☀️';
}

if(themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });
}

// State Variables
const currentEventId = localStorage.getItem('currentEventId'); 
const activeUid = localStorage.getItem('userUID'); 
let savedEventData = null; 
let mapInitialized = false; 

// ==========================================
// 1. MAIN SPA NAVIGATION (BUDGET vs MARKET)
// ==========================================
tabBudget.addEventListener('click', () => {
    tabBudget.classList.add('active'); tabMarket.classList.remove('active');
    viewBudget.classList.add('active'); viewMarket.classList.remove('active');
});

tabMarket.addEventListener('click', () => {
    tabMarket.classList.add('active'); tabBudget.classList.remove('active');
    viewMarket.classList.add('active'); viewBudget.classList.remove('active');
    
    if (!mapInitialized) {
        setTimeout(() => { initMap(); mapInitialized = true; }, 100);
    } else if (map && document.getElementById('view-explore').classList.contains('active')) {
        setTimeout(() => map.invalidateSize(), 100);
    }
});

// ==========================================
// 2. FIREBASE & BUDGET LOGIC
// ==========================================
async function fetchEventData() {
  if (!activeUid || !currentEventId) return;
  try {
    const docRef = doc(db, "users", activeUid, "events", currentEventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      savedEventData = docSnap.data();
      populateUI(savedEventData);
    }
  } catch (error) { console.error("Error fetching event data:", error); }
}
fetchEventData();

onAuthStateChanged(auth, (user) => {
    if (!user) alert("Session expired. Please log in again.");
});

function populateUI(data) {
  document.getElementById('corner-event-name').textContent = data.eventName || "Unnamed Event";
  document.getElementById('corner-event-category').textContent = data.category || data.event || "Not Specified";
  document.getElementById('corner-event-theme').textContent = data.eventType || "Not Specified";
  document.getElementById('corner-event-religion').textContent = data.religion || data.relationChoice || "Not Specified";
  document.getElementById('corner-place-name').textContent = data.state || "Not Specified";
  
  const budgetVal = data.budget ? Number(data.budget.replace(/[^0-9.-]+/g,"")) : 0;
  document.getElementById('corner-budget-val').textContent = "₹" + budgetVal.toLocaleString('en-IN');
  guestCountInput.value = data.guestCount || 1; 
  totalBudgetInput.value = budgetVal;
  calculateCostPerGuest();
}

async function saveEventData() {
  if (!activeUid || !currentEventId) return;
  const updatedBudget = parseFloat(totalBudgetInput.value) || 0;
  const updatedGuests = parseInt(guestCountInput.value) || 1;
  saveBtn.textContent = "Saving..."; saveBtn.disabled = true;

  try {
    const eventRef = doc(db, "users", activeUid, "events", currentEventId);
    await updateDoc(eventRef, { budget: updatedBudget.toString(), guestCount: updatedGuests.toString() });
    savedEventData.budget = updatedBudget.toString();
    savedEventData.guestCount = updatedGuests.toString();
    populateUI(savedEventData);
  } catch (error) {
    alert("Failed to save changes.");
  } finally {
    saveBtn.textContent = "Save Changes"; saveBtn.disabled = false;
  }
}

function calculateCostPerGuest() {
  const guestCount = parseFloat(guestCountInput.value) || 0;
  const totalBudget = parseFloat(totalBudgetInput.value) || 0;
  const costPerGuest = guestCount > 0 ? (totalBudget / guestCount) : 0;
  document.getElementById('cost-per-guest-display').textContent = `INR ${costPerGuest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('meta-guest-count').textContent = guestCount;
  document.getElementById('meta-total-budget').textContent = totalBudget.toLocaleString('en-IN');
}

guestCountInput.addEventListener('input', calculateCostPerGuest);
totalBudgetInput.addEventListener('input', calculateCostPerGuest);
saveBtn.addEventListener('click', saveEventData);
resetBtn.addEventListener('click', () => { if (savedEventData) populateUI(savedEventData); });

// ==========================================
// 3. AI SUGGESTION LOGIC
// ==========================================
const suggestionBtn = document.getElementById('generate-suggestion-btn');
const suggestionBox = document.getElementById('ai-suggestion-box');

if (suggestionBtn) {
    suggestionBtn.addEventListener('click', async () => {
        const theme = document.getElementById('corner-event-theme').textContent.trim();
        const category = document.getElementById('corner-event-category').textContent.trim();
        const religion = document.getElementById('corner-event-religion').textContent.trim();
        const place = document.getElementById('corner-place-name').textContent.trim();

        const invalidValues = ["not specified", "not required", "no choice required", "others", "loading..."];
        const isValid = (val) => val && !invalidValues.includes(val.toLowerCase());

        let prompt = "What are the common things used in";
        if (isValid(theme)) prompt += ` ${theme}`;
        if (isValid(category)) prompt += ` ${category}`;
        if (isValid(religion)) prompt += ` of ${religion}`;
        if (isValid(place)) prompt += ` in ${place}`;
        prompt += "?";

        suggestionBtn.textContent = "Consulting AI...";
        suggestionBtn.disabled = true;
        suggestionBox.innerHTML = `<p class="placeholder-text" style="color: #3b82f6;">Generating suggestions for: <em>"${prompt}"</em>...</p>`;

        try {
            const response = await fetch('http://localhost:8000/api/suggest', { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt })
            });
            const result = await response.json();
            if (response.ok && result.success && result.data && result.data.suggestions) {
                let htmlContent = '<div style="display: flex; flex-direction: column; gap: 10px;">';
                result.data.suggestions.forEach(sug => {
                    htmlContent += `
                        <div style="background: var(--card-bg); padding: 10px 12px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                            <strong style="color: var(--primary); display: block; font-size: 0.95rem; margin-bottom: 2px;">${sug.item}</strong>
                            <span style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${sug.description}</span>
                        </div>`;
                });
                htmlContent += '</div>';
                suggestionBox.innerHTML = htmlContent;
            } else {
                const errorMsg = result.detail || "Could not generate valid suggestions.";
                suggestionBox.innerHTML = `<p class="placeholder-text" style="color: #ef4444;">Error: ${errorMsg}</p>`;
            }
        } catch (error) {
            suggestionBox.innerHTML = `<p class="placeholder-text" style="color: #ef4444;">Failed to connect to the server.</p>`;
        } finally {
            suggestionBtn.textContent = "Generate Suggestion";
            suggestionBtn.disabled = false;
        }
    });
}

// ==========================================
// 4. MY MARKET: SUB-TABS & NOTEBOOK
// ==========================================
const subTabs = {
  explore: document.getElementById('tab-explore'),
  search: document.getElementById('tab-search'),
  notebook: document.getElementById('tab-notebook')
};
const subViews = {
  explore: document.getElementById('view-explore'),
  search: document.getElementById('view-search'),
  notebook: document.getElementById('view-notebook')
};

function switchSubTab(tabName) {
  Object.values(subTabs).forEach(btn => btn?.classList.remove('active'));
  Object.values(subViews).forEach(view => view?.classList.remove('active'));
  
  if (subTabs[tabName]) subTabs[tabName].classList.add('active');
  if (subViews[tabName]) subViews[tabName].classList.add('active');

  if (tabName === 'explore' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
}

subTabs.explore?.addEventListener('click', () => switchSubTab('explore'));
subTabs.search?.addEventListener('click', () => switchSubTab('search'));
subTabs.notebook?.addEventListener('click', () => switchSubTab('notebook'));

// Notebook Logic
const notesArea = document.getElementById('event-notes');
const saveNotesBtn = document.getElementById('save-notes-btn');
const notesStatus = document.getElementById('notebook-status');
const getNoteStorageKey = () => `EventEase_Notebook_${currentEventId || 'default'}`;

function loadEventNotes() {
  if (!notesArea) return;
  notesArea.value = localStorage.getItem(getNoteStorageKey()) || "";
}
loadEventNotes();

if (saveNotesBtn) {
    saveNotesBtn.addEventListener('click', () => {
      if (!currentEventId) {
        notesStatus.style.color = "#ef4444";
        notesStatus.textContent = " No event selected!";
        return;
      }
      localStorage.setItem(getNoteStorageKey(), notesArea.value);
      notesStatus.style.color = "#10b981";
      notesStatus.textContent = "✓ Notes saved for this event!";
      setTimeout(() => { notesStatus.textContent = ""; }, 3000);
    });
}

// ==========================================
// 5. MY MARKET: LEAFLET & TOMTOM MAP LOGIC
// ==========================================
const BACKEND_URL = "http://localhost:8000/api";
let map, userMarker, markersLayer, currentRouteLine, radiusCircle;
let userLocation = { lat: 30.2941, lng: 75.6738 }; 
let currentRadiusKm = 5; 
let activeQuery = null;  
let isSatellite = false;
let streetLayer, satLayer, hybridLabelsLayer;

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function initMap() {
  const statusPanel = document.getElementById("status-panel");
  if (!document.getElementById('map')) return;

  map = L.map('map').setView([userLocation.lat, userLocation.lng], 13);

  streetLayer = L.tileLayer(`${BACKEND_URL}/tiles/basic/main/{z}/{x}/{y}.png`, { maxZoom: 19, attribution: '© TomTom (via EventEase)' });
  satLayer = L.tileLayer(`${BACKEND_URL}/tiles/sat/main/{z}/{x}/{y}.jpg`, { maxZoom: 19, attribution: '© TomTom & Maxar' });
  hybridLabelsLayer = L.tileLayer(`${BACKEND_URL}/tiles/hybrid/main/{z}/{x}/{y}.png`, { maxZoom: 19 });

  streetLayer.addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        map.setView([userLocation.lat, userLocation.lng], 14);
        userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: redIcon }).addTo(map).bindPopup("<b>📍 You are here!</b>").openPopup();
        updateVisualCircle();
        if (statusPanel) {
            statusPanel.textContent = "Location found! Select your radius and pick a category below.";
            statusPanel.style.borderLeftColor = "#198754";
        }
      },
      (error) => {
        if (statusPanel) {
            statusPanel.textContent = "Geolocation denied/failed. Using default location.";
            statusPanel.style.borderLeftColor = "#dc3545";
        }
        userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: redIcon }).addTo(map).bindPopup("<b>📍 Default Location</b>");
        updateVisualCircle();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }
}

document.getElementById('recenter-btn')?.addEventListener('click', () => {
  if (!map || !userLocation) return;
  map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
  if (userMarker) userMarker.openPopup();
});

document.getElementById('map-style-btn')?.addEventListener('click', (e) => {
  const btn = e.target;
  if (isSatellite) {
    map.removeLayer(satLayer); map.removeLayer(hybridLabelsLayer); map.addLayer(streetLayer);
    btn.innerHTML = "Switch to Satellite + Landmarks";
    btn.style.backgroundColor = "#343a40"; btn.style.borderColor = "#343a40";
    isSatellite = false;
  } else {
    map.removeLayer(streetLayer); map.addLayer(satLayer); map.addLayer(hybridLabelsLayer); 
    btn.innerHTML = "Switch to Street View";
    btn.style.backgroundColor = "#0d6efd"; btn.style.borderColor = "#0d6efd";
    isSatellite = true;
  }
});

document.getElementById('radius-slider')?.addEventListener('input', (e) => {
  currentRadiusKm = parseInt(e.target.value);
  document.getElementById("radius-val").textContent = currentRadiusKm;
  document.getElementById("results-title").textContent = `Nearby Results (Within ${currentRadiusKm} km)`;
  updateVisualCircle();
  if (activeQuery) {
    const activeBtn = document.querySelector('.filter-btn.active');
    searchTomTom(activeQuery, activeBtn);
  }
});

function updateVisualCircle() {
  if (!map) return;
  if (radiusCircle) map.removeLayer(radiusCircle);
  radiusCircle = L.circle([userLocation.lat, userLocation.lng], { color: '#0d6efd', fillColor: '#0d6efd', fillOpacity: 0.08, weight: 1.5, radius: currentRadiusKm * 1000 }).addTo(map);
  map.fitBounds(radiusCircle.getBounds(), { padding: [30, 30] });
}

document.querySelectorAll('.poi-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    searchTomTom(e.target.getAttribute('data-query'), e.target);
  });
});

window.drawRoute = async function(destLat, destLon, shopName) {
  const routePanel = document.getElementById("route-panel");
  if (!routePanel) return;
  
  routePanel.style.display = "block";
  routePanel.innerHTML = ` Calculating fastest guiding path to <b>${shopName}</b>...`;

  if (currentRouteLine) map.removeLayer(currentRouteLine);

  try {
    const response = await fetch(`${BACKEND_URL}/route?start_lat=${userLocation.lat}&start_lon=${userLocation.lng}&dest_lat=${destLat}&dest_lon=${destLon}`);
    const data = await response.json();

    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const points = route.legs[0].points;
      const lengthKm = (route.summary.lengthInMeters / 1000).toFixed(1);
      const timeMins = Math.round(route.summary.travelTimeInSeconds / 60);

      routePanel.innerHTML = ` <b>Path Guider Active:</b> Route to <b>${shopName}</b> is <b>${lengthKm} km</b> (~<b>${timeMins} mins</b> driving).`;

      const latLngs = points.map(p => [p.latitude, p.longitude]);
      currentRouteLine = L.polyline(latLngs, { color: '#0d6efd', weight: 6, opacity: 0.8, dashArray: '5, 10' }).addTo(map);
      map.fitBounds(currentRouteLine.getBounds(), { padding: [50, 50] });
    } else {
      routePanel.innerHTML = ` Could not calculate a driving path to this location.`;
    }
  } catch (error) {
    routePanel.innerHTML = `Error generating path guider route from backend.`;
  }
};

async function searchTomTom(query, buttonElement) {
  activeQuery = query; 
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (buttonElement) buttonElement.classList.add('active');

  const resultsList = document.getElementById("results-list");
  const routePanel = document.getElementById("route-panel");
  const resultsTitle = document.getElementById("results-title");
  
  if (resultsTitle) resultsTitle.textContent = `Nearby Results (Within ${currentRadiusKm} km)`;
  if (resultsList) resultsList.innerHTML = `<p>Searching Places within <b>${currentRadiusKm} km</b>...</p>`;
  if (routePanel) routePanel.style.display = "none"; 

  markersLayer.clearLayers();
  if (currentRouteLine) map.removeLayer(currentRouteLine);

  try {
    const response = await fetch(`${BACKEND_URL}/search?query=${encodeURIComponent(query)}&lat=${userLocation.lat}&lon=${userLocation.lng}&radius=${currentRadiusKm * 1000}`);
    const data = await response.json();
    if (resultsList) resultsList.innerHTML = ""; 

    if (data && data.results && data.results.length > 0) {
      data.results.forEach((place) => {
        const shopName = place.poi ? place.poi.name : "Unnamed Shop";
        const address = place.address ? place.address.freeformAddress : "Address not available";
        const distKm = (place.dist / 1000).toFixed(1); 
        const lat = place.position.lat;
        const lon = place.position.lon;
        const phone = (place.poi && place.poi.phone) ? place.poi.phone : "No phone provided";
        const category = (place.poi && place.poi.categories) ? place.poi.categories.join(", ") : "General";
        const url = (place.poi && place.poi.url) ? place.poi.url : null;
        const email = (place.poi && place.poi.email) ? place.poi.email : null;
        const openingHours = (place.poi && place.poi.openingHours) ? place.poi.openingHours.mode : null;
        const brandName = (place.poi && place.poi.brands) ? place.poi.brands.map(b => b.name).join(", ") : null;  

        const marker = L.marker([lat, lon]).bindPopup(
          `<b>${shopName}</b><br>📍 ${address}<br>📞 ${phone}<br>📏 ${distKm} km away<br>
          <button class="guide-btn" onclick="window.drawRoute(${lat}, ${lon}, '${shopName.replace(/'/g, "")}')" style="margin-top: 8px;">🗺️ Guide Me Here</button>`
        );
        markersLayer.addLayer(marker);

        const shopPayload = { 
          name: shopName, address, phone, category, distKm, url, email, openingHours, brandName, lat, lon 
        };

        const card = document.createElement("div");
        card.className = "place-card fade-in";
        card.innerHTML = `
          <h4>${shopName}</h4>
          <p>📍 ${address}</p>
          <p>📏 <b>${distKm} km away</b></p>
          <button class="visit-shop-btn action-visit" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; font-weight: 600;">🌍 View on Google Maps</button>
          <div class="place-actions" style="margin-top: 8px;">
            <button class="guide-btn action-guide" style="flex: 1;">Path</button>
            <button class="shop-wishlist-btn action-wishlist" style="flex: 1;">Save</button>
          </div>
        `;
        
        card.querySelector('.action-guide').addEventListener('click', () => { 
          window.drawRoute(lat, lon, shopName); 
          marker.openPopup(); 
          map.flyTo([lat, lon], 15);
        });
        
        card.querySelector('.action-wishlist').addEventListener('click', (e) => {
          saveShopToFirebase(shopPayload, e.target);
        });

        // ----------------------------------------------------
        // FIX: Directly route to Google Maps instead of Modal
        // ----------------------------------------------------
        card.querySelector('.action-visit').addEventListener('click', () => {
          const searchQuery = `${shopName} ${address}`.trim();
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
          window.open(googleMapsUrl, '_blank');
        });
        
        if (resultsList) resultsList.appendChild(card);
      });
      updateVisualCircle();
    } else {
      if (resultsList) resultsList.innerHTML = `<p style="color: var(--text-muted);">No places found matching this category within ${currentRadiusKm} km.</p>`;
    }
  } catch (error) {
    if (resultsList) resultsList.innerHTML = `<p style="color: #dc3545;"> Error connecting to the backend server.</p>`;
  }
}

// ==========================================
// 6. SEARCH PRODUCTS UI LOGIC (LIVE + FIREBASE CART)
// ==========================================
const productResults = document.getElementById('product-results');
const cartCountElement = document.getElementById('cart-count');
const wishlistCountElement = document.getElementById('wishlist-count');
const savedResults = document.getElementById('saved-results');
const searchActionBar = document.getElementById('search-action-bar');
const backToSearchBtn = document.getElementById('back-to-search-btn');
window.lastSearchQuery = '';

if (backToSearchBtn) {
  backToSearchBtn.onclick = () => {
    if (savedResults) savedResults.style.display = 'none';
    if (productResults) productResults.style.display = 'grid'; 
    if (searchActionBar) searchActionBar.style.display = 'none';
    if (window.lastSearchQuery && document.getElementById('product-search-bar')) {
      document.getElementById('product-search-bar').value = window.lastSearchQuery;
    }
  };
}

function updateBadgeCounts() {
  if (savedEventData) {
    if (cartCountElement) cartCountElement.textContent = (savedEventData.cart || []).length;
    if (wishlistCountElement) wishlistCountElement.textContent = (savedEventData.wishlist || []).length;
  }
}

async function saveShopToFirebase(shopData, buttonElement) {
  if (!activeUid || !currentEventId) {
    alert("No active event selected!");
    return;
  }

  const existingShops = savedEventData.shopWishlist || [];
  const isDuplicate = existingShops.some(shop => shop.lat === shopData.lat && shop.lon === shopData.lon);

  if (isDuplicate) {
    buttonElement.textContent = "Already Saved";
    buttonElement.style.background = "#94a3b8"; 
    buttonElement.style.borderColor = "#94a3b8";
    buttonElement.disabled = true;
    return;
  }
  
  buttonElement.textContent = "Saving...";
  buttonElement.disabled = true;
  
  try {
    const eventRef = doc(db, "users", activeUid, "events", currentEventId);
    await updateDoc(eventRef, { shopWishlist: arrayUnion(shopData) });
    if (!savedEventData.shopWishlist) savedEventData.shopWishlist = [];
    savedEventData.shopWishlist.push(shopData);
    
    buttonElement.textContent = "⭐ Saved";
    buttonElement.style.background = "#f59e0b";
    buttonElement.style.color = "white";
    buttonElement.style.borderColor = "#f59e0b";
  } catch (error) {
    console.error("Error saving shop:", error);
    buttonElement.textContent = "Error";
    buttonElement.disabled = false;
  }
}

async function saveItemToFirebase(listName, itemData, buttonElement) {
  if (!activeUid || !currentEventId) {
    alert("No active event selected!");
    return;
  }
  
  buttonElement.textContent = "Saving...";
  buttonElement.disabled = true;
  
  try {
    const eventRef = doc(db, "users", activeUid, "events", currentEventId);
    await updateDoc(eventRef, { [listName]: arrayUnion(itemData) });
    
    if (!savedEventData[listName]) savedEventData[listName] = [];
    savedEventData[listName].push(itemData);
    
    if (listName === 'cart') {
      if (cartCountElement) cartCountElement.textContent = savedEventData.cart.length;
      buttonElement.textContent = "✓ In Cart";
      buttonElement.style.background = "#10b981";
      buttonElement.style.color = "white";
      buttonElement.style.borderColor = "#10b981";
    } else {
      if (wishlistCountElement) wishlistCountElement.textContent = savedEventData.wishlist.length;
      buttonElement.textContent = "✓ Saved";
    }
  } catch (error) {
    console.error(`Error saving to ${listName}:`, error);
    buttonElement.textContent = " Error";
    buttonElement.disabled = false;
  }
}

async function fetchProducts(query) {
  window.lastSearchQuery = query; 
  updateBadgeCounts(); 
  
  if (!productResults) return;

  productResults.style.display = 'grid';
  if (savedResults) savedResults.style.display = 'none';
  if (searchActionBar) searchActionBar.style.display = 'none';

  productResults.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #3b82f6;">
      <h3 style="margin-bottom: 10px;">⏳ Searching for "${query}"...</h3>
      <p style="color: var(--text-muted);">Scanning Amazon, Flipkart, and other stores...</p>
    </div>
  `;
  
  try {
    const response = await fetch(`http://localhost:8000/api/products/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    productResults.innerHTML = ''; 

    if (data.success && data.results && data.results.length > 0) {
      data.results.forEach(item => {
        const title = item.title ? (item.title.length > 50 ? item.title.substring(0, 50) + '...' : item.title) : 'Unnamed Product';
        const price = item.price || 'Price not listed';
        const store = item.source || item.store || 'Web Store';
        const image = item.thumbnail || 'https://via.placeholder.com/200x200?text=No+Image';
        
        let productLink = item.link || '#';
        if (productLink.includes('scraperapi.com')) {
          productLink = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title + ' ' + store)}`;
        } else if (productLink !== '#' && !productLink.startsWith('http')) {
          productLink = 'https://' + productLink;
        }

        const firebasePayload = { name: title, price: price, source: store, link: productLink };
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.innerHTML = `
          <div style="height: 160px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 12px;">
            <img src="${image}" alt="${title}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          </div>
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; line-height: 1.3; color: var(--text-main); height: 38px; overflow: hidden;" title="${item.title}">${title}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <p style="color: #10b981; font-weight: 800; font-size: 1.15rem; margin: 0;">${price}</p>
            <span style="font-size: 0.75rem; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 12px; font-weight: 600; color: #334155;">${store}</span>
          </div>
          <div class="product-actions">
            <a href="${productLink}" target="_blank" style="text-decoration: none; background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; padding: 8px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-align: center; display: block; margin-bottom: 8px;">
              🔗 View on ${store}
            </a>
            <button class="btn-add-cart action-cart">🛒 Add to Cart</button>
            <button class="btn-add-wishlist action-wishlist">❤️ Wishlist</button>
          </div>
        `;
        
        card.querySelector('.action-cart').addEventListener('click', (e) => saveItemToFirebase('cart', firebasePayload, e.target));
        card.querySelector('.action-wishlist').addEventListener('click', (e) => saveItemToFirebase('wishlist', firebasePayload, e.target));
        productResults.appendChild(card);
      });
    } else {
      productResults.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);"><p>No products found for "<b>${query}</b>".</p></div>`;
    }
  } catch (error) {
    productResults.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #ef4444;"><p>⚠️ Could not connect to the backend server.</p></div>`;
  }
}

function renderSavedList(listName, displayName) {
  const searchBar = document.getElementById('product-search-bar');
  if (searchBar) searchBar.value = ''; 
  updateBadgeCounts(); 
  
  if (productResults) productResults.style.display = 'none';
  if (savedResults) savedResults.style.display = 'grid';
  
  if (searchActionBar && productResults && productResults.innerHTML.includes('product-card')) {
    searchActionBar.style.display = 'block';
  }
  
  const items = savedEventData ? (savedEventData[listName] || []) : [];
  
  if (items.length === 0) {
    if (savedResults) {
        savedResults.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--card-bg); border-radius: 8px; border: 1px dashed var(--border-color);">
            <h3>Your ${displayName} is empty.</h3>
            <p>Search for products and add them here to save them for later.</p>
          </div>
        `;
    }
    return;
  }

  if (savedResults) {
      savedResults.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 15px;">
          <h3 style="color: var(--text-main);">📋 Saved in ${displayName}</h3>
        </div>
      `;
      
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = "product-card fade-in";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.justifyContent = "space-between";
        card.style.textAlign = "left";
        card.style.padding = "20px";

        card.innerHTML = `
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 12px; color: var(--text-main);" title="${item.name}">${item.name}</h4>
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
              <p style="color: #10b981; font-weight: 800; font-size: 1.1rem; margin: 0;">${item.price}</p>
              <span style="font-size: 0.8rem; color: #475569; background: #e2e8f0; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${item.source}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="${item.link}" target="_blank" style="text-decoration: none; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 10px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; text-align: center; display: block;">
              🔗 Open Product Link
            </a>
            <button class="remove-btn" style="background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 8px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">
              🗑️ Remove Item
            </button>
          </div>
        `;
        
        card.querySelector('.remove-btn').addEventListener('click', async (e) => {
          e.target.textContent = "Removing...";
          e.target.disabled = true;
          try {
            const eventRef = doc(db, "users", activeUid, "events", currentEventId);
            await updateDoc(eventRef, { [listName]: arrayRemove(item) });
            
            savedEventData[listName] = savedEventData[listName].filter(i => i.link !== item.link);
            card.remove();
            updateBadgeCounts();
            
            if (savedEventData[listName].length === 0) renderSavedList(listName, displayName);
          } catch (error) {
            console.error("Error removing item:", error);
            e.target.textContent = "Error";
          }
        });

        savedResults.appendChild(card);
      });
  }
}

// ==========================================
// Attach UI Event Listeners 
// ==========================================
const searchBtn = document.getElementById('product-search-btn');
const searchInput = document.getElementById('product-search-bar');
const cartBtn = document.getElementById('my-cart-btn');
const wishlistBtn = document.getElementById('wishlist-btn');
const allSuggestions = document.querySelectorAll('.suggestion-list li');

if (searchBtn) {
  searchBtn.onclick = () => {
    const query = searchInput.value.trim();
    if (query) fetchProducts(query);
  };
}

if (searchInput) {
  searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) fetchProducts(query);
    }
  };
}

allSuggestions.forEach(item => {
  item.onclick = (e) => {
    const query = e.target.textContent;
    if (searchInput) searchInput.value = query; 
    fetchProducts(query); 
  };
});

if (cartBtn) cartBtn.onclick = () => renderSavedList('cart', 'Cart');
if (wishlistBtn) wishlistBtn.onclick = () => renderSavedList('wishlist', 'Wishlist');

const tabSearch = document.getElementById('tab-search');
if (tabSearch) tabSearch.onclick = updateBadgeCounts;

// ==========================================
// SHOP WISHLIST VIEWER (MODAL VERSION)
// ==========================================
const viewShopWishlistBtn = document.getElementById('view-shop-wishlist-btn');

if (viewShopWishlistBtn) {
  viewShopWishlistBtn.addEventListener('click', () => {
    const container = document.getElementById('shop-wishlist-container');
    const savedShops = savedEventData ? (savedEventData.shopWishlist || []) : [];

    if (!container) return;

    if (savedShops.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px;">Your shop wishlist is empty. Search the map and add places!</p>`;
    } else {
      container.innerHTML = '';
      savedShops.forEach(shop => {
        const card = document.createElement('div');
        card.className = "shop-details fade-in";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";
        card.style.padding = "15px";
        card.style.borderBottom = "1px solid var(--border-color)";
        
        card.innerHTML = `
          <div style="flex: 1; padding-right: 15px;">
            <h4 style="margin: 0; color: var(--text-main); font-size: 1.05rem; margin-bottom: 5px;">${shop.name}</h4>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 3px;">📍 ${shop.address}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">📞 ${shop.phone || 'Not provided'}</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="guide-shop-btn" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
              🗺️ Path
            </button>
            <button class="remove-shop-btn" style="background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
              🗑️ Remove
            </button>
          </div>
        `;

        // Guide Route logic
        card.querySelector('.guide-shop-btn').addEventListener('click', () => {
          const modal = document.getElementById('shop-wishlist-modal');
          if (modal) modal.classList.remove('active'); 
          switchSubTab('explore'); 
          window.drawRoute(shop.lat, shop.lon, shop.name);
          if (map) map.flyTo([shop.lat, shop.lon], 15);
        });

        // Remove logic
        card.querySelector('.remove-shop-btn').addEventListener('click', async (e) => {
          e.target.textContent = "Removing...";
          e.target.disabled = true;
          try {
            const eventRef = doc(db, "users", activeUid, "events", currentEventId);
            await updateDoc(eventRef, { shopWishlist: arrayRemove(shop) });
            
            savedEventData.shopWishlist = savedEventData.shopWishlist.filter(s => s.lat !== shop.lat || s.lon !== shop.lon);
            card.remove();
            
            if (savedEventData.shopWishlist.length === 0) {
              container.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px;">Your shop wishlist is empty.</p>`;
            }
          } catch(err) { 
            e.target.textContent = "Error";
            console.error(err);
          }
        });        
        container.appendChild(card);
      });
    }
    const wishlistModal = document.getElementById('shop-wishlist-modal');
    if (wishlistModal) wishlistModal.classList.add('active');
  });
}

document.getElementById('close-shop-wishlist-modal')?.addEventListener('click', () => {
  const modal = document.getElementById('shop-wishlist-modal');
  if (modal) modal.classList.remove('active');
});

document.getElementById('shop-wishlist-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'shop-wishlist-modal') {
    e.target.classList.remove('active');
  }
});