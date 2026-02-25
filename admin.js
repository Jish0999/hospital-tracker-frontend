// 🔐 HARD GATE: hide admin UI immediately (even before DOMContentLoaded)
(() => {
  const hideAdmin = () => {
    const adminApp = document.getElementById("adminApp");
    if (adminApp) adminApp.style.display = "none";
  };
  hideAdmin();
  document.addEventListener("DOMContentLoaded", hideAdmin);
})();

document.addEventListener("DOMContentLoaded", () => {
  const ADMIN_PASSWORD = "change-this-strong-password"; // 👈 set your password

  const loginBox = document.getElementById("loginBox");
  const adminApp = document.getElementById("adminApp");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");

  function isLoggedIn() {
    return localStorage.getItem("admin_logged_in") === "true";
  }

  function showAdmin() {
    loginBox.style.display = "none";
    adminApp.style.display = "block";
  }

  function showLogin() {
    loginBox.style.display = "block";
    adminApp.style.display = "none";
  }

  // Gate on load
  if (isLoggedIn()) showAdmin();
  else showLogin();

  loginBtn.addEventListener("click", () => {
    const pass = document.getElementById("adminPass").value;
    if (pass === ADMIN_PASSWORD) {
      localStorage.setItem("admin_logged_in", "true");
      showAdmin();
    } else {
      loginError.style.display = "block";
    }
  });

  // 🔒 Optional logout shortcut: Ctrl + Shift + L
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
      localStorage.removeItem("admin_logged_in");
      showLogin();
    }
  });
  // 👇 IMPORTANT: Keep your existing Admin CRUD logic BELOW this line
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
