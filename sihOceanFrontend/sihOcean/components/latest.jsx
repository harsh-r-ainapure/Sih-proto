import { useContext, useState, useEffect } from "react";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";

const Latest = () => {
  const { currentLang } = useContext(valueContext);
  const [incidents, setIncidents] = useState([]);

  // Sample static incidents that will appear on the map
  useEffect(() => {
    // These incidents match the points shown on the map
    const staticIncidents = [
      {
        id: 1,
        location: "Mumbai Port",
        disaster: "Oil Spill",
        severity: "HIGH",
        description: "Large oil spill detected near Mumbai port area. Environmental hazard affecting marine life. Immediate cleanup required.",
        reportedBy: "Marine Patrol Unit",
        verifiedBy: "Coast Guard",
        reportDate: "1/15/2024, 4:00:00 PM",
        verifiedDate: "1/15/2024, 6:00:00 PM",
        lat: 19.2652,
        lon: 72.7851,
        imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce"
      },
      {
        id: 2,
        location: "Mangalore Coast",
        disaster: "Coral Bleaching",
        severity: "MEDIUM",
        description: "Significant coral bleaching observed along Mangalore coastline. Rising sea temperatures affecting coral reef ecosystem.",
        reportedBy: "Marine Research Team",
        verifiedBy: "Environmental Agency",
        reportDate: "1/12/2024, 10:30:00 AM",
        verifiedDate: "1/13/2024, 2:15:00 PM",
        lat: 12.8742,
        lon: 74.9604,
        imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7"
      },
      {
        id: 3,
        location: "Gulf of Kutch",
        disaster: "Industrial Waste Dumping",
        severity: "HIGH",
        description: "Illegal industrial waste dumping detected in Gulf of Kutch. Chemical contaminants threatening marine biodiversity.",
        reportedBy: "Local Fishermen Association",
        verifiedBy: "Pollution Control Board",
        reportDate: "1/10/2024, 8:45:00 AM",
        verifiedDate: "1/11/2024, 11:20:00 AM",
        lat: 23.5133,
        lon: 68.5004,
        imageUrl: "https://images.unsplash.com/photo-1621451537084-482c73073a0f"
      }
    ];

    setIncidents(staticIncidents);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity.toUpperCase()) {
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

  const handleViewOnMap = (lat, lon) => {
    // Dispatch custom event to center map on this incident
    window.dispatchEvent(new CustomEvent('mapFocusIncident', { 
      detail: { lat, lon } 
    }));
  };

  return (
    <div className="latest-incidents">
      <h2 style={{ 
        color: "#007BFF", 
        marginBottom: "20px",
        textAlign: "center",
        fontSize: "1.5rem"
      }}>
        🌊 {t("latest_incidents", currentLang) || "LATEST OCEAN HAZARD INCIDENTS"}
      </h2>
      
      <div style={{ display: "grid", gap: "20px" }}>
        {incidents.map((incident) => (
          <div
            key={incident.id}
            style={{
              background: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
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
                    {incident.severity}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "#666" }}>{incident.disaster}</span>
                </div>
              </div>
              <button 
                onClick={() => handleViewOnMap(incident.lat, incident.lon)}
                style={{
                  backgroundColor: "#007BFF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "5px 10px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#007BFF"}
              >
                View on Map
              </button>
            </div>

            {incident.imageUrl && (
              <div style={{ marginBottom: "15px", borderRadius: "8px", overflow: "hidden", maxHeight: "200px" }}>
                <img 
                  src={incident.imageUrl} 
                  alt={incident.disaster} 
                  style={{ width: "100%", height: "auto", objectFit: "cover" }}
                />
              </div>
            )}

            <p style={{ fontSize: "0.95rem", color: "#444", marginBottom: "15px" }}>
              {incident.description}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "15px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                <div>
                  <span style={{ fontWeight: "500" }}>Reported by:</span> {incident.reportedBy}
                </div>
                <div>
                  <span style={{ fontWeight: "500" }}>Date:</span> {incident.reportDate}
                </div>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666", textAlign: "right" }}>
                <div>
                  <span style={{ fontWeight: "500" }}>Verified by:</span> {incident.verifiedBy}
                </div>
                <div>
                  <span style={{ fontWeight: "500" }}>Date:</span> {incident.verifiedDate}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Latest;