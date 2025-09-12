import { useEffect, useState, useContext } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";

const Map = () => {
  const { currentLang } = useContext(valueContext);
  const [map, setMap] = useState(null);
  const [showHeat, setShowHeat] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showDbscan, setShowDbscan] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

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

    
    const pointsLayer = L.layerGroup();
    hazardPoints.forEach((p) => {
      const ratio = p.report_count / max_count;
      const color =
        ratio >= 0.75
          ? "#d7191c" // red - severe
          : ratio >= 0.5
          ? "#fdae61" // orange - moderate
          : ratio >= 0.25
          ? "#ffff33" // yellow - low
          : "#1a9641"; // green - very low

      L.circleMarker([p.lat, p.lon], {
        radius: 5,
        color,
        weight: 1,
        fillOpacity: 0.85,
      })
        .bindPopup(`Intensity: ${p.report_count}`)
        .addTo(pointsLayer);
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
      pointsLayer.addTo(leafletMap);
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
  }, [showHeat, showPoints, showDbscan, showHotspots]);


  return (
    <div style={{ position: "relative", height: "calc(100vh - 200px)", width: "100%" }}>

      {/* Layer controls - Mobile responsive dropdown */}
      <div
        className="dropdown"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
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
              <span>Hazard Points</span>
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
      ></div>
    </div>
  );
};

export default Map;
