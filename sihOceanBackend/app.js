import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use("/uploads", express.static(uploadDir));

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
  const { city, shortDesc, longDesc, name, lat, lon, hazardType, severity } = req.body || {};
  const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;
  const description = `${shortDesc || ""}${longDesc ? ` - ${longDesc}` : ""}`.trim();

  // normalize severity 1..5
  let sev = parseInt(severity, 10);
  if (Number.isNaN(sev) || sev < 1 || sev > 5) sev = 3;

  try {
    // Prototype mode: skip user creation; store without user_id
    const { data: reportRow, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: null,
        hazard_type: hazardType || null,
        severity: sev,
        description,
        location: (lon && lat) ? `POINT(${lon} ${lat})` : null,
        media_urls: mediaPath ? [mediaPath] : [],
        verification_status: "pending",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (reportError) {
      console.error("Supabase reports.insert error:", reportError);
      return res.status(500).json({
        message: "Failed to save report",
        code: reportError.code,
        details: reportError.details || reportError.message,
        context: "reports.insert",
      });
    }

    res.status(200).json({ message: "Report saved", id: reportRow?.id });
  } catch (err) {
    console.error("Unexpected error saving report:", err);
    res.status(500).json({ message: "Unexpected server error", details: String(err) });
  }
});

// Fetch latest reports for frontend map/list
app.get("/reports", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("id, hazard_type, severity, description, media_urls, created_at, verification_status, location")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Supabase reports.select error:", error);
      return res.status(500).json({ message: "Failed to fetch reports", code: error.code, details: error.details || error.message });
    }

    const parseCoords = (loc) => {
      // Try GeoJSON { type, coordinates: [lon, lat] }
      if (loc && typeof loc === 'object' && Array.isArray(loc.coordinates)) {
        const [lo, la] = loc.coordinates;
        return { lat: Number(la), lon: Number(lo) };
      }
      // Try WKT string "POINT(lon lat)"
      if (typeof loc === 'string') {
        const m = loc.match(/POINT\s*\(\s*([\d.+-]+)\s+([\d.+-]+)\s*\)/i);
        if (m) return { lon: Number(m[1]), lat: Number(m[2]) };
      }
      return { lat: null, lon: null };
    };

    const items = (data || []).map((r) => {
      const { lat, lon } = parseCoords(r.location);
      return {
        id: r.id,
        location: "", // city not available in schema
        disaster: r.hazard_type || "",
        severity: typeof r.severity === "number" ? r.severity : 3,
        description: r.description || "",
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
        imageUrl: Array.isArray(r.media_urls) && r.media_urls.length ? r.media_urls[0] : null,
        reportDate: r.created_at,
        verifiedBy: r.verification_status,
      };
    });

    res.json({ items });
  } catch (err) {
    console.error("Unexpected error fetching reports:", err);
    res.status(500).json({ message: "Unexpected server error", details: String(err) });
  }
});

// Proxy Sarvam translate to avoid CORS and keep key server-side
app.post("/sarvam-translate", async (req, res) => {
  try {
    const apiKey = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing SARVAM_API_KEY on server" });
    }
    const body = req.body || {};
    const r = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!r.ok) {
      return res.status(r.status).json({ message: "Sarvam proxy error", status: r.status, data: json });
    }
    res.json(json);
  } catch (e) {
    console.error("/sarvam-translate error:", e);
    res.status(500).json({ message: "Unexpected proxy error", details: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});