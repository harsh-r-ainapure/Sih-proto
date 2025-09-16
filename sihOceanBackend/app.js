import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for handling image/video uploads
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

// Accept multipart form-data with optional media file
app.post("/inform", (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("media")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  }
  // For legacy JSON
  return next();
}, (req, res) => {
  // If using multipart, fields are in req.body (strings) and file in req.file
  if (req.file || (req.headers["content-type"] || "").includes("multipart/form-data")) {
    const { city, shortDesc, longDesc, name, lat, lon, timestamp, mediaType } = req.body || {};
    console.log("Received multipart report:");
    console.log({ city, shortDesc, longDesc, name, lat, lon, timestamp, mediaType });
    if (req.file) {
      console.log("Saved media:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });
    }
    return res.status(200).json({ message: "Report received", mediaSaved: !!req.file });
  }

  // Legacy JSON payload support
  const { location, disaster, severe, photo } = req.body || {};
  console.log("Received legacy JSON data:");
  console.log("Location:", location);
  console.log("Disaster:", disaster);
  console.log("Severity:", severe);
  console.log("Photo:", photo);

  res.status(200).json({ message: "Legacy form data received successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
