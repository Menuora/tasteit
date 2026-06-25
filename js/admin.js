const state = { settings: null, images: [], homepageImages: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

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

function fillSettings(settings, homepageImages) {
  const sForm = document.getElementById("settingsForm");
  if (sForm) {
    Array.from(sForm.elements).forEach((field) => {
      if (field.name) field.value = settings[field.name] || "";
    });
  }
  const hForm = document.getElementById("homeImagesForm");
  if (hForm) {
    Array.from(hForm.elements).forEach((field) => {
      if (field.name) field.value = homepageImages[field.name] || "";
    });
  }
}

function readSettingsForm() {
  const form = $("#settingsForm");
  return Object.fromEntries(new FormData(form).entries());
}

function renderBookings(bookings) {
  const list = $("#bookingList");
  if (!bookings.length) {
    list.innerHTML = '<div class="admin-card">No bookings yet.</div>';
    return;
  }
  list.innerHTML = bookings.map((b) => `
    <article class="booking-card">
      <h3>${b.name}</h3>
      <div class="booking-meta">
        <span>${b.date} at ${b.time}</span>
        <span>${b.guests} guests</span>
        <span>${b.phone}</span>
        ${b.email ? `<span>${b.email}</span>` : ""}
      </div>
      ${b.message ? `<p>${b.message}</p>` : ""}
      <button class="delete-booking-btn" data-delete-booking="${b.id}" style="margin-top: 10px; background-color: #8c2f21; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete Booking</button>
    </article>`).join("");
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
  try {
    const [bookings, settings, homepageImages, images] = await Promise.all([
      window.dbApi.getBookings(),
      window.dbApi.getSettings(),
      window.dbApi.getHomepageImages(),
      window.dbApi.getImages()
    ]);
    state.settings = settings;
    state.homepageImages = homepageImages;
    state.images = images;
    renderBookings(bookings);
    renderImages(images);
    fillSettings(settings, homepageImages);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
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
  const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    message("#loginMessage", "Logging in...");
    await window.dbApi.login(formData.username, formData.password);
    message("#loginMessage", "");
    showDashboard(true);
    await loadDashboard();
  } catch (error) { message("#loginMessage", error.message); }
});

$("#logoutBtn").addEventListener("click", async () => { 
  await window.dbApi.logout(); 
  showDashboard(false); 
});

$("#settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  message("#settingsMessage", "Saving settings...");
  try { 
    const settingsData = readSettingsForm();
    await window.dbApi.saveSettings(settingsData); 
    state.settings = settingsData;
    message("#settingsMessage", "Settings saved.", true); 
  }
  catch (error) { message("#settingsMessage", error.message); }
});

$("#homeImagesForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  message("#homeImagesMessage", "Saving homepage images...");
  try { 
    const homeImagesData = Object.fromEntries(new FormData(event.currentTarget).entries());
    await window.dbApi.saveHomepageImages(homeImagesData); 
    state.homepageImages = homeImagesData;
    message("#homeImagesMessage", "Image settings saved.", true); 
  }
  catch (error) { message("#homeImagesMessage", error.message); }
});

$("#imageForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  message("#imageMessage", "Saving image...");
  try {
    const formData = new FormData(form);
    const file = formData.get("image");
    const type = formData.get("type");
    const title = formData.get("title");
    const imageUrl = formData.get("imageUrl");
    
    await window.dbApi.uploadImage(file && file.size > 0 ? file : null, type, title, imageUrl);
    form.reset();
    state.images = await window.dbApi.getImages();
    renderImages(state.images);
    message("#imageMessage", "Image saved.", true);
  } catch (error) { message("#imageMessage", error.message); }
});

$("#imageList").addEventListener("click", async (event) => {
  const id = event.target.dataset.deleteImage;
  if (!id) return;
  if (confirm("Are you sure you want to delete this image?")) {
    try {
      await window.dbApi.deleteImage(id);
      state.images = await window.dbApi.getImages();
      renderImages(state.images);
    } catch (error) {
      alert("Failed to delete image: " + error.message);
    }
  }
});

$("#bookingList").addEventListener("click", async (event) => {
  const id = event.target.dataset.deleteBooking;
  if (!id) return;
  if (confirm("Are you sure you want to delete this booking?")) {
    try {
      await window.dbApi.deleteBooking(id);
      const bookings = await window.dbApi.getBookings();
      renderBookings(bookings);
    } catch (error) {
      alert("Failed to delete booking: " + error.message);
    }
  }
});

// Change Password Handler
$("#passwordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  message("#passwordMessage", "Updating password...");
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.newPassword !== data.confirmPassword) {
    message("#passwordMessage", "New passwords do not match.");
    return;
  }
  try {
    await window.dbApi.changePassword(data.currentPassword, data.newPassword);
    form.reset();
    message("#passwordMessage", "Password updated successfully.", true);
  } catch (error) {
    message("#passwordMessage", error.message);
  }
});

// Auto-login check
async function checkAuth() {
  try {
    const user = await window.dbApi.getCurrentUser();
    
    // Update login input placeholder depending on Firebase configuration
    const usernameInput = $("#loginForm").querySelector('[name="username"]');
    if (usernameInput) {
      usernameInput.placeholder = window.dbApi.isFirebaseUsed() ? "admin@hotel.com" : "Username";
    }

    if (user) {
      showDashboard(true);
      await loadDashboard();
    } else {
      showDashboard(false);
    }
  } catch (error) {
    showDashboard(false);
  }
}

checkAuth();
