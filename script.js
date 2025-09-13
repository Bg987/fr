// Main script for Tides Information App
// External libraries: Leaflet.js, Moment.js

const locationInfo = document.getElementById('location-info');
const tideInfo = document.getElementById('tide-info');
const mapDiv = document.getElementById('map');
const currentTimeDiv = document.getElementById('current-time');
const setAlertBtn = document.getElementById('set-alert');
const clearLocationBtn = document.getElementById('clear-location');

let userCoords = null;
let coastCoords = null;
let tideEvents = [];
let tideAlertTimeout = null;

function showCurrentTime() {
    const now = moment();
    currentTimeDiv.textContent = `Current Time: ${now.format('YYYY-MM-DD HH:mm:ss')}`;
}
setInterval(showCurrentTime, 1000);
showCurrentTime();

function saveLocation(coords) {
    localStorage.setItem('userLocation', JSON.stringify(coords));
}
function loadLocation() {
    const loc = localStorage.getItem('userLocation');
    return loc ? JSON.parse(loc) : null;
}
function clearLocation() {
    localStorage.removeItem('userLocation');
    location.reload();
}
clearLocationBtn.onclick = clearLocation;

function fetchUserLocation() {
    const stored = loadLocation();
    if (stored) {
        userCoords = stored;
        locationInfo.innerHTML = `<p>Using stored location: (${userCoords.lat}, ${userCoords.lng})</p>`;
        findNearestCoast(userCoords);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            userCoords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };
            saveLocation(userCoords);
            locationInfo.innerHTML = `<p>Your location: (${userCoords.lat}, ${userCoords.lng})</p>`;
            findNearestCoast(userCoords);
        }, err => {
            locationInfo.innerHTML = `<p>Location error: ${err.message}</p>`;
        });
    } else {
        locationInfo.innerHTML = '<p>Geolocation not supported.</p>';
    }
}

// Dummy function for nearest coast (replace with real API or logic)
function findNearestCoast(coords) {
    // For demo, use a fixed coast (e.g., Miami Beach)
    coastCoords = { lat: 25.790654, lng: -80.130045 };
    locationInfo.innerHTML += `<p>Nearest Coast: Miami Beach, FL</p>`;
    showMap(coastCoords);
    fetchTideTimes(coastCoords);
}

function showMap(coords) {
    mapDiv.innerHTML = '';
    const map = L.map('map').setView([coords.lat, coords.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(map);
    L.marker([coords.lat, coords.lng]).addTo(map)
        .bindPopup('Nearest Coast').openPopup();
}

// Fetch tide times from WorldTides API (replace YOUR_API_KEY)
function fetchTideTimes(coords) {
    tideInfo.innerHTML = '<p>Loading tide times...</p>';
    const apiKey = 'YOUR_API_KEY'; // Replace with your WorldTides API key
    const url = `https://www.worldtides.info/api/v2?heights&lat=${coords.lat}&lon=${coords.lng}&key=${apiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data.heights || data.heights.length === 0) {
                tideInfo.innerHTML = '<p>No tide data available.</p>';
                return;
            }
            tideEvents = data.heights;
            displayTideEvents();
        })
        .catch(() => {
            tideInfo.innerHTML = '<p>Error fetching tide data.</p>';
        });
}

function displayTideEvents() {
    const now = moment();
    let nextHigh = null, nextLow = null;
    for (let event of tideEvents) {
        const eventTime = moment(event.date);
        if (event.height > 0 && !nextHigh && eventTime.isAfter(now)) nextHigh = event;
        if (event.height < 0 && !nextLow && eventTime.isAfter(now)) nextLow = event;
        if (nextHigh && nextLow) break;
    }
    let html = '';
    if (nextHigh) {
        html += `<p>Next High Tide: ${moment(nextHigh.date).format('YYYY-MM-DD HH:mm')} (${moment(nextHigh.date).fromNow()})</p>`;
    }
    if (nextLow) {
        html += `<p>Next Low Tide: ${moment(nextLow.date).format('YYYY-MM-DD HH:mm')} (${moment(nextLow.date).fromNow()})</p>`;
    }
    if (nextHigh || nextLow) {
        html += `<div class="timeline">
            <span>Low</span>
            <span style="margin:0 20px;">|</span>
            <span>High</span>
        </div>`;
    }
    tideInfo.innerHTML = html;
}

// Tide alert feature
setAlertBtn.onclick = function() {
    if (!tideEvents.length) return alert('No tide events available.');
    const now = moment();
    let nextEvent = null;
    for (let event of tideEvents) {
        const eventTime = moment(event.date);
        if (eventTime.isAfter(now)) {
            nextEvent = event;
            break;
        }
    }
    if (!nextEvent) return alert('No upcoming tide events.');
    const msUntil = moment(nextEvent.date).diff(now);
    if (tideAlertTimeout) clearTimeout(tideAlertTimeout);
    tideAlertTimeout = setTimeout(() => {
        alert(`Tide Alert! Event at ${moment(nextEvent.date).format('YYYY-MM-DD HH:mm')}`);
    }, msUntil);
    alert(`Alert set for next tide event at ${moment(nextEvent.date).format('YYYY-MM-DD HH:mm')}`);
};

// Start app
fetchUserLocation();
