require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND = path.resolve(__dirname, "../frontend");
const UPLOADS = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOADS, { recursive: true });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("Set JWT_SECRET in backend/.env to a random string of at least 32 characters.");
  process.exit(1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || `http://localhost:${PORT}` }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOADS));
app.use(express.static(FRONTEND));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

const mongo = new MongoClient(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017");
let db;
const safe = value => String(value ?? "").trim();
const publicDoc = doc => ({ ...doc, _id: doc._id.toString() });
const isObjectId = id => ObjectId.isValid(id) && String(new ObjectId(id)) === String(id);
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Please log in to continue." });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({ message: "Session expired. Please log in again." }); }
}
function validText(value, max = 300) { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max; }
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${require("crypto").randomBytes(6).toString("hex")}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Only JPG, PNG, WEBP or GIF images are allowed."), allowed.includes(file.mimetype));
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "Blush By Valiyan API" }));

app.post("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { message: "Too many login attempts. Try again later." } }), asyncRoute(async (req, res) => {
  const email = safe(req.body.email).toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
  const admin = await db.collection("admins").findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return res.status(401).json({ message: "Invalid email or password." });
  const token = jwt.sign({ sub: admin._id.toString(), email: admin.email, name: admin.name }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, admin: { name: admin.name, email: admin.email } });
}));
app.get("/api/auth/me", auth, (req, res) => res.json({ admin: { name: req.admin.name, email: req.admin.email } }));

// Public content
app.get("/api/services", asyncRoute(async (_req, res) => {
  const items = await db.collection("services").find({ active: { $ne: false } }).sort({ order: 1, createdAt: -1 }).toArray();
  res.json(items.map(publicDoc));
}));
app.get("/api/gallery", asyncRoute(async (req, res) => {
  const filter = req.query.all === "1" ? {} : { active: { $ne: false } };
  const items = await db.collection("gallery").find(filter).sort({ createdAt: -1 }).toArray();
  res.json(items.map(publicDoc));
}));
app.get("/api/settings", asyncRoute(async (_req, res) => {
  const settings = await db.collection("settings").findOne({ _id: "site" });
  res.json(settings || { brand: "Blush By Valiyan", tagline: "Bridal beauty, thoughtfully created", phone: "", whatsapp: "", email: "", instagram: "https://www.instagram.com/blush_by_valiyan" });
}));
app.post("/api/contact", rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, message: { message: "Too many inquiries. Please try again later." } }), asyncRoute(async (req, res) => {
  const { name, email, phone, service, date, message } = req.body || {};
  if (!validText(name, 100) || !validText(email, 180) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validText(message, 2000)) {
    return res.status(400).json({ message: "Please provide a valid name, email and message." });
  }
  const inquiry = { name: name.trim(), email: email.trim(), phone: safe(phone).slice(0, 40), service: safe(service).slice(0, 120), date: safe(date).slice(0, 40), message: message.trim(), status: "new", createdAt: new Date() };
  const result = await db.collection("inquiries").insertOne(inquiry);
  res.status(201).json({ message: "Your inquiry has been received.", id: result.insertedId.toString(), inquiry: publicDoc({ ...inquiry, _id: result.insertedId }) });
}));

// Admin-only CRUD
app.get("/api/admin/overview", auth, asyncRoute(async (_req, res) => {
  const [services, gallery, inquiries, newInquiries] = await Promise.all([
    db.collection("services").countDocuments(), db.collection("gallery").countDocuments(),
    db.collection("inquiries").countDocuments(), db.collection("inquiries").countDocuments({ status: "new" })
  ]);
  res.json({ services, gallery, inquiries, newInquiries });
}));
app.get("/api/admin/services", auth, asyncRoute(async (_req, res) => res.json((await db.collection("services").find().sort({ createdAt: -1 }).toArray()).map(publicDoc))));
app.post("/api/admin/services", auth, asyncRoute(async (req, res) => {
  const { title, description, price, category, active } = req.body || {};
  if (!validText(title, 120) || !validText(description, 1200)) return res.status(400).json({ message: "Title and description are required." });
  const doc = { title: title.trim(), description: description.trim(), price: safe(price).slice(0, 80), category: safe(category).slice(0, 80), active: active !== false, createdAt: new Date(), updatedAt: new Date() };
  const result = await db.collection("services").insertOne(doc);
  res.status(201).json(publicDoc({ ...doc, _id: result.insertedId }));
}));
app.put("/api/admin/services/:id", auth, asyncRoute(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid service ID." });
  const { title, description, price, category, active } = req.body || {};
  if (!validText(title, 120) || !validText(description, 1200)) return res.status(400).json({ message: "Title and description are required." });
  const doc = { title: title.trim(), description: description.trim(), price: safe(price).slice(0, 80), category: safe(category).slice(0, 80), active: active !== false, updatedAt: new Date() };
  const result = await db.collection("services").findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: doc }, { returnDocument: "after" });
  if (!result) return res.status(404).json({ message: "Service not found." });
  res.json(publicDoc(result));
}));
app.delete("/api/admin/services/:id", auth, asyncRoute(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid service ID." });
  const result = await db.collection("services").deleteOne({ _id: new ObjectId(req.params.id) });
  if (!result.deletedCount) return res.status(404).json({ message: "Service not found." });
  res.json({ message: "Service deleted." });
}));

app.get("/api/admin/gallery", auth, asyncRoute(async (_req, res) => res.json((await db.collection("gallery").find().sort({ createdAt: -1 }).toArray()).map(publicDoc))));
app.post("/api/admin/gallery", auth, upload.single("image"), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please choose an image." });
  const title = safe(req.body.title).slice(0, 120) || "Makeup look";
  const doc = { title, category: safe(req.body.category).slice(0, 80) || "Portfolio", imageUrl: `/uploads/${req.file.filename}`, filename: req.file.filename, active: true, createdAt: new Date() };
  const result = await db.collection("gallery").insertOne(doc);
  res.status(201).json(publicDoc({ ...doc, _id: result.insertedId }));
}));
app.delete("/api/admin/gallery/:id", auth, asyncRoute(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid photo ID." });
  const item = await db.collection("gallery").findOne({ _id: new ObjectId(req.params.id) });
  if (!item) return res.status(404).json({ message: "Photo not found." });
  await db.collection("gallery").deleteOne({ _id: item._id });
  if (item.filename) fs.promises.unlink(path.join(UPLOADS, path.basename(item.filename))).catch(() => {});
  res.json({ message: "Photo deleted." });
}));
app.get("/api/admin/inquiries", auth, asyncRoute(async (_req, res) => res.json((await db.collection("inquiries").find().sort({ createdAt: -1 }).limit(300).toArray()).map(publicDoc))));
app.patch("/api/admin/inquiries/:id", auth, asyncRoute(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid inquiry ID." });
  const status = safe(req.body.status);
  if (!["new", "contacted", "booked", "closed"].includes(status)) return res.status(400).json({ message: "Invalid status." });
  const result = await db.collection("inquiries").findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: { status, updatedAt: new Date() } }, { returnDocument: "after" });
  if (!result) return res.status(404).json({ message: "Inquiry not found." });
  res.json(publicDoc(result));
}));
app.put("/api/admin/settings", auth, asyncRoute(async (req, res) => {
  const allowed = ["brand", "tagline", "phone", "whatsapp", "email", "instagram", "address"];
  const settings = {};
  for (const key of allowed) settings[key] = safe(req.body[key]).slice(0, 300);
  settings.updatedAt = new Date();
  await db.collection("settings").updateOne({ _id: "site" }, { $set: settings, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  res.json({ ...settings, _id: "site" });
}));

app.get("/admin", (_req, res) => res.sendFile(path.join(FRONTEND, "admin", "login.html")));
app.get("/admin/dashboard", (_req, res) => res.sendFile(path.join(FRONTEND, "admin", "dashboard.html")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
  res.sendFile(path.join(FRONTEND, "index.html"));
});
app.use((err, _req, res, _next) => {
  console.error(err.message);
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller." : "Upload failed." });
  res.status(500).json({ message: err.message || "Unexpected server error." });
});

(async () => {
  await mongo.connect();
  db = mongo.db(process.env.MONGODB_DB || "blush_by_valiyan");
  await Promise.all([
    db.collection("admins").createIndex({ email: 1 }, { unique: true }),
    db.collection("services").createIndex({ active: 1, createdAt: -1 }),
    db.collection("gallery").createIndex({ active: 1, createdAt: -1 }),
    db.collection("inquiries").createIndex({ status: 1, createdAt: -1 })
  ]);
  app.listen(PORT, () => console.log(`Blush By Valiyan running at http://localhost:${PORT}`));
})().catch(err => { console.error("Could not start server:", err.message); process.exit(1); });
