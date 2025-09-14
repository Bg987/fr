window.onload = () => {
  // Create a map
  const map = L.map('map').setView([20, 78], 5);

  // Add OpenStreetMap background tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    
  }).addTo(map);

  // Check localStorage for saved data
  const savedLat = localStorage.getItem("lastLat");
  const savedLon = localStorage.getItem("lastLon");
  const savedCoast = localStorage.getItem("coastCoordinates");
  const savedTide = localStorage.getItem("tideData");

  if (savedLat && savedLon && savedCoast && savedTide) {
    // Parse saved objects
    const coastCoordinates = JSON.parse(savedCoast);
    const tideData = JSON.parse(savedTide);

    // Initialize directly with cached data (no server request)
    initMap(map, parseFloat(savedLat), parseFloat(savedLon), coastCoordinates, tideData, true);
  } else {
    // Else get geolocation + server call
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          try {
            // Call backend API once
            const url = `https://backd-splz.onrender.com/nearest-coast?lat=${lat}&lon=${lon}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data && data.coastCoordinates && data.TideData) {
              // Save everything in localStorage
              localStorage.setItem("lastLat", lat);
              localStorage.setItem("lastLon", lon);
              localStorage.setItem("coastCoordinates", JSON.stringify(data.coastCoordinates));
              localStorage.setItem("tideData", JSON.stringify(data.TideData));

              initMap(map, lat, lon, data.coastCoordinates, data.TideData, false);
            }
          } catch (err) {
            document.getElementById("location").innerText =
              "Error fetching coast: " + err.message;
          }
        },
        (error) => {
          document.getElementById("location").innerText =
            "Error " + error.code + ": " + error.message;
        }
      );
    } else {
      document.getElementById("location").innerText =
        "Geolocation not supported by this browser.";
    }
  }

  // Clear button
  const clearBtn = document.createElement("button");
  clearBtn.innerText = "Clear Saved Location";
  clearBtn.classList.add("clear-btn");
  clearBtn.onclick = () => {
    localStorage.removeItem("lastLat");
    localStorage.removeItem("lastLon");
    localStorage.removeItem("coastCoordinates");
    localStorage.removeItem("tideData");
    alert("Saved location cleared. Reload page to detect location again.");
  };
  document.querySelector(".info-section").appendChild(clearBtn);

  // Map + tide rendering
  function initMap(map, lat, lon, coast, tideData, fromStorage) {
    document.getElementById("location").innerText =
      fromStorage
        ? `Loaded saved location → Latitude: ${lat}, Longitude: ${lon}`
        : `Latitude: ${lat}, Longitude: ${lon}`;

    // User marker
    const userMarker = L.marker([lat, lon]).addTo(map);
    userMarker.bindPopup(fromStorage ? "Saved Location" : "You are here").openPopup();
    map.setView([lat, lon], 8);

    if (coast && tideData) {
      let coastDis = Number(coast.distance_km);
      let next = getNextTideEvent(tideData);

      if (next) {
        document.getElementById("nextHighTime").innerText =
          `Next High Tide: ${next.nextHigh.time.toLocaleString()} \n Height: ${next.nextHigh.height} m`;
        startCountdown(next.nextHigh.time, "highCountdown");

        document.getElementById("nextLowTime").innerText =
          `Next Low Tide: ${next.nextLow.time.toLocaleString()} \n Height: ${next.nextLow.height} m`;
        startCountdown(next.nextLow.time, "lowCountdown");
      }

      document.getElementById("coast").innerText =
        `Nearest coast: ${!isNaN(coastDis) ? coastDis.toFixed(3) : 'N/A'} KM`;

      const coastMarker = L.marker([coast.coastLat, coast.coastLon], {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          iconSize: [30, 30]
        })
      }).addTo(map);
      coastMarker.bindPopup("Nearest Coastline");

      L.polyline([[lat, lon], [coast.coastLat, coast.coastLon]], { color: "blue" }).addTo(map);
    }
  }

  // Tide finder
  function getNextTideEvent(tideData) {
    const now = new Date();
    const times = tideData.hourly.time;
    const heights = tideData.hourly.wave_height;

    const futureIndices = times
      .map((t, i) => ({ time: new Date(t), index: i }))
      .filter(obj => obj.time > now);

    if (futureIndices.length === 0) return null;

    let nextHigh = null;
    let nextLow = null;
    let maxHeight = -Infinity;
    let minHeight = Infinity;

    for (let obj of futureIndices) {
      const h = heights[obj.index];
      if (h > maxHeight) {
        maxHeight = h;
        nextHigh = { time: obj.time, height: h };
      }
      if (h < minHeight) {
        minHeight = h;
        nextLow = { time: obj.time, height: h };
      }
    }

    return { nextHigh, nextLow };
  }

  // Countdown
  function startCountdown(targetDate, elementId) {
    function update() {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        document.getElementById(elementId).innerText = "Reached!";
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      document.getElementById(elementId).innerText =
        `${hours}h ${minutes}m ${seconds}s remaining`;
    }

    update();
    const timer = setInterval(update, 1000);
  }
};
