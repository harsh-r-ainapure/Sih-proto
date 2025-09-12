import { useState, useRef, useEffect } from "react";
import "./App.css";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Home from "../components/home";
import Instagram from "../components/instagram";
import MyPosts from "../components/myposts";
import { valueContext } from "../counter/counter";
import { t } from "./utils/i18n";
import exifr from "exifr";

function App() {
  const [option, setOption] = useState("home");
  const [ogList, setOgList] = useState([]); // ✅ global list state
  const [currentLang, setCurrentLang] = useState("en"); // en | hi | mr
  const [reportOpen, setReportOpen] = useState(false);

  // load persisted language on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("app.lang");
      if (saved) setCurrentLang(saved);
    } catch (_) {
      // ignore
    }
  }, []);

  // Shared refs (kept for compatibility but not used by the old Inform page anymore)
  const locationRef = useRef();
  const disasterRef = useRef();
  const severityRef = useRef();
  const photoURLRef = useRef();

  const onclickhome = () => setOption("home");

  // Remove Inform page; repurpose to open the overlay
  const onclickform = () => setReportOpen(true);
  const onclickinsta = () => setOption("instagram");
  const onclickmypost = () => setOption("myPost");

  const MyComponent = () => {
    if (option === "home") return <Home />;
    if (option === "instagram") return <Instagram />;
    if (option === "myPost") return <MyPosts />;
    return null;
  };

  return (
    <valueContext.Provider
      value={{
        locationRef,
        disasterRef,
        severityRef,
        photoURLRef,
        ogList,
        setOgList,
        currentLang,
        setCurrentLang,
      }}
    >
      <Navbar
        onclickform={onclickform}
        onclickhome={onclickhome}
        onclickinsta={onclickinsta}
      />
      <div style={{ padding: "20px", marginTop: 64 }}>
        <MyComponent />
      </div>

      {/* Report Incident Overlay */}
      <ReportOverlay
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmitted={(payload) => {
          // Push a minimal item into the global list (if desired for UI elsewhere)
          const { city, shortDesc, lat, lon } = payload;
          setOgList((prev) => [
            { location: city, disaster: shortDesc, severity: "", photoURL: "", lang: currentLang },
            ...prev,
          ]);
        }}
        currentLang={currentLang}
      />

      <Footer onclickmypost={onclickmypost} />
    </valueContext.Provider>
  );
}

export default App;

function ReportOverlay({ open, onClose, onSubmitted, currentLang }) {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [city, setCity] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [name, setName] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTimestamp(new Date().toISOString());
      setError("");
      // Attempt geolocation on open if EXIF is not provided
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLat(pos.coords.latitude.toFixed(6));
            setLon(pos.coords.longitude.toFixed(6));
          },
          () => {
            // ignore; user may deny
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } else {
      // Reset on close
      setFile(null);
      setPreviewURL("");
      setLat("");
      setLon("");
      setCity("");
      setShortDesc("");
      setLongDesc("");
      setName("");
      setBusy(false);
      setError("");
    }
  }, [open]);

  const readAsDataURL = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");

    try {
      const dataUrl = await readAsDataURL(f);
      setPreviewURL(dataUrl);
    } catch (_) {}

    // Try EXIF GPS first
    try {
      const gps = await exifr.gps(f);
      if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
        setLat(gps.latitude.toFixed(6));
        setLon(gps.longitude.toFixed(6));
        return; // We got coordinates from EXIF
      }
    } catch (_) {
      // ignore and fallback to geolocation
    }

    // Fallback to browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLon(pos.coords.longitude.toFixed(6));
        },
        () => {
          setError(
            "Location permission denied. Please allow location or enter coordinates manually."
          );
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation not supported by this browser.");
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (!file) {
        throw new Error("Please upload an image");
      }
      if (!city.trim()) {
        throw new Error("Please enter city");
      }
      if (!shortDesc.trim()) {
        throw new Error("Please enter a short description");
      }
      if (!name.trim()) {
        throw new Error("Please enter your name");
      }

      const payload = {
        city: city.trim(),
        shortDesc: shortDesc.trim(),
        longDesc: longDesc.trim(),
        name: name.trim(),
        lat: lat ? Number(lat) : null,
        lon: lon ? Number(lon) : null,
        timestamp,
        // For demonstration purposes only; a real app would upload to storage and send a URL
        image: previewURL,
      };

      await fetch("http://localhost:5000/inform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      onSubmitted?.(payload);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to submit report");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 16,
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{
          width: "min(720px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #eee",
            background: "linear-gradient(180deg, #007BFF 0%, #0063cc 100%)",
            color: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <h3 style={{ margin: 0, fontWeight: 700 }}>{t("report_title", currentLang) || "Report Incident"}</h3>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitReport} style={{ padding: 20, display: "grid", gap: 16 }}>
          {/* Upload */}
          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <label style={{ fontWeight: 600 }}>
              {t("report_upload_image", currentLang) || "Upload image"}
            </label>
            <div
              style={{
                border: "2px dashed #c8d7ff",
                borderRadius: 12,
                padding: 16,
                background: "#f6f9ff",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ flex: 1 }}
              />
              {previewURL ? (
                <img
                  src={previewURL}
                  alt="preview"
                  style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                />
              ) : null}
            </div>
            <small style={{ color: "#555" }}>
              We will try to extract GPS from the image. If not present, we'll use your current location.
            </small>
          </div>

          
          {/* City */}
          <div>
            <label style={{ fontWeight: 600 }}>{t("report_city", currentLang) || "City"}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
              <option value="" disabled>Select a city</option>
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Bengaluru</option>
              <option>Hyderabad</option>
              <option>Ahmedabad</option>
              <option>Chennai</option>
              <option>Kolkata</option>
              <option>Pune</option>
              <option>Jaipur</option>
              <option>Surat</option>
            </select>
          </div>

          {/* Short description */}
          <div>
            <label style={{ fontWeight: 600 }}>{t("report_short_desc", currentLang) || "Short description"}</label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Brief summary"
              style={inputStyle}
            />
          </div>

          {/* Long description */}
          <div>
            <label style={{ fontWeight: 600 }}>{t("report_long_desc", currentLang) || "Long description (optional)"}</label>
            <textarea
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              placeholder="Additional details (optional)"
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Name */}
          <div>
            <label style={{ fontWeight: 600 }}>{t("report_name", currentLang) || "Your name"}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              style={inputStyle}
            />
          </div>

          {/* Timestamp */}
          <div>
            <label style={{ fontWeight: 600 }}>{t("report_time", currentLang) || "Time"}</label>
            <input type="text" value={timestamp} readOnly style={{ ...inputStyle, background: "#f7f7f7" }} />
          </div>

          {error ? (
            <div style={{ color: "#b00020", fontWeight: 600 }}>{error}</div>
          ) : null}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={btnSecondary}
              disabled={busy}
            >
              {t("report_cancel", currentLang) || "Cancel"}
            </button>
            <button type="submit" style={btnPrimary} disabled={busy}>
              {busy ? "Submitting…" : t("report_submit", currentLang) || "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #dbe1f2",
  background: "#ffffff",
  color: "#000000",
  outline: "none",
  boxShadow: "0 1px 0 rgba(0,0,0,0.02) inset",
};

const btnPrimary = {
  appearance: "none",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  background: "linear-gradient(180deg, #007BFF 0%, #0063cc 100%)",
  color: "#fff",
  cursor: "pointer",
};

const btnSecondary = {
  appearance: "none",
  border: "1px solid #cfd8ea",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 600,
  background: "#ffffff",
  color: "#1f2b50",
  cursor: "pointer",
};
