const state = { settings: null, images: [] };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function showDashboard(show) {
  $("#loginView").classList.toggle("is-hidden", show);
  $("#dashboardView").classList.toggle("is-hidden", !show);
}

function message(id, text, ok = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "#2d6a32" : "#8c2f21";
}

function fillSettings(settings) {
  ["settingsForm", "homeImagesForm"].forEach((formId) => {
    const form = document.getElementById(formId);
    if (!form) return;
    Array.from(form.elements).forEach((field) => {
      if (!field.name) return;
      field.value = settings[field.name] || (settings.images && settings.images[field.name]) || "";
    });
  });
}

function readSettingsForm() {
  const form = $("#settingsForm");
  return Object.fromEntries(new FormData(form).entries());
}

function readImageSettingsForm() {
  const images = {};
  new FormData($("#homeImagesForm")).forEach((value, key) => { images[key] = value; });
  return { ...state.settings, images };
}

function renderBookings(bookings) {
  const list = $("#bookingList");
  if (!bookings.length) {
    list.innerHTML = '<div class="admin-card">No bookings yet.</div>';
    return;
  }
  list.innerHTML = bookings.map((b) => `<article class="booking-card"><h3>${b.name}</h3><div class="booking-meta"><span>${b.date} at ${b.time}</span><span>${b.guests} guests</span><span>${b.phone}</span>${b.email ? `<span>${b.email}</span>` : ""}</div>${b.message ? `<p>${b.message}</p>` : ""}</article>`).join("");
}

function renderImages(images) {
  const list = $("#imageList");
  if (!images.length) {
    list.innerHTML = '<div class="admin-card">No gallery images yet.</div>';
    return;
  }
  list.innerHTML = images.map((img) => `<article class="image-card"><img src="${img.imageUrl}" alt="${img.title}"><div><strong>${img.title}</strong><p>${img.type === "menu" ? "Full menu image" : "Individual item image"}</p><button data-delete-image="${img.id}">Delete</button></div></article>`).join("");
}

async function loadDashboard() {
  const [bookings, settings, images] = await Promise.all([api("/api/admin/bookings"), api("/api/admin/settings"), api("/api/gallery")]);
  state.settings = settings;
  state.images = images;
  renderBookings(bookings);
  renderImages(images);
  fillSettings(settings);
}

$$(".tab").forEach((tab) => tab.addEventListener("click", () => {
  $$(".tab").forEach((item) => item.classList.remove("active"));
  $$(".panel").forEach((panel) => panel.classList.remove("active"));
  tab.classList.add("active");
  document.getElementById(tab.dataset.tab).classList.add("active");
  $("#dashboardTitle").textContent = tab.textContent.trim();
}));

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/admin/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) });
    showDashboard(true);
    await loadDashboard();
  } catch (error) { message("#loginMessage", error.message); }
});

$("#logoutBtn").addEventListener("click", async () => { await api("/api/admin/logout", { method: "POST" }); showDashboard(false); });

$("#settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try { state.settings = await api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ ...state.settings, ...readSettingsForm() }) }); fillSettings(state.settings); message("#settingsMessage", "Settings saved.", true); }
  catch (error) { message("#settingsMessage", error.message); }
});

$("#homeImagesForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try { state.settings = await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(readImageSettingsForm()) }); fillSettings(state.settings); message("#homeImagesMessage", "Image settings saved.", true); }
  catch (error) { message("#homeImagesMessage", error.message); }
});

$("#imageForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/admin/images", { method: "POST", body: new FormData(event.currentTarget) });
    event.currentTarget.reset();
    state.images = await api("/api/gallery");
    renderImages(state.images);
    message("#imageMessage", "Image saved.", true);
  } catch (error) { message("#imageMessage", error.message); }
});

$("#imageList").addEventListener("click", async (event) => {
  const id = event.target.dataset.deleteImage;
  if (!id) return;
  await api(`/api/admin/images/${id}`, { method: "DELETE" });
  state.images = await api("/api/gallery");
  renderImages(state.images);
});

api("/api/admin/me").then(async (me) => {
  showDashboard(me.authenticated);
  if (me.authenticated) await loadDashboard();
}).catch(() => showDashboard(false));
