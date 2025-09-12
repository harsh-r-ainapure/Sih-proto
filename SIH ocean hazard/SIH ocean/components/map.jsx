import { useEffect, useState, useContext, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";
import IncidentForm from "./incident-form";

const Map = () => {
  const { currentLang } = useContext(valueContext);
  const [map, setMap] = useState(null);
  const [showHeat, setShowHeat] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showDbscan, setShowDbscan] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showIncidentPopup, setShowIncidentPopup] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  // Static incident data
  const staticIncidents = useMemo(() => [
    {
      id: 1,
      lat: 19.0760,
      lng: 72.8777,
      title: "Oil Spill Near Mumbai Port",
      description: "Large oil spill detected near Mumbai port area. Environmental hazard affecting marine life. Immediate cleanup required.",
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop",
      reportedBy: "Marine Patrol Unit",
      reportedDate: "2024-01-15T10:30:00Z",
      verifiedBy: "Coast Guard",
      verifiedDate: "2024-01-15T11:00:00Z",
      isVerified: true,
      severity: "high",
      type: "oil_spill"
    },
    {
      id: 2,
      lat: 12.9716,
      lng: 77.5946,
      title: "Chemical Leak in Bangalore",
      description: "Industrial chemical leak detected in water treatment facility. Potential contamination of local water sources.",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      reportedBy: "Environmental Agency",
      reportedDate: "2024-01-14T14:20:00Z",
      verifiedBy: "Hazard Response Team",
      verifiedDate: "2024-01-14T15:00:00Z",
      isVerified: true,
      severity: "medium",
      type: "chemical_leak"
    },
    {
      id: 3,
      lat: 28.6139,
      lng: 77.2090,
      title: "Water Contamination Alert",
      description: "High levels of pollutants detected in Yamuna River. Public health advisory issued for affected areas.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
      reportedBy: "Water Quality Board",
      reportedDate: "2024-01-13T09:15:00Z",
      verifiedBy: "Health Department",
      verifiedDate: "2024-01-13T10:30:00Z",
      isVerified: true,
      severity: "high",
      type: "water_contamination"
    },
    {
      id: 4,
      lat: 13.0827,
      lng: 80.2707,
      title: "Air Quality Emergency",
      description: "Severe air pollution levels detected in Chennai industrial zone. Visibility reduced to dangerous levels.",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      reportedBy: "Air Quality Monitoring",
      reportedDate: "2024-01-12T16:45:00Z",
      verifiedBy: "Environmental Protection Agency",
      verifiedDate: "2024-01-12T17:30:00Z",
      isVerified: true,
      severity: "high",
      type: "air_pollution"
    },
    {
      id: 5,
      lat: 22.5726,
      lng: 88.3639,
      title: "Industrial Waste Dumping",
      description: "Illegal dumping of industrial waste detected in Kolkata port area. Environmental impact assessment required.",
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop",
      reportedBy: "Port Authority",
      reportedDate: "2024-01-11T12:00:00Z",
      verifiedBy: "Environmental Compliance",
      verifiedDate: "2024-01-11T13:15:00Z",
      isVerified: true,
      severity: "medium",
      type: "waste_dumping"
    }
  ], []);

  // Initialize incidents with static data
  useEffect(() => {
    setIncidents(staticIncidents);
  }, [staticIncidents]);

  // Handle new incident submission
  const handleNewIncident = (newIncident) => {
    setIncidents(prev => [...prev, newIncident]);
    // Refresh the map to show the new incident
    if (map) {
      // Remove existing incident markers
      map.eachLayer(layer => {
        if (layer instanceof L.LayerGroup && layer._leaflet_id) {
          map.removeLayer(layer);
        }
      });
      // Re-add all layers
      // This will be handled by the useEffect when incidents state changes
    }
  };

  useEffect(() => {
    
    const leafletMap = L.map("map").setView([15, 78], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(leafletMap);

    // Provided coordinates (lat, lon)
    // Provided coordinates grouped roughly by region with simple weights
    const group1 = [
      [23.5338, 68.4929],
      [23.5133, 68.5004],
      [23.5193, 68.5564],
      [23.30443, 68.67691],
      [23.23082, 68.68343],
      [23.26597, 68.76274],
    ];
    const group2 = [
      [19.5062, 72.7625],
      [19.2652, 72.7851],
      [19.2905, 72.9087],
    ];
    const group3 = [
      [13.0027, 74.7894],
      [12.8742, 74.9604],
      [12.7992, 74.8485],
    ];

    // Heavier weight for northern cluster, medium for central, light for southern
    const hazardPoints = [
      ...group1.map(([lat, lon]) => ({ lat, lon, report_count: 3 })),
      // Mumbai cluster: force highest severity
      ...group2.map(([lat, lon]) => ({ lat, lon, report_count: 5 })),
      ...group3.map(([lat, lon]) => ({ lat, lon, report_count: 1 })),
    ];

    const max_count = Math.max(...hazardPoints.map((p) => p.report_count));

    
    const incidentsLayer = L.layerGroup();
    incidents.forEach((incident) => {
      const severityColors = {
        high: "#d7191c",
        medium: "#fdae61", 
        low: "#1a9641"
      };
      const color = severityColors[incident.severity] || "#1a9641";
      
      L.circleMarker([incident.lat, incident.lng], { 
        radius: 10, 
        color,
        weight: 3, 
        fillOpacity: 0.8 
      })
        .bindPopup(`
          <div style="min-width: 200px;">
            <h6 style="margin: 0 0 8px 0; color: ${color};">${incident.title}</h6>
            <p style="margin: 0 0 8px 0; font-size: 12px;">${incident.description.substring(0, 100)}...</p>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666;">
              <span>${incident.isVerified ? '✅ Verified' : '⏳ Pending'}</span>
              <span>${new Date(incident.reportedDate).toLocaleDateString()}</span>
            </div>
          </div>
        `)
        .on('click', () => {
          setSelectedIncident(incident);
          setShowIncidentPopup(true);
        })
        .addTo(incidentsLayer);
    });

    
    const heatData = hazardPoints.map((p) => [p.lat, p.lon, p.report_count]);
    const heatLayer = L.heatLayer(heatData, {
      radius: 28,
      blur: 22,
      minOpacity: 0.5,
      maxZoom: 18,
      // green -> yellow -> orange -> red
      gradient: {
        0.0: "#1a9641",
        0.33: "#ffff33",
        0.66: "#fdae61",
        1.0: "#d7191c",
      },
    });

    // DBSCAN clusters (simple client-side implementation)
    function toRad(v) { return (v * Math.PI) / 180; }
    function haversineKm(a, b) {
      const R = 6371;
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    }
    function dbscan(points, epsKm, minPts) {
      const clusterIds = new Array(points.length).fill(undefined);
      let clusterId = 0;
      for (let i = 0; i < points.length; i++) {
        if (clusterIds[i] !== undefined) continue;
        const neighbors = [];
        for (let j = 0; j < points.length; j++) {
          if (haversineKm(points[i], points[j]) <= epsKm) neighbors.push(j);
        }
        if (neighbors.length < minPts) {
          clusterIds[i] = -1;
          continue;
        }
        clusterIds[i] = clusterId;
        const queue = neighbors.filter((idx) => idx !== i);
        while (queue.length) {
          const q = queue.pop();
          if (clusterIds[q] === -1) clusterIds[q] = clusterId;
          if (clusterIds[q] !== undefined) continue;
          clusterIds[q] = clusterId;
          const qNeighbors = [];
          for (let k = 0; k < points.length; k++) {
            if (haversineKm(points[q], points[k]) <= epsKm) qNeighbors.push(k);
          }
          if (qNeighbors.length >= minPts) {
            for (const n of qNeighbors) if (clusterIds[n] === undefined) queue.push(n);
          }
        }
        clusterId++;
      }
      return clusterIds;
    }
    const clusterIds = dbscan(hazardPoints, 60, 2);
    const dbscanLayer = L.layerGroup();
    const palette = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

    // Compute convex hull (monotonic chain) for each cluster and draw polygon areas
    function convexHullLatLng(points) {
      if (points.length <= 1) return points.map((p) => [p.lat, p.lon]);
      const pts = points.map((p) => ({ x: p.lon, y: p.lat, ref: p })).sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
      const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      const lower = [];
      for (const p of pts) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
        lower.push(p);
      }
      const upper = [];
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
        upper.push(p);
      }
      const hull = lower.slice(0, lower.length - 1).concat(upper.slice(0, upper.length - 1));
      return hull.map((p) => [p.y, p.x]);
    }

    const cidToPoints = new globalThis.Map();
    clusterIds.forEach((cid, idx) => {
      if (cid < 0) return; // skip noise for polygon areas
      if (!cidToPoints.has(cid)) cidToPoints.set(cid, []);
      cidToPoints.get(cid).push(hazardPoints[idx]);
    });

    cidToPoints.forEach((pts, cid) => {
      if (pts.length === 1) {
        const p = pts[0];
        const color = palette[cid % palette.length];
        L.circleMarker([p.lat, p.lon], { radius: 6, color, weight: 2, fillOpacity: 0.7 })
          .bindPopup(`Cluster #${cid}`)
          .addTo(dbscanLayer);
        return;
      }
      const latlngs = convexHullLatLng(pts);
      const color = palette[cid % palette.length];
      L.polygon(latlngs, { color, weight: 2, fillOpacity: 0.15 })
        .bindPopup(`Cluster #${cid} (area)`)
        .addTo(dbscanLayer);
    });

   // Hotspots: fixed 15km radius around each hazard point
    const hotspotsLayer = L.layerGroup();
    hazardPoints.forEach((p) => {
      const ratio = p.report_count / max_count;
      const color = ratio >= 0.75 ? "#d7191c" : ratio >= 0.5 ? "#fdae61" : ratio >= 0.25 ? "#ffff33" : "#1a9641";
      L.circle([p.lat, p.lon], { radius: 5000, color, weight: 2, fillOpacity: 0.15 })
        .bindPopup(`Hotspot radius 15km\nIntensity: ${p.report_count}`)
       .addTo(hotspotsLayer);
    });

    // Initial visibility based on toggle state
    if (showHeat) {
      heatLayer.addTo(leafletMap);
    }
    if (showPoints) {
      incidentsLayer.addTo(leafletMap);
    }
    if (showDbscan) {
      dbscanLayer.addTo(leafletMap);
    }
    if (showHotspots) {
      hotspotsLayer.addTo(leafletMap);
    }

    // Fit map to bounds of provided points
    if (hazardPoints.length > 0) {
      const bounds = L.latLngBounds(hazardPoints.map((p) => [p.lat, p.lon]));
      leafletMap.fitBounds(bounds.pad(0.2));
    }

    setMap(leafletMap);

    // Listen for search events from navbar
    const handleMapSearch = (event) => {
      try {
        const { lat, lon, display_name } = event.detail;
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        leafletMap.setView([latNum, lonNum], 14);
        L.marker([latNum, lonNum])
          .addTo(leafletMap)
          .bindPopup(`<b>${display_name}</b>`)
          .openPopup();
      } catch (error) {
        console.error("Error processing search data:", error);
      }
    };

    // Add event listener for search
    window.addEventListener('mapSearch', handleMapSearch);

    return () => {
      leafletMap.remove();
      window.removeEventListener('mapSearch', handleMapSearch);
    };
  }, [showHeat, showPoints, showDbscan, showHotspots, incidents]);


  return (
    <div style={{ position: "relative", height: "calc(100vh - 200px)", width: "100%" }}>

      {/* Layer controls - Mobile responsive dropdown */}
      <div
        className="dropdown"
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
        }}
      >
        <button
          className="btn btn-light dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Map Layers
        </button>
        <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: "250px" }}>
          <li style={{ padding: "8px 16px", borderBottom: "1px solid #eee" }}>
            <div style={{ fontWeight: "600", color: "#333", fontSize: "12px", textTransform: "uppercase" }}>
              OpenStreetMap Layers
            </div>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer" }}>
          <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />
              <span>Incident Reports</span>
        </label>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer" }}>
          <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
              <span>Heatmap</span>
        </label>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer" }}>
          <input type="checkbox" checked={showDbscan} onChange={(e) => setShowDbscan(e.target.checked)} />
              <span>Cluster Areas (DBSCAN)</span>
        </label>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer" }}>
          <input type="checkbox" checked={showHotspots} onChange={(e) => setShowHotspots(e.target.checked)} />
              <span>Hotspots (15km radius)</span>
        </label>
          </li>
        </ul>
      </div>


      {/* Fullscreen map */}
      <div
        id="map"
        style={{
          height: "calc(100vh - 200px)",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      >      </div>

      {/* Incident Details Popup Modal */}
      {showIncidentPopup && selectedIncident && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => setShowIncidentPopup(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowIncidentPopup(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
                zIndex: 1,
              }}
            >
              ×
            </button>

            {/* Incident Image */}
            {selectedIncident.image && (
              <img
                src={selectedIncident.image}
                alt={selectedIncident.title}
                style={{
                  width: "100%",
                  height: "250px",
                  objectFit: "cover",
                  borderTopLeftRadius: "12px",
                  borderTopRightRadius: "12px",
                }}
              />
            )}

            <div style={{ padding: "24px" }}>
              {/* Title and Severity */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, color: "#333", fontSize: "20px", lineHeight: "1.3" }}>
                  {selectedIncident.title}
                </h3>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    backgroundColor: selectedIncident.severity === "high" ? "#fee" : selectedIncident.severity === "medium" ? "#fff3cd" : "#d4edda",
                    color: selectedIncident.severity === "high" ? "#721c24" : selectedIncident.severity === "medium" ? "#856404" : "#155724",
                  }}
                >
                  {selectedIncident.severity}
                </span>
              </div>

              {/* Description */}
              <p style={{ margin: "0 0 20px 0", color: "#666", lineHeight: "1.6" }}>
                {selectedIncident.description}
              </p>

              {/* Status Boxes */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                {/* Reported Box */}
                <div style={{ flex: 1, padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>📝</span>
                    <span style={{ fontWeight: "600", color: "#333" }}>Reported</span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <div><strong>By:</strong> {selectedIncident.reportedBy}</div>
                    <div><strong>Date:</strong> {new Date(selectedIncident.reportedDate).toLocaleString()}</div>
                  </div>
                </div>

                {/* Verified Box */}
                <div style={{ flex: 1, padding: "16px", backgroundColor: selectedIncident.isVerified ? "#d4edda" : "#fff3cd", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>{selectedIncident.isVerified ? "✅" : "⏳"}</span>
                    <span style={{ fontWeight: "600", color: "#333" }}>Verified</span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    {selectedIncident.isVerified ? (
                      <>
                        <div><strong>By:</strong> {selectedIncident.verifiedBy}</div>
                        <div><strong>Date:</strong> {new Date(selectedIncident.verifiedDate).toLocaleString()}</div>
                      </>
                    ) : (
                      <div>Pending verification</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                <input
                  type="checkbox"
                  id="verified-toggle"
                  checked={selectedIncident.isVerified}
                  onChange={(e) => {
                    const updatedIncident = {
                      ...selectedIncident,
                      isVerified: e.target.checked,
                      verifiedBy: e.target.checked ? "System Admin" : null,
                      verifiedDate: e.target.checked ? new Date().toISOString() : null
                    };
                    setSelectedIncident(updatedIncident);
                    setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? updatedIncident : inc));
                  }}
                  style={{ transform: "scale(1.2)" }}
                />
                <label htmlFor="verified-toggle" style={{ fontWeight: "600", color: "#333", cursor: "pointer" }}>
                  Mark as Verified
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Form Modal */}
      {showIncidentForm && (
        <IncidentForm
          onSubmit={handleNewIncident}
          onClose={() => setShowIncidentForm(false)}
        />
      )}
    </div>
  );
};

export default Map;
