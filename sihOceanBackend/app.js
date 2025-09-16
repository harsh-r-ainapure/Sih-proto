import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Your existing multer and express code follows...
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

app.post("/inform", (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("media")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  }
  return next();
}, async (req, res) => {
  const { city, shortDesc, longDesc, name, lat, lon, mediaType } = req.body || {};
  const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;
  const description = `${shortDesc} - ${longDesc}`;
  
  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .upsert({ email: `${name}@example.com` })
      .select('id')
      .single();

    if (userError) {
      console.error("Error creating user:", userError);
      return res.status(500).json({ message: "Error saving report" });
    }

    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: userData.id,
        hazard_type: mediaType,
        severity: 3,
        description,
        location: `POINT(${lon} ${lat})`, // Supabase will convert this
        media_urls: mediaPath ? [mediaPath] : [],
        verification_status: "pending",
      });

    if (reportError) {
      console.error("Error saving report:", reportError);
      return res.status(500).json({ message: "Error saving report" });
    }

    res.status(200).json({ message: "Report received and saved to database" });
  } catch (err) {
    console.error("Error saving report to database:", err);
    res.status(500).json({ message: "Error saving report" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});