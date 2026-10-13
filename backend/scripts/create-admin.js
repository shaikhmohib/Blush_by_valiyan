require("dotenv").config();
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
(async () => {
  const required = ["MONGODB_URI", "MONGODB_DB", "ADMIN_EMAIL", "ADMIN_PASSWORD", "JWT_SECRET"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) throw new Error("Missing .env values: " + missing.join(", "));
  if (process.env.ADMIN_PASSWORD.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await db.collection("admins").updateOne(
      { email },
      { $set: { name: process.env.ADMIN_NAME || "Portfolio Admin", email, passwordHash, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    console.log(`Admin account ready for ${email}.`);
  } finally { await client.close(); }
})().catch(err => { console.error(err.message); process.exit(1); });
