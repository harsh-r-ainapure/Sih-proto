import { useState, useRef, useEffect, useMemo } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Home from "../components/home";
import Instagram from "../components/instagram";
import MyPosts from "../components/myposts";
import Reddit from "../components/reddit";
import Latest from "../components/latest";
import { valueContext } from "../counter/counter";
import { t } from "./utils/i18n";
import exifr from "exifr";
import { CITIES_BY_STATE, getAllCities } from "./utils/indiaCities";

const IN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Surat",
  "Pune",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Pimpri-Chinchwad",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Kalyan-Dombivli",
  "Vasai-Virar",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Navi Mumbai",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Guwahati",
  "Chandigarh",
  "Solapur",
  "Hubballi-Dharwad",
  "Bareilly"
];

function App() {
  const [option, setOption] = useState("home");
  const [ogList, setOgList] = useState([]); // ✅ global list state
  const [currentLang, setCurrentLang] = useState("en"); // en | hi | mr
  const [reportOpen, setReportOpen] = useState(false);
  const [latestIncidents, setLatestIncidents] = useState([]);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("app.theme") || "light"; } catch { return "light"; }
  });

  // load persisted language on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("app.lang");
      if (saved) setCurrentLang(saved);
    } catch (_) {
      // ignore
    }
  }, []);

  // persist theme and update document attribute for CSS hooks
  useEffect(() => {
    try { localStorage.setItem("app.theme", theme); } catch {}
    try { document.documentElement.setAttribute("data-theme", theme); } catch {}
    try { window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } })); } catch {}
  }, [theme]);

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
  const onclickreddit = () => setOption("reddit");
  const onclicklatest = () => setOption("latest");

  const MyComponent = () => {
    if (option === "home") return <Home />;
    if (option === "instagram") return <Instagram />;
    if (option === "myPost") return <MyPosts />;
    if (option === "reddit") return <Reddit />;
    if (option === "latest") return <Latest />;
    return null;
  };

  console.log("VITE_WEATHERAPI_KEY:", import.meta.env.VITE_WEATHERAPI_KEY);


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
        setOption, // expose for navigation from children (e.g., Latest -> Map)
      }}
    >
      <Navbar
        onclickform={onclickform}
        onclickhome={onclickhome}
        onclickinsta={onclickinsta}
        onclickreddit={onclickreddit}
        onclicklatest={onclicklatest}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      />
      <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0 }}>
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

      <Footer
        onclickmypost={onclickmypost}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      />
    </valueContext.Provider>
  );
}

export default App;

function ReportOverlay({ open, onClose, onSubmitted, currentLang }) {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [objectURL, setObjectURL] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [weather, setWeather] = useState(null);
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [name, setName] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  // New fields for hazard and severity
  const [hazardType, setHazardType] = useState("");
  const [severity, setSeverity] = useState(3);
  const hasWeatherKey = !!import.meta.env.VITE_WEATHERAPI_KEY;
  const filteredCities = useMemo(() => {
    const source = stateName && CITIES_BY_STATE[stateName] ? CITIES_BY_STATE[stateName] : getAllCities();
    const words = city.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return source.slice(0, 10);
    return source.filter((c) => {
      const lc = c.toLowerCase();
      return words.every((w) => lc.includes(w));
    }).slice(0, 10);
  }, [city, stateName]);

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
      if (objectURL) { try { URL.revokeObjectURL(objectURL); } catch (_) {} }
      setFile(null);
      setPreviewURL("");
      setObjectURL("");
      setLat("");
      setLon("");
      setCity("");
      setStateName("");
      setWeather(null);
      setShortDesc("");
      setLongDesc("");
      setName("");
      setHazardType("");
      setSeverity(3);
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

    // Cleanup previous object URL if any
    if (objectURL) {
      try { URL.revokeObjectURL(objectURL); } catch (_) {}
      setObjectURL("");
    }

    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");

    try {
      if (isImage) {
        const dataUrl = await readAsDataURL(f);
        setPreviewURL(dataUrl);
      } else if (isVideo) {
        const url = URL.createObjectURL(f);
        setPreviewURL(url);
        setObjectURL(url);
      } else {
        setPreviewURL("");
      }
    } catch (_) {}

    // Try EXIF GPS only for images
    if (isImage) {
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
            "Location permission denied. Please allow location access so we can detect GPS coordinates."
          );
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation not supported by this browser.");
    }
  };

  useEffect(() => {
    // Fetch weather when valid city is selected
    const cityNormalized = city.trim();
    const list = stateName && CITIES_BY_STATE[stateName] ? CITIES_BY_STATE[stateName] : getAllCities();
    const isValidCity = cityNormalized && list.some((c) => c.toLowerCase() === cityNormalized.toLowerCase());
    if (!isValidCity) {
      setWeather(null);
      setWeatherLoading(false);
      setWeatherError("");
      return;
    }
    const key = import.meta.env.VITE_WEATHERAPI_KEY;
    if (!key) {
      setWeather(null);
      setWeatherLoading(false);
      setWeatherError("Weather API key is not configured.");
      return;
    }
    const q = encodeURIComponent(cityNormalized);
    setWeatherLoading(true);
    setWeatherError("");
    fetch(`https://api.weatherapi.com/v1/current.json?key=${key}&q=${q}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data || !data.current) {
          setWeather(null);
          setWeatherError("Weather not available.");
          return;
        }
        setWeather({
          temp_c: data.current.temp_c,
          condition: data.current.condition?.text,
          icon: data.current.condition?.icon,
          humidity: data.current.humidity,
          wind_kph: data.current.wind_kph,
        });
      })
      .catch((e) => {
        setWeather(null);
        setWeatherError("Failed to fetch weather.");
      })
      .finally(() => setWeatherLoading(false));
  }, [city, stateName]);

  useEffect(() => {
    // Hide suggestions once city exactly matches a list item
    const list = stateName && CITIES_BY_STATE[stateName] ? CITIES_BY_STATE[stateName] : getAllCities();
    const exact = city.trim() && list.some((c) => c.toLowerCase() === city.trim().toLowerCase());
    if (exact) setShowSug(false);
  }, [city, stateName]);

  const submitReport = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (!file) {
        throw new Error("Please upload an image or video");
      }
      const cityNormalized = city.trim();
      if (!cityNormalized) {
        throw new Error("Please select a city");
      }
      const list = stateName && CITIES_BY_STATE[stateName] ? CITIES_BY_STATE[stateName] : getAllCities();
      const isValidCity = list.some((c) => c.toLowerCase() === cityNormalized.toLowerCase());
      if (!isValidCity) {
        throw new Error("Please select a valid city from the list");
      }
      if (!shortDesc.trim()) {
        throw new Error("Please enter a short description");
      }
      if (!name.trim()) {
        throw new Error("Please enter your name");
      }
      if (!hazardType) {
        throw new Error("Please select a hazard type");
      }
      const sevNum = Number(severity);
      if (!Number.isInteger(sevNum) || sevNum < 1 || sevNum > 5) {
        throw new Error("Please select severity between 1 and 5");
      }

      const mediaType = file?.type?.startsWith("video/") ? "video" : (file?.type?.startsWith("image/") ? "image" : "unknown");

      const form = new FormData();
      form.append("city", city.trim());
      form.append("shortDesc", shortDesc.trim());
      form.append("longDesc", longDesc.trim());
      form.append("name", name.trim());
      if (lat) form.append("lat", String(Number(lat)));
      if (lon) form.append("lon", String(Number(lon)));
      form.append("timestamp", timestamp);
      form.append("hazardType", hazardType);
      form.append("severity", String(severity));
      form.append("mediaType", mediaType);
      if (file) form.append("media", file, file.name);

      const resp = await fetch("http://localhost:5000/inform", {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        // Try to extract detailed error from backend
        let details = "";
        try { const j = await resp.json(); details = j.details || j.message || ""; } catch (_) {}
        throw new Error(details || `Server error (${resp.status}) while saving report`);
      }

      onSubmitted?.({
        city: city.trim(),
        shortDesc: shortDesc.trim(),
        lat: lat ? Number(lat) : null,
        lon: lon ? Number(lon) : null,
        timestamp,
        image: previewURL,
      });
      onClose();
    } catch (err) {
      alert(err?.message || "Failed to submit report");
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
          background: "var(--panel-bg, #ffffff)",
          color: "var(--panel-fg, #111)",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          border: "1px solid var(--panel-bd, rgba(0,0,0,0.08))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--panel-bd, #eee)",
            background: "var(--header-grad, linear-gradient(180deg, #007BFF 0%, #0063cc 100%))",
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
              {t("report_upload_image", currentLang) || "Upload image or video"}
            </label>
            <div
              style={{
                border: "2px dashed var(--panel-bd, #c8d7ff)",
                borderRadius: 12,
                padding: 16,
                background: "var(--panel-bg, #f6f9ff)",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ flex: 1 }}
              />
              {previewURL ? (
                file && file.type.startsWith("video/") ? (
                  <video
                    src={previewURL}
                    style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                    controls
                  />
                ) : (
                  <img
                    src={previewURL}
                    alt="preview"
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                  />
                )
              ) : null}
            </div>
            <small style={{ color: "#555" }}>
              We will try to extract GPS from the media. If not present, we'll use your current location.
            </small>
          </div>

          
          {/* State and City */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600 }}>State/UT</label>
              <select
                value={stateName}
                onChange={(e) => {
                  setStateName(e.target.value);
                  setCity("");
                }}
                style={inputStyle}
              >
                <option value="">All (India)</option>
                {Object.keys(CITIES_BY_STATE).sort().map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <label style={{ fontWeight: 600 }}>{t("report_city", currentLang) || "City"}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); setShowSug(true); }}
                onFocus={() => setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                placeholder="Start typing a city"
                style={{ ...inputStyle, color: "var(--panel-fg, #111)", background: "var(--panel-bg, #fff)", borderColor: "var(--panel-bd, #dbe1f2)" }}
                autoComplete="off"
              />
              {showSug && city && filteredCities.length > 0 && (
                <div style={suggestionsStyle}>
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setCity(c); setShowSug(false); }}
                      style={sugButtonStyle}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weather Preview */}
          <div style={weatherPanelStyle}>
            {weatherLoading && (
              <div style={{ color: "#333" }}>Loading weather…</div>
            )}
            {!weatherLoading && weatherError && (
              <div style={{ color: "#b00020", fontWeight: 600 }}>{weatherError}</div>
            )}
            {!weatherLoading && !weatherError && !weather && (
              <div style={{ color: "#333" }}>
                {hasWeatherKey ? "Select a valid city to see current weather" : "Add VITE_WEATHERAPI_KEY in .env to show current weather"}
              </div>
            )}
            {!weatherLoading && !weatherError && weather && (
              <>
                {weather.icon && <img src={weather.icon} alt="icon" />}
                <div>
                  <div style={{ fontWeight: 600 }}>{city}</div>
                  <div style={{ color: "#333" }}>{weather.condition} • {weather.temp_c}°C • Humidity {weather.humidity}% • Wind {weather.wind_kph} km/h</div>
                </div>
              </>
            )}
          </div>

          {/* Hazard type and Severity */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600 }}>Hazard type</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select hazard</option>
                <option value="Tsunami">Tsunami</option>
                <option value="Extreme waves">Extreme waves</option>
                <option value="Cyclones / storm surges">Cyclones / storm surges</option>
                <option value="Coastal flooding">Coastal flooding</option>
                <option value="Rip current">Rip current</option>
                <option value="Fish kills">Fish kills</option>
                <option value="Oil spill">Oil spill</option>
                <option value="Coastal erosion">Coastal erosion</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Severity (1–5)</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                style={inputStyle}
              >
                {[1,2,3,4,5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
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

const suggestionsStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  marginTop: 6,
  background: "#ffffff",
  border: "1px solid #dbe1f2",
  borderRadius: 10,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  maxHeight: 240,
  overflowY: "auto",
  zIndex: 10,
};

const sugButtonStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "8px 12px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#000000",
};

const weatherPanelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
  border: "1px solid #e7eefb",
  borderRadius: 10,
  minHeight: 56,
};
