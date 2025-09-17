import { useContext, useState, useEffect } from "react";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";

const Latest = () => {
  const { currentLang, setOption } = useContext(valueContext);
  const [incidents, setIncidents] = useState([]);

  // Fetch latest incidents from backend and auto-refresh
  useEffect(() => {
    let timer;
    const base = import.meta.env.VITE_API_BASE || "";
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${base}/reports`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = Array.isArray(json.items) ? json.items : [];
        // Map severity number -> label
        const mapped = items.map((it) => ({
          ...it,
          severityLabel: Number(it.severity) >= 4 ? "HIGH" : Number(it.severity) === 3 ? "MEDIUM" : "LOW",
        }));
        setIncidents(mapped);
      } catch (e) {
        console.error("Failed to fetch incidents:", e);
      }
    };
    fetchIncidents();
    timer = setInterval(fetchIncidents, 15000); // refresh every 15s
    return () => clearInterval(timer);
  }, []);

  const getSeverityColor = (sev) => {
    const s = typeof sev === "string" ? sev.toUpperCase() : (sev >= 4 ? "HIGH" : sev === 3 ? "MEDIUM" : "LOW");
    switch (s) {
      case "HIGH":
        return "#d7191c";
      case "MEDIUM":
        return "#fdae61";
      case "LOW":
        return "#ffff33";
      default:
        return "#1a9641";
    }
  };

  const handleViewOnMap = (incident) => {
    const { lat, lon } = incident || {};
    if (typeof lat !== 'number' || typeof lon !== 'number') return;
    // Navigate to map (home) and then focus with context
    setOption("home");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mapFocusIncident', { 
        detail: { 
          lat, 
          lon,
          description: incident.description,
          imageUrl: incident.imageUrl,
          disaster: incident.disaster,
          severity: incident.severity
        } 
      }));
    }, 0);
  };

  return (
    <div className="latest-incidents" style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: 8 }}>
      <h2 style={{ 
        color: "#007BFF", 
        margin: "8px 0 16px",
        textAlign: "center",
        fontSize: "1.4rem",
        letterSpacing: 0.5
      }}>
        🌊 {t("latest_incidents", currentLang) || "LATEST OCEAN HAZARD INCIDENTS"}
      </h2>
      
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "16px",
        alignItems: "start"
      }}>
        {incidents.map((incident) => (
          <div
            key={incident.id}
            style={{
              background: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
              maxWidth: 720,
              margin: "0 auto"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "5px", color: "#333" }}>{incident.location}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ 
                    backgroundColor: getSeverityColor(incident.severity),
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: "bold"
                  }}>
                    {incident.severityLabel || incident.severity}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "#666" }}>{incident.disaster}</span>
                </div>
              </div>
              <button 
                onClick={() => handleViewOnMap(incident)}
                style={{
                  backgroundColor: "#007BFF",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "transform 0.1s ease, background-color 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0056b3"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#007BFF"}
              >
                View on Map
              </button>
            </div>

            {incident.imageUrl ? (
              <div style={{ marginBottom: "15px", borderRadius: "8px", overflow: "hidden", maxHeight: "240px", background: "#f6f8fa" }}>
                <img 
                  src={incident.imageUrl.startsWith("http") ? incident.imageUrl : `${import.meta.env.VITE_API_BASE || ''}${incident.imageUrl}`}
                  alt={incident.disaster || 'Report image'} 
                  style={{ width: "100%", height: "auto", objectFit: "cover", display: 'block' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            ) : null}

            <p style={{ fontSize: "0.95rem", color: "#444", marginBottom: "15px" }}>
              {incident.description}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "15px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                {incident.reportedBy ? (
                  <div>
                    <span style={{ fontWeight: "500" }}>Reported by:</span> {incident.reportedBy}
                  </div>
                ) : null}
                <div>
                  <span style={{ fontWeight: "500" }}>Date:</span> {incident.reportDate ? new Date(incident.reportDate).toLocaleString() : ''}
                </div>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666", textAlign: "right" }}>
                {incident.verifiedBy ? (
                  <div>
                    <span style={{ fontWeight: "500" }}>Verified by:</span> {incident.verifiedBy}
                  </div>
                ) : null}
                {/* Keeping space for future verified date if needed */}
                
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Latest;