window.onload = () => {
  // Initialize map with default view
  const map = L.map('map').setView([20, 78], 5);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        //const lat = position.coords.latitude;
        //const lon = position.coords.longitude;
        const lat = 20.8880;
        const lon = 70.4013;
        // Show user location in text
        document.getElementById("location").innerText =
          `Latitude: ${lat}, Longitude: ${lon}`;

        // Place user marker
        const userMarker = L.marker([lat, lon]).addTo(map);
        userMarker.bindPopup("You are here").openPopup();
        map.setView([lat, lon], 8);
        //https://backd-splz.onrender.com/nearest-coast?lat=${lat}&lon=${lon}
        //http://localhost:3000/nearest-coast?lat=${lat}&lon=${lon}
        // Fetch nearest coast from backend
        try {
          const url = `http://localhost:3000/nearest-coast?lat=${lat}&lon=${lon}`;
          const res = await fetch(url);
          const data = await res.json();
            console.log(data);
          if (data && data.coastLat && data.coastLon) {
            document.getElementById("coast").innerText =
            `Nearest coast: Latitude ${data.coastLat}, Longitude ${data.coastLon} distance ${data.distance_km}`;
            alert(``)
            // Place coast marker
            const coastMarker = L.marker([data.coastLat, data.coastLon], {
              icon: L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [30, 30]
              })
            }).addTo(map);
            coastMarker.bindPopup("Nearest Coastline");

            // Draw line between user and coast
            L.polyline([[lat, lon], [data.coastLat, data.coastLon]], {
              color: "blue"
            }).addTo(map);
          } else {
            document.getElementById("coast").innerText =
              "Could not fetch nearest coast.";
          }
        } catch (err) {
          document.getElementById("coast").innerText =
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
};
