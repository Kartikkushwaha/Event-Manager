// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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
const db = initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) });

// Global Backend Config
const BACKEND_URL = "https://eventease-sopf.onrender.com/api";

// DOM Bindings
const guestCountInput = document.getElementById('guest-count-input');
const totalBudgetInput = document.getElementById('total-budget-input');
const saveBtn = document.getElementById('save-btn');

const tabBudget = document.getElementById('tab-budget');
const tabMarket = document.getElementById('tab-market');
const viewBudget = document.getElementById('budget-view');
const viewMarket = document.getElementById('market-view');

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

const currentEventId = localStorage.getItem('currentEventId'); 
const activeUid = localStorage.getItem('userUID'); 
let savedEventData = null; 
let mapInitialized = false; 
let currentSavedList = '';
let currentSavedListName = '';

// FORMATTING FIX
function extractPriceNumber(priceStr) {
  if (!priceStr) return 0;
  let cleanStr = String(priceStr).replace(/[^0-9]/g, '');
  return parseInt(cleanStr, 10) || 0;
}
function formatPrice(num) {
  return '₹ ' + num.toLocaleString('en-IN');
}

// SAFEGUARDED EVENT LISTENERS
if (tabBudget && tabMarket && viewBudget && viewMarket) {
    tabBudget.addEventListener('click', () => {
        tabBudget.classList.add('active'); tabMarket.classList.remove('active');
        viewBudget.classList.add('active'); viewMarket.classList.remove('active');
    });

    tabMarket.addEventListener('click', () => {
        tabMarket.classList.add('active'); tabBudget.classList.remove('active');
        viewMarket.classList.add('active'); viewBudget.classList.remove('active');
        if (!mapInitialized) { setTimeout(() => { initMap(); mapInitialized = true; }, 100); } 
        else if (map && document.getElementById('view-explore').classList.contains('active')) { setTimeout(() => map.invalidateSize(), 100); }
    });
}

// Helper for Dictionary lists
function getListDict(listName) {
  if (!savedEventData) return {};
  let data = savedEventData[listName];
  if (!data) return {};
  if (Array.isArray(data)) {
      savedEventData[listName] = { 'General': data };
      return savedEventData[listName];
  }
  return data;
}

function getAllItems(listName) {
  const dict = getListDict(listName);
  return Object.values(dict).flat();
}

function updateBudgetAllocation() {
  const container = document.getElementById('budget-allocation-container');
  if (!container) return;

  const totalBudget = parseFloat(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
  const items = getAllItems('orders');
  let totalCost = 0;
  
  let listHtml = `<div style="margin: 1.5rem 0;">
                    <div class="alloc-row alloc-header">
                       <span>My Orders: Name</span>
                       <span>Price</span>
                    </div>`;
  
  if (items.length === 0) {
      listHtml += `<div style="text-align: center; color: var(--text-muted); padding: 1rem 0; font-family: 'Inter', sans-serif;">No items mapped to orders yet.</div>`;
  } else {
      items.forEach(item => {
        let p = extractPriceNumber(item.price);
        totalCost += p;
        listHtml += `<div class="alloc-row alloc-item">
                       <span>${item.name}</span>
                       <span style="font-weight: 600; color: var(--text-main);">${formatPrice(p)}</span>
                     </div>`;
      });
  }
  listHtml += `</div>`;
  
  const remainingBudget = totalBudget - totalCost;
  const remainingColor = remainingBudget < 0 ? '#ef4444' : '#10b981';

  container.innerHTML = `
    <div class="alloc-row alloc-header" style="font-size: 1.2rem; border-bottom: none;">
      <span>Total Budget:</span>
      <span>${formatPrice(totalBudget)}</span>
    </div>
    ${listHtml}
    <div class="alloc-row alloc-total">
      <span>Total cost:</span>
      <span>${formatPrice(totalCost)}</span>
    </div>
    <div class="alloc-row alloc-remaining" style="color: ${remainingColor};">
      <span>Remaining budget:</span>
      <span>${formatPrice(remainingBudget)}</span>
    </div>
  `;
}

function updateBudgetOrdersSummary() {
  const ordersSummary = document.getElementById('budget-orders-summary');
  if (ordersSummary) {
      const items = getAllItems('orders');
      if (items.length === 0) {
        ordersSummary.innerHTML = `<p style="color: var(--text-muted);">No items currently in your orders.</p>`;
      } else {
          let total = 0;
          let html = `<ul style="list-style:none; padding:0; margin:0; color: var(--text-muted); font-size: 0.95rem;">`;
          items.forEach(item => {
            let p = extractPriceNumber(item.price);
            total += p;
            html += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 5px;">
               <span>${item.name}</span>
               <span style="font-weight: 600; color: var(--text-main);">${formatPrice(p)}</span>
             </li>`;
          });
          html += `</ul>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.2rem; padding-top:12px; margin-top:10px; color: var(--primary);">
              <span>Total Orders Preview</span><span>${formatPrice(total)}</span>
            </div>`;
          ordersSummary.innerHTML = html;
      }
  }
  updateBudgetAllocation();
}

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

onAuthStateChanged(auth, (user) => { if (!user) alert("Session expired. Please log in again."); });

function populateUI(data) {
  document.getElementById('corner-event-name').textContent = data.eventName || "Unnamed Event";
  document.getElementById('corner-event-category').textContent = data.category || data.event || "Not Specified";
  document.getElementById('corner-event-theme').textContent = data.eventType || "Not Specified";
  document.getElementById('corner-event-religion').textContent = data.religion || data.relationChoice || "Not Specified";
  document.getElementById('corner-place-name').textContent = data.state || "Not Specified";
  
  const budgetVal = data.budget ? extractPriceNumber(data.budget) : 0;
  document.getElementById('corner-budget-val').textContent = formatPrice(budgetVal);
  
  if (guestCountInput) guestCountInput.value = data.guestCount || 1; 
  if (totalBudgetInput) totalBudgetInput.value = budgetVal;
  
  calculateCostPerGuest();
  updateBudgetOrdersSummary();
}

async function saveEventData() {
  if (!activeUid || !currentEventId) {
    alert("Missing user session or active event ID!");
    return;
  }
  const updatedBudget = parseFloat(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
  const updatedGuests = parseInt(guestCountInput ? guestCountInput.value : 1) || 1;
  saveBtn.textContent = "Saving..."; saveBtn.disabled = true;
  try {
    const eventRef = doc(db, "users", activeUid, "events", currentEventId);
    await updateDoc(eventRef, { budget: updatedBudget.toString(), guestCount: updatedGuests.toString() });
    if (savedEventData) {
      savedEventData.budget = updatedBudget.toString();
      savedEventData.guestCount = updatedGuests.toString();
      populateUI(savedEventData);
    }
    alert("Changes saved successfully!");
  } catch (error) { 
    console.error("Error saving event:", error);
    alert("Failed to save changes."); 
  } finally { 
    saveBtn.textContent = "Save Changes"; 
    saveBtn.disabled = false; 
  }
}

if (saveBtn) saveBtn.addEventListener('click', saveEventData);

function calculateCostPerGuest() {
  const guestCount = parseFloat(guestCountInput ? guestCountInput.value : 0) || 0;
  const totalBudget = parseFloat(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
  const costPerGuest = guestCount > 0 ? (totalBudget / guestCount) : 0;
  
  const costDisplay = document.getElementById('cost-per-guest-display');
  const metaGuestCount = document.getElementById('meta-guest-count');
  const metaTotalBudget = document.getElementById('meta-total-budget');
  
  if (costDisplay) costDisplay.textContent = formatPrice(costPerGuest);
  if (metaGuestCount) metaGuestCount.textContent = guestCount;
  if (metaTotalBudget) metaTotalBudget.textContent = totalBudget.toLocaleString('en-IN');
  
  updateBudgetAllocation();
}

if (guestCountInput) guestCountInput.addEventListener('input', calculateCostPerGuest);
if (totalBudgetInput) totalBudgetInput.addEventListener('input', calculateCostPerGuest);

const suggestionBtn = document.getElementById('generate-suggestion-btn');
const suggestionBox = document.getElementById('ai-suggestion-box');

if (suggestionBtn) {
    suggestionBtn.addEventListener('click', async () => {
        const theme = document.getElementById('corner-event-theme')?.textContent.trim() || "";
        const category = document.getElementById('corner-event-category')?.textContent.trim() || "";
        const religion = document.getElementById('corner-event-religion')?.textContent.trim() || "";
        const place = document.getElementById('corner-place-name')?.textContent.trim() || "";
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
        
        const aiLoadingTexts = [
            `Generating suggestions for: "${prompt}"...`,
            "AI is modifying according to your request...",
            "Curating the best options for your event...",
            "Finalizing event details..."
        ];
        let isTypingActive = true;

        if (suggestionBox) {
            suggestionBox.innerHTML = `
                <div class="typewriter-wrapper">
                    <p class="placeholder-text typewriter-text" style="color: #3b82f6; font-style: italic; text-align: center;">
                        <span id="ai-dynamic-text"></span><span class="typewriter-cursor">|</span>
                    </p>
                </div>`;
        }

        (async function typeWriter() {
            let textIndex = 0;
            let charIndex = 0;
            let isDeleting = false;

            while (isTypingActive) {
                const el = document.getElementById('ai-dynamic-text');
                if (!el) break;

                const currentText = aiLoadingTexts[textIndex];
                
                if (isDeleting) {
                    el.textContent = currentText.substring(0, charIndex - 1);
                    charIndex--;
                } else {
                    el.textContent = currentText.substring(0, charIndex + 1);
                    charIndex++;
                }

                let typingSpeed = isDeleting ? 30 : 60;

                if (!isDeleting && charIndex === currentText.length) {
                    typingSpeed = 1500; 
                    isDeleting = true;
                } else if (isDeleting && charIndex === 0) {
                    isDeleting = false;
                    textIndex = (textIndex + 1) % aiLoadingTexts.length;
                    typingSpeed = 500; 
                }

                await new Promise(resolve => setTimeout(resolve, typingSpeed));
            }
        })();
        
        try {
            const response = await fetch(`${BACKEND_URL}/suggest`, { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt })
            });
            const result = await response.json();
            
            isTypingActive = false; 
            
            if (suggestionBox) {
                if (response.ok && result.success && result.data && result.data.suggestions) {
                    let htmlContent = '<div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">';
                    result.data.suggestions.forEach(sug => {
                        htmlContent += `<div style="background: var(--card-bg); padding: 10px 12px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"><strong style="color: var(--primary); display: block; font-size: 0.95rem; margin-bottom: 2px;">${sug.item}</strong><span style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${sug.description}</span></div>`;
                    });
                    htmlContent += '</div>';
                    suggestionBox.innerHTML = htmlContent;
                } else {
                    suggestionBox.innerHTML = `<p class="placeholder-text" style="color: #ef4444;">Error: ${result.detail || "Could not generate valid suggestions."}</p>`;
                }
            }
        } catch (error) { 
            isTypingActive = false; 
            if (suggestionBox) {
                suggestionBox.innerHTML = `<p class="placeholder-text" style="color: #ef4444;">Could not connect server to generate suggestions.Please try later.</p>`;
            }
        } finally { 
            suggestionBtn.textContent = "Generate Suggestion"; 
            suggestionBtn.disabled = false; 
        }
    });
}

const subTabs = { explore: document.getElementById('tab-explore'), search: document.getElementById('tab-search'), notebook: document.getElementById('tab-notebook') };
const subViews = { explore: document.getElementById('view-explore'), search: document.getElementById('view-search'), notebook: document.getElementById('view-notebook') };

function switchSubTab(tabName) {
  Object.values(subTabs).forEach(btn => btn?.classList.remove('active'));
  Object.values(subViews).forEach(view => view?.classList.remove('active'));
  if (subTabs[tabName]) subTabs[tabName].classList.add('active');
  if (subViews[tabName]) subViews[tabName].classList.add('active');
  if (tabName === 'explore' && map) setTimeout(() => map.invalidateSize(), 100);
}
subTabs.explore?.addEventListener('click', () => switchSubTab('explore'));
subTabs.search?.addEventListener('click', () => switchSubTab('search'));
subTabs.notebook?.addEventListener('click', () => switchSubTab('notebook'));

const notesArea = document.getElementById('event-notes');
const saveNotesBtn = document.getElementById('save-notes-btn');
const notesStatus = document.getElementById('notebook-status');
const getNoteStorageKey = () => `EventEase_Notebook_${currentEventId || 'default'}`;

function loadEventNotes() { if (notesArea) notesArea.value = localStorage.getItem(getNoteStorageKey()) || ""; }
loadEventNotes();
if (saveNotesBtn) {
    saveNotesBtn.addEventListener('click', () => {
      if (!currentEventId) { 
          if(notesStatus) { notesStatus.style.color = "#ef4444"; notesStatus.textContent = " No event selected!"; }
          return; 
      }
      localStorage.setItem(getNoteStorageKey(), notesArea.value);
      if(notesStatus) {
          notesStatus.style.color = "#10b981"; notesStatus.textContent = "✓ Notes saved for this event!";
          setTimeout(() => { notesStatus.textContent = ""; }, 3000);
      }
    });
}

let map, userMarker, destMarker, markersLayer, currentRouteLine, radiusCircle;
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
        if (statusPanel) { statusPanel.textContent = "Location found! Select your radius and pick a category below."; statusPanel.style.borderLeftColor = "#198754"; }
      },
      (error) => {
        if (statusPanel) { statusPanel.textContent = "Geolocation denied/failed. Using default location."; statusPanel.style.borderLeftColor = "#dc3545"; }
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
  const btn = e.currentTarget;
  if (isSatellite) {
    map.removeLayer(satLayer); map.removeLayer(hybridLabelsLayer); map.addLayer(streetLayer);
    btn.innerHTML = '<i data-lucide="satellite" class="map-ctrl-icon"></i><span class="map-ctrl-text">Satellite View</span>';
    btn.setAttribute('data-tooltip', 'Satellite View');
    btn.style.backgroundColor = "#343a40"; btn.style.borderColor = "#343a40"; 
    isSatellite = false;
  } else {
    map.removeLayer(streetLayer); map.addLayer(satLayer); map.addLayer(hybridLabelsLayer); 
    btn.innerHTML = '<i data-lucide="map" class="map-ctrl-icon"></i><span class="map-ctrl-text">Street View</span>';
    btn.setAttribute('data-tooltip', 'Street View');
    btn.style.backgroundColor = "#0d6efd"; btn.style.borderColor = "#0d6efd"; 
    isSatellite = true;
  }
  if (window.lucide) { window.lucide.createIcons(); }
});

document.getElementById('radius-slider')?.addEventListener('input', (e) => {
  currentRadiusKm = parseInt(e.target.value);
  const radiusVal = document.getElementById("radius-val");
  const resultsTitle = document.getElementById("results-title");
  
  if (radiusVal) radiusVal.textContent = currentRadiusKm;
  if (resultsTitle) resultsTitle.textContent = `Nearby Results (Within ${currentRadiusKm} km)`;
  
  updateVisualCircle();
  if (activeQuery) { const activeBtn = document.querySelector('.filter-btn.active'); searchTomTom(activeQuery, activeBtn); }
});

function updateVisualCircle() {
  if (!map) return;
  if (radiusCircle) map.removeLayer(radiusCircle);
  radiusCircle = L.circle([userLocation.lat, userLocation.lng], { color: '#0d6efd', fillColor: '#0d6efd', fillOpacity: 0.08, weight: 1.5, radius: currentRadiusKm * 1000 }).addTo(map);
  map.fitBounds(radiusCircle.getBounds(), { padding: [30, 30] });
}

document.querySelectorAll('.poi-btn').forEach(btn => {
  btn.addEventListener('click', (e) => searchTomTom(e.target.getAttribute('data-query'), e.currentTarget) );
});

document.getElementById('manual-map-search-btn')?.addEventListener('click', () => {
    const searchInputEl = document.getElementById('manual-map-search');
    const query = searchInputEl ? searchInputEl.value.trim() : "";
    if(query) { searchTomTom(query, null); }
});

window.drawRoute = async function(destLat, destLon, shopName) {
  const routePanel = document.getElementById("route-panel");
  if (!routePanel) return;
  routePanel.style.display = "block";
  routePanel.innerHTML = ` Calculating fastest guiding path to <b>${shopName}</b>...`;

  if (currentRouteLine) map.removeLayer(currentRouteLine);
  if (destMarker) map.removeLayer(destMarker);

  destMarker = L.marker([destLat, destLon]).addTo(map).bindPopup(`<b>Destination: ${shopName}</b>`).openPopup();

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
      
      const group = new L.featureGroup([userMarker, destMarker, currentRouteLine]);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else {
      routePanel.innerHTML = ` Could not calculate a driving path to this location.`;
    }
  } catch (error) { routePanel.innerHTML = `Error generating path guider route from backend.`; }
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

  if (markersLayer) markersLayer.clearLayers();
  if (currentRouteLine && map) map.removeLayer(currentRouteLine);
  if (destMarker && map) map.removeLayer(destMarker);

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

        const marker = L.marker([lat, lon]).bindPopup(`<b>${shopName}</b><br>📍 ${address}<br>📞 ${phone}<br>📏 ${distKm} km away<br><button class="guide-btn" onclick="window.drawRoute(${lat}, ${lon}, '${shopName.replace(/'/g, "")}')" style="margin-top: 8px;">🗺️ Guide Me Here</button>`);
        markersLayer.addLayer(marker);

        const shopPayload = { name: shopName, address, phone, category, distKm, lat, lon };
        const card = document.createElement("div");
        card.className = "place-card fade-in";
        card.innerHTML = `
          <div><h4>${shopName}</h4><p>📍 ${address}</p><p>📏 <b>${distKm} km away</b></p></div>
          <div style="margin-top: auto;">
             <button class="btn-secondary action-visit" style="width: 100%; padding: 8px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; margin-bottom: 8px;">View on Google Maps</button>
             <div class="place-actions" style="display: flex; gap: 8px; margin-top: 0; width: 100%;">
               <button class="action-guide" style="flex: 1; padding: 8px; border: none; border-radius: 6px; background-color: #0d6efd; color: white; font-weight: 600; cursor: pointer; text-align: center;">Path</button>
               <button class="action-wishlist" style="flex: 1; padding: 8px; border: 1px solid #0d6efd; border-radius: 6px; background-color: white; color: #0d6efd; font-weight: 600; cursor: pointer; text-align: center;">Save</button>
             </div>
          </div>
        `;
        
        card.querySelector('.action-guide').addEventListener('click', () => { window.drawRoute(lat, lon, shopName); marker.openPopup(); });
        card.querySelector('.action-wishlist').addEventListener('click', (e) => { saveShopToFirebase(shopPayload, e.target); });
        card.querySelector('.action-visit').addEventListener('click', () => {
          const searchQuery = `${shopName} ${address}`.trim();
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`, '_blank');
        });
        
        if (resultsList) resultsList.appendChild(card);
      });
      updateVisualCircle();
    } else { if (resultsList) resultsList.innerHTML = `<p style="color: var(--text-muted);">No places found matching this category within ${currentRadiusKm} km.</p>`; }
  } catch (error) { if (resultsList) resultsList.innerHTML = `<p style="color: #dc3545;"> Error connecting to the backend server.Please try later.</p>`; }
}

const productResults = document.getElementById('product-results');
const cartCountElement = document.getElementById('cart-count');
const wishlistCountElement = document.getElementById('wishlist-count');
const ordersCountElement = document.getElementById('orders-count');
const savedResults = document.getElementById('saved-results');
const searchActionBar = document.getElementById('search-action-bar');
const backToSearchBtn = document.getElementById('back-to-search-btn');

let isProductSearchActive = false;

if (backToSearchBtn) {
  backToSearchBtn.onclick = () => {
    if (savedResults) savedResults.style.display = 'none';
    if (productResults) productResults.style.display = 'grid'; 
    if (searchActionBar) searchActionBar.style.display = 'none';
    if (window.lastSearchQuery && document.getElementById('product-search-bar')) { document.getElementById('product-search-bar').value = window.lastSearchQuery; }
  };
}

function updateBadgeCounts() {
  if (savedEventData) {
    if (cartCountElement) cartCountElement.textContent = getAllItems('cart').length;
    if (wishlistCountElement) wishlistCountElement.textContent = getAllItems('wishlist').length;
    if (ordersCountElement) ordersCountElement.textContent = getAllItems('orders').length;
  }
}

async function saveShopToFirebase(shopData, buttonElement) {
  if (!activeUid || !currentEventId) return alert("No active event selected!");
  const existingShops = savedEventData.shopWishlist || [];
  const isDuplicate = existingShops.some(shop => shop.lat === shopData.lat && shop.lon === shopData.lon);
  if (isDuplicate) { buttonElement.textContent = "Saved"; buttonElement.style.background = "#e2e8f0"; buttonElement.style.color = "#334155"; buttonElement.style.borderColor = "#e2e8f0"; buttonElement.disabled = true; return; }
  
  buttonElement.textContent = "Saved"; buttonElement.style.background = "#10b981"; buttonElement.style.color = "white"; buttonElement.style.borderColor = "#10b981"; buttonElement.disabled = true;
  if (!savedEventData.shopWishlist) savedEventData.shopWishlist = [];
  savedEventData.shopWishlist.push(shopData);

  try {
    const eventRef = doc(db, "users", activeUid, "events", currentEventId);
    await updateDoc(eventRef, { shopWishlist: arrayUnion(shopData) });
  } catch (error) { console.error(error); buttonElement.textContent = "Error"; buttonElement.disabled = false; savedEventData.shopWishlist.pop(); }
}

async function saveItemToFirebase(listName, itemData, buttonElement) {
  if (!activeUid || !currentEventId) return alert("No active event selected!");
  itemData.timestamp = Date.now(); 
  
  const prevText = buttonElement.textContent;
  if (listName === 'cart') buttonElement.textContent = "In Cart";
  else if (listName === 'orders') buttonElement.textContent = "In Orders";
  else buttonElement.textContent = "Saved";

  buttonElement.style.background = "#10b981"; buttonElement.style.color = "white"; buttonElement.style.borderColor = "#10b981"; buttonElement.disabled = true;
  
  const searchKey = window.lastSearchQuery || 'General';

  if (!savedEventData[listName]) savedEventData[listName] = {};
  if (Array.isArray(savedEventData[listName])) {
      savedEventData[listName] = { 'General': savedEventData[listName] };
  }
  if (!savedEventData[listName][searchKey]) savedEventData[listName][searchKey] = [];
  
  savedEventData[listName][searchKey].push(itemData);
  updateBadgeCounts();
  if (listName === 'orders') updateBudgetOrdersSummary();
  
  try {
    const eventRef = doc(db, "users", activeUid, "events", currentEventId);
    await updateDoc(eventRef, { [`${listName}.${searchKey}`]: arrayUnion(itemData) });
  } catch (error) {
    console.error(`Error saving to ${listName}:`, error);
    buttonElement.textContent = prevText; buttonElement.disabled = false; buttonElement.style.background = ""; buttonElement.style.borderColor = ""; buttonElement.style.color = "";
    savedEventData[listName][searchKey].pop();
    updateBadgeCounts(); 
    if (listName === 'orders') updateBudgetOrdersSummary();
  }
}

async function fetchProducts(query) {
  window.lastSearchQuery = query; 
  updateBadgeCounts(); 
  if (!productResults) return;

  productResults.style.display = 'grid';
  if (savedResults) savedResults.style.display = 'none';
  if (searchActionBar) searchActionBar.style.display = 'none';

  isProductSearchActive = true;
  const productLoadingTexts = [
      `Searching stores for: "${query}"...`,
      "Scanning Amazon, Flipkart, and partner stores...",
      "Comparing availability and price listings...",
      "Curating best options for your event...",
      "Almost ready with top search items..."
  ];

  productResults.innerHTML = `
    <div class="product-loading-container">
      <div style="font-size: 2.2rem; margin-bottom: 12px; text-align: center;">⏳</div>
      <div class="typewriter-wrapper product-typewriter-wrapper">
        <p class="placeholder-text typewriter-text" style="color: #3b82f6; font-size: 1.05rem; font-weight: 600; text-align: center; margin: 0 auto;">
          <span id="product-dynamic-text"></span><span class="typewriter-cursor">|</span>
        </p>
      </div>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 8px; text-align: center;">Please wait while we fetch real-time items...</p>
    </div>
  `;

  (async function productTypeWriter() {
      let textIndex = 0;
      let charIndex = 0;
      let isDeleting = false;

      while (isProductSearchActive) {
          const el = document.getElementById('product-dynamic-text');
          if (!el) break;

          const currentText = productLoadingTexts[textIndex];
          if (isDeleting) {
              el.textContent = currentText.substring(0, charIndex - 1);
              charIndex--;
          } else {
              el.textContent = currentText.substring(0, charIndex + 1);
              charIndex++;
          }

          let typingSpeed = isDeleting ? 25 : 55;

          if (!isDeleting && charIndex === currentText.length) {
              typingSpeed = 1400;
              isDeleting = true;
          } else if (isDeleting && charIndex === 0) {
              isDeleting = false;
              textIndex = (textIndex + 1) % productLoadingTexts.length;
              typingSpeed = 400;
          }

          await new Promise(resolve => setTimeout(resolve, typingSpeed));
      }
  })();

  try {
    const response = await fetch(`${BACKEND_URL}/products/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    isProductSearchActive = false; 
    productResults.innerHTML = ''; 

    if (data.success && data.results && data.results.length > 0) {
      data.results.forEach(item => {
        const title = item.title ? (item.title.length > 50 ? item.title.substring(0, 50) + '...' : item.title) : 'Unnamed Product';
        
        const parsedValue = extractPriceNumber(item.price);
        const displayPrice = parsedValue > 0 ? formatPrice(parsedValue) : (item.price || 'Price not listed');
        item.price = displayPrice;

        const store = item.source || item.store || 'Web Store';
        const image = item.thumbnail || 'https://via.placeholder.com/200x200?text=No+Image';
        let productLink = item.link || '#';
        if (productLink.includes('scraperapi.com')) { productLink = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title + ' ' + store)}`; } 
        else if (productLink !== '#' && !productLink.startsWith('http')) { productLink = 'https://' + productLink; }

        const firebasePayload = { name: title, price: displayPrice, source: store, link: productLink };
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.innerHTML = `
          <div style="height: 160px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 12px;"><img src="${image}" alt="${title}" style="max-width: 100%; max-height: 100%; object-fit: contain;"></div>
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; line-height: 1.3; color: var(--text-main); height: 38px; overflow: hidden;" title="${item.title}">${title}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <p style="color: #10b981; font-weight: 800; font-size: 1.15rem; margin: 0;">${displayPrice}</p>
            <span style="font-size: 0.75rem; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 12px; font-weight: 600; color: #334155;">${store}</span>
          </div>
          <div class="product-actions" style="display: flex; flex-direction: column; gap: 8px; margin-top: auto; width: 100%;">
            <a href="${productLink}" target="_blank" class="btn-secondary" style="text-decoration: none; padding: 8px; border-radius: 6px; text-align: center; font-size: 0.85rem; font-weight: 600; border: none; background: #e2e8f0; color: #334155;">Open Link</a>
            <button class="action-orders" style="padding: 8px; border: none; border-radius: 6px; background-color: #f59e0b; color: white; font-weight: 600; cursor: pointer;">Add to Orders</button>
            <button class="action-cart" style="padding: 8px; border: none; border-radius: 6px; background-color: #0d6efd; color: white; font-weight: 600; cursor: pointer;">Add to Cart</button>
            <button class="action-wishlist" style="padding: 8px; border: 1px solid #0d6efd; border-radius: 6px; background-color: white; color: #0d6efd; font-weight: 600; cursor: pointer;">Wishlist</button>
          </div>
        `;
        card.querySelector('.action-orders').addEventListener('click', (e) => saveItemToFirebase('orders', firebasePayload, e.target));
        card.querySelector('.action-cart').addEventListener('click', (e) => saveItemToFirebase('cart', firebasePayload, e.target));
        card.querySelector('.action-wishlist').addEventListener('click', (e) => saveItemToFirebase('wishlist', firebasePayload, e.target));
        productResults.appendChild(card);
      });
    } else { 
      productResults.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);"><p>No products found for "<b>${query}</b>".</p></div>`; 
    }
  } catch (error) { 
    isProductSearchActive = false;
    productResults.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #ef4444;"><p>⚠️ Could not connect to the backend server.</p></div>`; 
  }
}

document.getElementById('saved-sort-select')?.addEventListener('change', () => {
    if (currentSavedList) renderSavedList(currentSavedList, currentSavedListName);
});

function renderSavedList(listName, displayName) {
  currentSavedList = listName;
  currentSavedListName = displayName;
  const searchBar = document.getElementById('product-search-bar');
  if (searchBar) searchBar.value = ''; 
  updateBadgeCounts(); 
  
  if (productResults) productResults.style.display = 'none';
  if (savedResults) savedResults.style.display = 'grid';
  if (searchActionBar) searchActionBar.style.display = 'flex';
  
  const dict = getListDict(listName);
  const categorySelect = document.getElementById('category-filter-select');
  
  if (categorySelect) {
      const existingCategoryValue = categorySelect.value || 'all';

      categorySelect.innerHTML = '<option value="all">All Items</option>';
      Object.keys(dict).forEach(k => {
          if(dict[k].length > 0) {
             categorySelect.innerHTML += `<option value="${k}">${k.toUpperCase()}</option>`;
          }
      });
      
      categorySelect.value = Object.keys(dict).includes(existingCategoryValue) ? existingCategoryValue : 'all';
      categorySelect.onchange = (e) => { renderSavedList(listName, displayName); };
  }

  let itemsToDisplay = [];
  const allItemsUnfiltered = [];
  
  Object.keys(dict).forEach(cat => {
      dict[cat].forEach(item => {
          const itemWithCat = { ...item, _category: cat }; 
          allItemsUnfiltered.push(itemWithCat);
          if (!categorySelect || categorySelect.value === 'all' || categorySelect.value === cat) {
              itemsToDisplay.push(itemWithCat);
          }
      });
  });

  const sortSelectEl = document.getElementById('saved-sort-select');
  const sortVal = sortSelectEl ? sortSelectEl.value : 'time-desc';
  
  itemsToDisplay.sort((a, b) => {
    let priceA = extractPriceNumber(a.price);
    let priceB = extractPriceNumber(b.price);
    let timeA = a.timestamp || 0;
    let timeB = b.timestamp || 0;

    if (sortVal === 'price-desc') return priceB - priceA;
    if (sortVal === 'price-asc') return priceA - priceB;
    if (sortVal === 'time-asc') return timeA - timeB;
    return timeB - timeA; 
  });

  if (itemsToDisplay.length === 0) {
    if (savedResults) savedResults.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--card-bg); border-radius: 8px; border: 1px dashed var(--border-color);"><h3>No items to show in ${displayName}.</h3><p>Change your filter or search and add more products.</p></div>`;
    if(allItemsUnfiltered.length > 0 && savedResults) appendReceiptCard(allItemsUnfiltered, displayName, savedResults);
    return;
  }

  if (savedResults) {
      savedResults.innerHTML = `<div style="grid-column: 1 / -1; margin-bottom: 15px;"><h3 style="color: var(--text-main);">Viewing: ${displayName}</h3></div>`;

      itemsToDisplay.forEach(item => {
        let numericPrice = extractPriceNumber(item.price);
        let formattedStr = formatPrice(numericPrice);
        
        const addToOrdersHtml = listName !== 'orders' 
            ? `<button class="add-to-orders-btn" style="background: #f59e0b; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">Add to Orders</button>` 
            : '';

        const card = document.createElement('div');
        card.className = "product-card fade-in";
        card.style.display = "flex"; card.style.flexDirection = "column"; card.style.justifyContent = "space-between"; card.style.textAlign = "left"; card.style.padding = "20px";
        card.innerHTML = `
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 12px; color: var(--text-main);" title="${item.name}">${item.name}</h4>
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
              <p style="color: #10b981; font-weight: 800; font-size: 1.1rem; margin: 0;">${formattedStr}</p><span style="font-size: 0.8rem; color: #475569; background: #e2e8f0; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${item.source}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto;">
            ${addToOrdersHtml}
            <a href="${item.link}" target="_blank" style="text-decoration: none; padding: 8px; border: none; border-radius: 6px; background-color: #0d6efd; color: white; font-weight: 600; text-align: center;">Open Product Link</a>
            <button class="remove-btn" style="background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 8px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">Remove Item</button>
          </div>
        `;
        
        if (listName !== 'orders') {
          card.querySelector('.add-to-orders-btn').addEventListener('click', (e) => {
            const firebasePayload = { name: item.name, price: item.price, source: item.source, link: item.link };
            
            const tempSearchQuery = window.lastSearchQuery;
            window.lastSearchQuery = item._category; 
            saveItemToFirebase('orders', firebasePayload, e.target);
            window.lastSearchQuery = tempSearchQuery;
          });
        }

        card.querySelector('.remove-btn').addEventListener('click', async (e) => {
          e.target.textContent = "Removing..."; e.target.disabled = true;
          try {
            const originalItem = dict[item._category].find(i => i.link === item.link);
            const eventRef = doc(db, "users", activeUid, "events", currentEventId);
            await updateDoc(eventRef, { [`${listName}.${item._category}`]: arrayRemove(originalItem) });
            
            savedEventData[listName][item._category] = savedEventData[listName][item._category].filter(i => i.link !== item.link);
            card.remove(); updateBadgeCounts(); if (listName === 'orders') updateBudgetOrdersSummary();
            renderSavedList(listName, displayName); 
          } catch (error) { console.error("Error removing:", error); e.target.textContent = "Error"; }
        });
        savedResults.appendChild(card);
      });
      
      appendReceiptCard(allItemsUnfiltered, displayName, savedResults);
  }
}

function appendReceiptCard(allSectionItems, displayName, container) {
  let sectionTotalCostSum = 0;
  let receiptListingsHTML = "";
  let grandTotalEverything = 0;

  allSectionItems.forEach(item => {
    let numericPrice = extractPriceNumber(item.price);
    sectionTotalCostSum += numericPrice;
    let formattedStr = formatPrice(numericPrice);
    receiptListingsHTML += `<li style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>${item.name}</span><span style="font-weight: 600; color: var(--text-main);">${formattedStr}</span></li>`;
  });

  ['cart', 'wishlist', 'orders'].forEach(list => {
      const listItems = getAllItems(list);
      listItems.forEach(i => grandTotalEverything += extractPriceNumber(i.price));
  });

  const receiptCardHTML = `
    <div class="receipt-card" style="grid-column: 1 / -1; margin-top:20px;">
      <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:10px; margin-bottom:10px; color: var(--text-main);">Summary (All Items inside ${displayName})</h4>
      <ul style="list-style:none; padding:0; color: var(--text-muted); font-size: 0.95rem;">${receiptListingsHTML}</ul>
      
      <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; border-top:1px solid var(--border-color); padding-top:12px; margin-top:10px; color: var(--primary);">
        <span>${displayName} Cost</span><span>${formatPrice(sectionTotalCostSum)}</span>
      </div>
      
      <div style="display:flex; justify-content:space-between; font-weight:900; font-size:1.3rem; border-top:2px dashed #0d6efd; padding-top:12px; margin-top:15px; color: #0d6efd;">
        <span>Grand Total (All Sections Combined)</span><span>${formatPrice(grandTotalEverything)}</span>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', receiptCardHTML);
}

const searchBtn = document.getElementById('product-search-btn');
const searchInput = document.getElementById('product-search-bar');
const cartBtn = document.getElementById('my-cart-btn');
const ordersBtn = document.getElementById('my-orders-btn');
const wishlistBtn = document.getElementById('wishlist-btn');

const allSuggestions = document.querySelectorAll('.sugg-btn');

if (searchBtn && searchInput) { searchBtn.onclick = () => { const query = searchInput.value.trim(); if (query) fetchProducts(query); }; }
if (searchInput) { searchInput.onkeypress = (e) => { if (e.key === 'Enter') { const query = e.target.value.trim(); if (query) fetchProducts(query); } }; }

allSuggestions.forEach(btn => { 
    btn.onclick = (e) => { 
        const query = btn.getAttribute('data-query'); 
        if (searchInput) searchInput.value = query; 
        fetchProducts(query); 
    }; 
});

if (ordersBtn) ordersBtn.onclick = () => renderSavedList('orders', 'My Orders');
if (cartBtn) cartBtn.onclick = () => renderSavedList('cart', 'Cart');
if (wishlistBtn) wishlistBtn.onclick = () => renderSavedList('wishlist', 'Wishlist');
const tabSearch = document.getElementById('tab-search');
if (tabSearch) tabSearch.onclick = updateBadgeCounts;

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
            <button class="guide-shop-btn" style="padding: 8px; border: none; border-radius: 6px; background-color: #0d6efd; color: white; font-weight: 600; cursor: pointer; text-align: center;">
              Path
            </button>
            <button class="remove-shop-btn" style="background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 8px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
              Remove
            </button>
          </div>
        `;

        card.querySelector('.guide-shop-btn').addEventListener('click', () => {
          const modal = document.getElementById('shop-wishlist-modal');
          if (modal) modal.classList.remove('active'); 
          switchSubTab('explore'); 
          window.drawRoute(shop.lat, shop.lon, shop.name);
          if (map) map.flyTo([shop.lat, shop.lon], 15);
        });

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

// =========================================
// UI RESPONSIVE: POP-UP SIDEBAR & MENUS
// =========================================
const hamburgerBtn = document.getElementById('hamburger-menu');
const navTabsMenu = document.getElementById('nav-tabs-menu');
const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
const searchRightPanel = document.getElementById('search-right-panel');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// 1. Top Navbar Hamburger (Mobile)
if (hamburgerBtn && navTabsMenu) {
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navTabsMenu.classList.toggle('active-menu');
    });

    const navTabs = navTabsMenu.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabsMenu.classList.remove('active-menu');
        });
    });

    document.addEventListener('click', (event) => {
        if (!hamburgerBtn.contains(event.target) && !navTabsMenu.contains(event.target)) {
            navTabsMenu.classList.remove('active-menu');
        }
    });
}

// 2. Off-canvas "Pop-up" Sidebar Drawer (Mobile)
if (mobileSidebarToggle && searchRightPanel) {
    mobileSidebarToggle.addEventListener('click', () => {
        searchRightPanel.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
    });
}
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        if (searchRightPanel) searchRightPanel.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    });
}
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        if (searchRightPanel) searchRightPanel.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
}

// Auto-close Sidebar when clicking a panel option
const panelBtns = document.querySelectorAll('.search-right-panel .panel-btn');
panelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (searchRightPanel) searchRightPanel.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    });
});

if (window.lucide) {
    window.lucide.createIcons();
}