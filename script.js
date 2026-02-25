alert("Welcome to Hospital Tracker!");
// ✅ NEW: Load hospitals from Admin Panel backend
// script.js (TOP of file)
document.addEventListener("DOMContentLoaded", () => {
let hospitals = [];

async function loadHospitalsFromAPI() {
  try {
    const res = await fetch("https://hospital-tracker-backend.onrender.com/api/hospitals");
    if (!res.ok) throw new Error("Hospitals API returned " + res.status);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Hospitals API did not return array");

    hospitals = data;
    populateDistricts(); // call after data loads
  } catch (e) {
    console.error("Failed to load hospitals from API", e);
    hospitals = [];
  }
}
function populateDistricts() {
  const districtSelect = document.getElementById("district");
  districtSelect.innerHTML = '<option value="">Select District</option>';

  if (!Array.isArray(hospitals)) return;

  const districts = [...new Set(hospitals.map(h => h.district).filter(Boolean))];

  districts.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    districtSelect.appendChild(opt);
  });
}
function populateCities() {
  const district = document.getElementById("district")?.value;
  const citySelect = document.getElementById("city");

  if (!citySelect) return;

  citySelect.innerHTML = '<option value="">Select City</option>';

  if (!Array.isArray(hospitals) || !district) return;

  const cities = [
    ...new Set(
      hospitals
        .filter(h => h.district === district)
        .map(h => h.city)
        .filter(Boolean)
    )
  ];

  cities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    citySelect.appendChild(opt);
  });
}

setInterval(loadHospitalsFromAPI, 30000);
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let userLat = null;
let userLng = null;

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;
    },
    () => {
      console.log("Location permission denied.");
    }
  );
}

function setActiveStep(n) {
  document.querySelectorAll(".step").forEach((el) => {
    const stepNum = parseInt(el.dataset.step, 10);

    // Reset states
    el.classList.remove("active", "completed");

    if (stepNum < n) {
      el.classList.add("completed");
      el.innerHTML = `✓ ${el.textContent.replace(/^✓\s*/,'')}`;
    } else if (stepNum === n) {
      el.classList.add("active");
      el.innerHTML = el.textContent.replace(/^✓\s*/,'');
    } else {
      el.innerHTML = el.textContent.replace(/^✓\s*/,'');
    }
  });
}
document.getElementById("district")?.addEventListener("change", () => {
  populateCities();
  setActiveStep(1);
});

document.getElementById("city")?.addEventListener("change", () => {
  setActiveStep(2);
});

document.getElementById("type")?.addEventListener("change", () => {
  if (document.getElementById("type").value) {
    setActiveStep(3);
  }
});

function findHospitals() {
  console.log(document.getElementById("results"));
  const district = document.getElementById("district").value;
  const city = document.getElementById("city").value;
  const type = document.getElementById("type").value;

  const results = hospitals.filter(h =>
    h.district === district &&
    h.city === city &&
    h.type === type
  );

  const resultsDiv = document.getElementById("results");

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No hospitals found for your selection.</p>";
    return;
  }

  let enriched = results.map(h => {
  let distance = null;
  if (userLat !== null && userLng !== null) {
    distance = getDistanceKm(userLat, userLng, h.lat, h.lng);
  }
  return { ...h, distance };
});

enriched.sort((a, b) => {
  if (a.distance === null) return 1;
  if (b.distance === null) return -1;
  return a.distance - b.distance;
});

resultsDiv.innerHTML = enriched.map(h => `
  <div class="card">
    <h3>${h.name}</h3>
    <p>📍 ${h.address}</p>
    <p>📞 ${h.phone}</p>
    <p>${h.emergency24x7 ? "🚑 24/7 Emergency Available" : "⏰ Emergency Not 24/7"}</p>
    ${h.distance !== null ? `<p>📏 ${h.distance.toFixed(2)} km away</p>` : ""}
    <a target="_blank" href="https://www.google.com/maps?q=${h.lat},${h.lng}">
      🗺️ Open in Maps
    </a>
  </div>
`).join("");

setActiveStep(4);

}

async function handleChat() {
  const text = document.getElementById("chatInput").value;

  const res = await fetch("https://hospital-tracker-backend.onrender.com/ai/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const intent = await res.json();
  applyAIIntent(intent);
}

function applyAIIntent(intent) {
  let filtered = hospitals.slice();

  if (intent.district) filtered = filtered.filter(h => h.district === intent.district);
  if (intent.city) filtered = filtered.filter(h => h.city === intent.city);
  if (intent.type) filtered = filtered.filter(h => h.type === intent.type);
  if (intent.emergency24x7 === true) filtered = filtered.filter(h => h.emergency24x7);
  if (intent.specialty) filtered = filtered.filter(h => h.specialties?.includes(intent.specialty));

 if (intent.nearest) {
  filtered = filtered
    .filter(h => typeof h.lat === "number" && typeof h.lng === "number")
    .map(h => ({
      ...h,
      distance: getDistanceKm(userLat, userLng, h.lat, h.lng)
    }))
    .sort((a, b) => a.distance - b.distance);

  if (intent.limit) filtered = filtered.slice(0, intent.limit);
}

  const resultsDiv = document.getElementById("results");

  if (filtered.length === 0) {
    resultsDiv.innerHTML = "<p>🤖 No hospitals match your request.</p>";
    return;
  }

  resultsDiv.innerHTML = filtered.map(h => `
    <div class="card">
      <h3>${h.name}</h3>
      <p>📍 ${h.address}</p>
      <p>📞 ${h.phone}</p>
      <p>${h.emergency24x7 ? "🚑 24/7 Emergency Available" : "⏰ Emergency Not 24/7"}</p>
      ${h.distance ? `<p>📏 ${h.distance.toFixed(2)} km away</p>` : ""}
      <a target="_blank" href="https://www.google.com/maps?q=${h.lat},${h.lng}">
        🗺️ Open in Maps
      </a>
    </div>
  `).join("");

  setActiveStep(4);
  
}
loadHospitalsFromAPI();
  });
