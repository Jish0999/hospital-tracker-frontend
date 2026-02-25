const API = "https://hospital-tracker-backend.onrender.com/api/hospitals";
const list = document.getElementById("list");
const form = document.getElementById("hospitalForm");

async function loadHospitals() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    list.innerHTML = data.map(h => `
      <div class="card">
        <b>${h.name}</b> — ${h.city}, ${h.district}
        <button onclick="deleteHospital(${h.id})">Delete</button>
      </div>
    `).join("");
  } catch (e) {
    console.error("Load failed", e);
    list.innerHTML = "<p>❌ Failed to load hospitals. Is the server running?</p>";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // stop page reload

  const payload = {
    name: document.getElementById("name").value,
    district: document.getElementById("district").value,
    city: document.getElementById("city").value,
    type: document.getElementById("type").value,
    address: document.getElementById("address").value,
    phone: document.getElementById("phone").value,
    lat: Number(document.getElementById("lat").value),
    lng: Number(document.getElementById("lng").value),
    specialties: document.getElementById("specialties").value
      .split(",").map(s => s.trim().toLowerCase()),
    emergency24x7: document.getElementById("emergency24x7").checked
  };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("POST failed");

    form.reset();
    loadHospitals();
  } catch (e) {
    console.error("Save failed", e);
    alert("❌ Failed to save hospital. Check server and console.");
  }
});

async function deleteHospital(id) {
  try {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadHospitals();
  } catch (e) {
    console.error("Delete failed", e);
    alert("❌ Failed to delete hospital.");
  }
}

loadHospitals();