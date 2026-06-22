require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const rootDir = path.join(__dirname, "..");
const dataDir = process.env.DATA_DIR || path.join(os.tmpdir(), "tasteit-template-data");
const dataFile = path.join(dataDir, "data.json");

const fallbackSettings = {
  restaurantName: "Taste.it",
  facebookLink: "#",
  instagramLink: "#",
  twitterLink: "#",
  googleMapsEmbed: "",
  openingTime: "9:00",
  closingTime: "24:00",
  images: {
    heroImage1: "images/bg_1.jpg",
    heroImage1Secondary: "images/menu-1.jpg",
    heroImage2: "images/bg_2.jpg",
    heroImage2Secondary: "images/menu-2.jpg",
    aboutImage1: "images/about.jpg",
    aboutImage2: "images/bg_6.jpg",
    bookingSideImage: "images/about.jpg",
    menuHeaderImage: "images/bg_3.jpg",
    galleryHeaderImage: "images/bg_4.jpg",
    contactHeaderImage: "images/bg_5.jpg"
  }
};

function ensureStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ bookings: [], images: [], settings: fallbackSettings }, null, 2));
  }
}

function readStore() {
  ensureStore();
  const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  return {
    bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
    images: Array.isArray(parsed.images) ? parsed.images : [],
    settings: { ...fallbackSettings, ...(parsed.settings || {}), images: { ...fallbackSettings.images, ...((parsed.settings || {}).images || {}) } }
  };
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ error: "Admin login required" });
}

function normalizeMap(value) {
  if (!value) return "";
  const src = String(value).match(/\ssrc=["']([^"']+)["']/i);
  return src ? src[1] : String(value).trim();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: "tasteit.sid",
  secret: process.env.SESSION_SECRET || "dev-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 8 }
}));
app.use(express.static(rootDir, { extensions: ["html"] }));

app.get("/admin", (req, res) => res.sendFile(path.join(rootDir, "admin.html")));
app.get("/api/settings", (req, res) => res.json(readStore().settings));
app.get("/api/gallery", (req, res) => res.json(readStore().images));

app.post("/api/bookings", (req, res) => {
  const { name, phone, email, date, time, guests, message } = req.body || {};
  if (!name || !phone || !date || !time || !guests) return res.status(400).json({ error: "Name, phone, date, time, and guests are required." });
  const store = readStore();
  const booking = { id: crypto.randomUUID(), name: String(name).trim(), phone: String(phone).trim(), email: email ? String(email).trim() : "", date: String(date).trim(), time: String(time).trim(), guests: String(guests).trim(), message: message ? String(message).trim() : "", createdAt: new Date().toISOString() };
  store.bookings.unshift(booking);
  writeStore(store);
  res.status(201).json({ ok: true, booking });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Invalid username or password" });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/admin/me", (req, res) => res.json({ authenticated: Boolean(req.session && req.session.admin) }));
app.get("/api/admin/bookings", requireAdmin, (req, res) => res.json(readStore().bookings));
app.get("/api/admin/settings", requireAdmin, (req, res) => res.json(readStore().settings));

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const store = readStore();
  const incoming = req.body || {};
  store.settings = {
    ...store.settings,
    restaurantName: incoming.restaurantName || store.settings.restaurantName,
    facebookLink: incoming.facebookLink || "",
    instagramLink: incoming.instagramLink || "",
    twitterLink: incoming.twitterLink || "",
    googleMapsEmbed: normalizeMap(incoming.googleMapsEmbed),
    openingTime: incoming.openingTime || "",
    closingTime: incoming.closingTime || "",
    images: { ...store.settings.images, ...(incoming.images || {}) }
  };
  writeStore(store);
  res.json(store.settings);
});

app.post("/api/admin/images", requireAdmin, upload.single("image"), async (req, res) => {
  const title = req.body.title || "Uploaded image";
  const type = req.body.type === "menu" ? "menu" : "item";
  if (!req.file && !req.body.imageUrl) return res.status(400).json({ error: "Upload a file or paste an image URL." });
  let imageUrl = req.body.imageUrl;
  let publicId = "";
  if (req.file) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return res.status(500).json({ error: "Cloudinary credentials are missing." });
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "tasteit-template" }, (error, result) => error ? reject(error) : resolve(result));
      stream.end(req.file.buffer);
    });
    imageUrl = uploaded.secure_url;
    publicId = uploaded.public_id;
  }
  const store = readStore();
  const image = { id: crypto.randomUUID(), title, type, imageUrl, publicId, createdAt: new Date().toISOString() };
  store.images.unshift(image);
  writeStore(store);
  res.status(201).json(image);
});

app.delete("/api/admin/images/:id", requireAdmin, (req, res) => {
  const store = readStore();
  store.images = store.images.filter((image) => image.id !== req.params.id);
  writeStore(store);
  res.json({ ok: true });
});

module.exports = app;
