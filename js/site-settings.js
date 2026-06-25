(function () {
  function setText(selector, text) { document.querySelectorAll(selector).forEach((el) => { el.textContent = text; }); }
  function setHref(selector, href) { document.querySelectorAll(selector).forEach((el) => { if (href) el.href = href; }); }
  function setBg(selector, url) { document.querySelectorAll(selector).forEach((el) => { if (url) el.style.backgroundImage = `url(${url})`; }); }
  function addGalleryNav() {
    document.querySelectorAll("#ftco-nav .navbar-nav").forEach((nav) => {
      if (nav.querySelector('a[href="gallery.html"]')) return;
      const contact = nav.querySelector('a[href="contact.html"]')?.parentElement;
      const item = document.createElement("li");
      item.className = `nav-item ${location.pathname.endsWith("gallery.html") ? "active" : ""}`;
      item.innerHTML = '<a href="gallery.html" class="nav-link">Images</a>';
      nav.insertBefore(item, contact || null);
    });
  }
  function updateForms() {
    document.querySelectorAll("form.appointment-form").forEach((form) => {
      form.dataset.bookingForm = "true";
      const fields = Array.from(form.querySelectorAll("input, select, textarea"));
      const placeholders = ["name", "email", "phone", "date", "time", "guests"];
      fields.forEach((field, index) => {
        field.name = placeholders[index] || field.name;
        if (field.name === "email") field.required = false; else if (["name", "phone", "date", "time", "guests"].includes(field.name)) field.required = true;
        if (field.name === "date") field.type = "date";
        if (field.name === "time") field.type = "time";
      });
      if (!form.querySelector('[name="message"]')) {
        const wrap = document.createElement("div");
        wrap.className = "col-md-12";
        wrap.innerHTML = '<div class="form-group"><textarea name="message" class="form-control" rows="3" placeholder="Message (optional)"></textarea></div>';
        const submitCol = form.querySelector('input[type="submit"]')?.closest('[class*="col-"]');
        if (submitCol) submitCol.parentElement.insertBefore(wrap, submitCol);
      }
      if (!form.querySelector(".booking-message")) form.insertAdjacentHTML("beforeend", '<p class="booking-message"></p>');
    });
  }
  function applyMap(src) {
    if (!src) return;
    const html = `<iframe src="${src}" width="100%" height="320" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    document.querySelectorAll("#map, [data-site-map]").forEach((el) => { el.innerHTML = html; });
  }
  async function loadSettings() {
    addGalleryNav();
    updateForms();
    try {
      const [settings, homepageImages] = await Promise.all([
        window.dbApi.getSettings(),
        window.dbApi.getHomepageImages()
      ]);
      const name = settings.restaurantName || "Taste.it";
      document.title = document.title.replace("Taste.it", name);
      document.querySelectorAll(".navbar-brand").forEach((brand) => { brand.innerHTML = name.includes(".") ? name.replace(".", ".<span>") + "</span>" : name; });
      setText("[data-site-name]", name);
      setHref(".fa-facebook", settings.facebookLink);
      setHref(".fa-instagram", settings.instagramLink);
      setHref(".fa-twitter", settings.twitterLink);
      setText("[data-opening-hours]", `${settings.openingTime || "9:00"} - ${settings.closingTime || "24:00"}`);
      applyMap(settings.googleMapsEmbed);
      const img = homepageImages || {};
      setBg(".home-slider .slider-item:nth-child(1)", img.heroImage1);
      setBg(".home-slider .slider-item:nth-child(2)", img.heroImage2);
      setBg(".wrap-about.img", img.aboutImage1);
      setBg(".img.img-2:first-child", img.aboutImage2);
      if (location.pathname.endsWith("menu.html")) setBg(".hero-wrap.hero-wrap-2", img.menuHeaderImage);
      if (location.pathname.endsWith("gallery.html")) setBg(".hero-wrap.hero-wrap-2", img.galleryHeaderImage);
      if (location.pathname.endsWith("contact.html")) setBg(".hero-wrap.hero-wrap-2", img.contactHeaderImage);
    } catch (error) { console.warn("Settings unavailable", error); }
  }
  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-booking-form]");
    if (!form) return;
    event.preventDefault();
    const message = form.querySelector(".booking-message");
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      await window.dbApi.addBooking(payload);
      form.reset();
      message.textContent = "Thank you. Your booking request has been sent.";
      message.style.color = "#2d6a32";
    } catch (error) { 
      message.textContent = error.message; 
      message.style.color = "#8c2f21";
    }
  });
  document.addEventListener("DOMContentLoaded", loadSettings);
})();
