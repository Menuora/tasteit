(function () {
  async function loadGallery() {
    const menu = document.getElementById("menuImages");
    const items = document.getElementById("itemImages");
    if (!menu || !items) return;
    const images = await window.dbApi.getImages().catch(() => []);
    const fallback = '<div class="col-md-12 text-center"><p>No images have been uploaded yet. Add them from /admin.</p></div>';
    function render(type) {
      const filtered = images.filter((img) => img.type === type);
      if (!filtered.length) return fallback;
      return filtered.map((img) => `<div class="col-md-4 ftco-animate"><div class="gallery-card"><a href="${img.imageUrl}" class="image-popup"><img src="${img.imageUrl}" alt="${img.title}"></a><h3>${img.title}</h3></div></div>`).join("");
    }
    menu.innerHTML = render("menu");
    items.innerHTML = render("item");
  }
  document.addEventListener("DOMContentLoaded", loadGallery);
})();
