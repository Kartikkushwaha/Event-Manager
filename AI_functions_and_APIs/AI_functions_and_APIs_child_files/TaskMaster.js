// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
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

// State Variables
const currentEventId = localStorage.getItem('currentEventId'); 
const activeUid = localStorage.getItem('userUID'); 
let savedEventData = null; 
let mapInitialized = false; // Flag to fix Leaflet map rendering bug

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
    
    // Initialize map only when the Market view is actually visible for the first time
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
                    <div style="background: #ffffff; padding: 10px 12px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <strong style="color: #1e40af; display: block; font-size: 0.95rem; margin-bottom: 2px;">${sug.item}</strong>
                        <span style="font-size: 0.85rem; color: #475569; line-height: 1.4;">${sug.description}</span>
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
  Object.values(subTabs).forEach(btn => btn.classList.remove('active'));
  Object.values(subViews).forEach(view => view.classList.remove('active'));
  
  subTabs[tabName].classList.add('active');
  subViews[tabName].classList.add('active');

  // Fix Leaflet sizing when returning to map
  if (tabName === 'explore' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
}
subTabs.explore.addEventListener('click', () => switchSubTab('explore'));
subTabs.search.addEventListener('click', () => switchSubTab('search'));
subTabs.notebook.addEventListener('click', () => switchSubTab('notebook'));

// Notebook Logic - Event Specific
const notesArea = document.getElementById('event-notes');
const saveNotesBtn = document.getElementById('save-notes-btn');
const notesStatus = document.getElementById('notebook-status');

// Build a unique key per event (falls back to 'default' if no event is selected)
const getNoteStorageKey = () => `EventEase_Notebook_${currentEventId || 'default'}`;

// Function to load event-specific notes
function loadEventNotes() {
  if (!notesArea) return;
  const storageKey = getNoteStorageKey();
  const savedNotes = localStorage.getItem(storageKey);
  notesArea.value = savedNotes || "";
}

// Load notes initially when the page loads
loadEventNotes();

// Save event-specific notes
saveNotesBtn.addEventListener('click', () => {
  if (!currentEventId) {
    notesStatus.style.color = "#ef4444";
    notesStatus.textContent = "⚠️ No event selected!";
    return;
  }

  const storageKey = getNoteStorageKey();
  localStorage.setItem(storageKey, notesArea.value);
  
  notesStatus.style.color = "#10b981";
  notesStatus.textContent = "✓ Notes saved for this event!";
  setTimeout(() => { notesStatus.textContent = ""; }, 3000);
});

// ==========================================
// 5. MY MARKET: LEAFLET & TOMTOM MAP LOGIC
// ==========================================
const BACKEND_URL = "http://localhost:8000/api";
let map, userMarker, markersLayer, currentRouteLine, radiusCircle;
let userLocation = { lat: 30.2941, lng: 75.6738 }; // Default Longowal, Punjab
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
        statusPanel.textContent = "Location found! Select your radius and pick a category below.";
        statusPanel.style.borderLeftColor = "#198754";
      },
      (error) => {
        statusPanel.textContent = "Geolocation denied/failed. Using default location.";
        statusPanel.style.borderLeftColor = "#dc3545";
        userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: redIcon }).addTo(map).bindPopup("<b>📍 Default Location</b>");
        updateVisualCircle();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }
}

document.getElementById('recenter-btn').addEventListener('click', () => {
  if (!map || !userLocation) return;
  map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
  if (userMarker) userMarker.openPopup();
});

document.getElementById('map-style-btn').addEventListener('click', (e) => {
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

document.getElementById('radius-slider').addEventListener('input', (e) => {
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

// Attach event listeners to POI buttons
document.querySelectorAll('.poi-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    searchTomTom(e.target.getAttribute('data-query'), e.target);
  });
});

// Expose drawRoute to global window so it can be called from Leaflet popups
window.drawRoute = async function(destLat, destLon, shopName) {
  const routePanel = document.getElementById("route-panel");
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
  resultsList.innerHTML = `<p>Searching Places within <b>${currentRadiusKm} km</b>...</p>`;
  routePanel.style.display = "none"; 

  markersLayer.clearLayers();
  if (currentRouteLine) map.removeLayer(currentRouteLine);

  try {
    const response = await fetch(`${BACKEND_URL}/search?query=${encodeURIComponent(query)}&lat=${userLocation.lat}&lon=${userLocation.lng}&radius=${currentRadiusKm * 1000}`);
    const data = await response.json();
    resultsList.innerHTML = ""; 

    if (data && data.results && data.results.length > 0) {
      data.results.forEach((place) => {
        const shopName = place.poi ? place.poi.name : "Unnamed Shop";
        const address = place.address ? place.address.freeformAddress : "Address not available";
        const distKm = (place.dist / 1000).toFixed(1); 
        const lat = place.position.lat;
        const lon = place.position.lon;

        const marker = L.marker([lat, lon]).bindPopup(`<b>${shopName}</b><br>📍 ${address}<br>📏 ${distKm} km away<br><button class="guide-btn" onclick="window.drawRoute(${lat}, ${lon}, '${shopName.replace(/'/g, "")}')">🗺️ Guide Me Here</button>`);
        markersLayer.addLayer(marker);

        const card = document.createElement("div");
        card.className = "place-card";
        card.innerHTML = `<h4>${shopName}</h4><p>📍 ${address}</p><p>📏 <b>${distKm} km away</b> from your location</p><button class="guide-btn">🗺️ Show Path Guider</button>`;
        card.addEventListener("click", () => { window.drawRoute(lat, lon, shopName); marker.openPopup(); });
        resultsList.appendChild(card);
      });
      updateVisualCircle();
    } else {
      resultsList.innerHTML = `<p style="color: #6c757d;">No places found matching this category within ${currentRadiusKm} km.</p>`;
    }
  } catch (error) {
    resultsList.innerHTML = `<p style="color: #dc3545;">⚠️ Error connecting to the backend server.</p>`;
  }
}