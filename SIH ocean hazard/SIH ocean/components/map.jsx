import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const Map = () => {
  const [map, setMap] = useState(null);
  const [query, setQuery] = useState("");
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
    clusterIds.forEach((cid, idx) => {
      const p = hazardPoints[idx];
      const color = cid >= 0 ? palette[cid % palette.length] : "#777";
      L.circleMarker([p.lat, p.lon], { radius: 6, color, weight: 2, fillOpacity: 0.7 })
        .bindPopup(cid >= 0 ? `Cluster #${cid}` : "Noise")
        .addTo(dbscanLayer);
    });

    // Hotspots (Gi*-like approximation using neighborhood counts and z-scores)
    function neighborCounts(points, radiusKm) {
      const counts = new Array(points.length).fill(0);
      for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points.length; j++) {
          if (haversineKm(points[i], points[j]) <= radiusKm) counts[i]++;
        }
      }
      return counts;
    }
    const counts = neighborCounts(hazardPoints, 80);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length;
    const std = Math.sqrt(variance) || 1;
    const zscores = counts.map((c) => (c - mean) / std);
    const hotspotsLayer = L.layerGroup();
    zscores.forEach((z, idx) => {
      const p = hazardPoints[idx];
      let color = "#1a9641";
      if (z >= 2.0) color = "#d7191c";
      else if (z >= 1.3) color = "#fdae61";
      else if (z >= 0.5) color = "#ffff33";
      L.circle([p.lat, p.lon], { radius: 12000 + Math.max(0, z) * 6000, color, weight: 2, fillOpacity: 0.15 })
        .bindPopup(`Gi* z-score: ${z.toFixed(2)}`)
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

    return () => {
      leafletMap.remove();
    };
  }, [showHeat, showPoints, showDbscan, showHotspots]);

  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || !map) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            "User-Agent": "SIH-Ocean-Hazard/1.0 (your@email.com)",
            "Accept-Language": "en",
          },
        }
      );

      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        map.setView([latNum, lonNum], 14);
        L.marker([latNum, lonNum])
          .addTo(map)
          .bindPopup(`<b>${display_name}</b>`)
          .openPopup();
      } else {
        alert("No results found.");
      }
    } catch (err) {
      console.error("Error fetching location:", err);
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {/* Floating controls */}
      <form
        onSubmit={handleSearch}
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.85)",
          padding: "8px 12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          zIndex: 1000,
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a place"
          style={{
            padding: "6px",
            width: "250px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "6px 12px",
            cursor: "pointer",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Search
        </button>
        {/* Simple quick toggle */}
        <button type="button" onClick={() => setShowHeat((v) => !v)} style={{ padding: "6px 12px", cursor: "pointer" }}>
          {showHeat ? "Hide Heatmap" : "Show Heatmap"}
        </button>
      </form>

      {/* Right-side layer checkboxes */}
      <div
        style={{
          position: "absolute",
          top: "90px",
          right: "20px",
          background: "rgba(255,255,255,0.9)",
          padding: "10px 12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          minWidth: "220px",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "6px" }}>openstreetmap</div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />
          Hazard Points
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
          Heatmap
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <input type="checkbox" checked={showDbscan} onChange={(e) => setShowDbscan(e.target.checked)} />
          DBSCAN Clusters
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 0 }}>
          <input type="checkbox" checked={showHotspots} onChange={(e) => setShowHotspots(e.target.checked)} />
          Hotspots (Gi*)
        </label>
      </div>

      {/* Fullscreen map */}
      <div
        id="map"
        style={{
          height: "100%",
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
