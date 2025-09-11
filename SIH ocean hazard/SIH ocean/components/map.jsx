import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const Map = () => {
  const [map, setMap] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    
    const leafletMap = L.map("map").setView([15, 78], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(leafletMap);

    
    const n_points = 300;
    const lat_min = 8, lat_max = 22;
    const lon_min = 68, lon_max = 90;
    const hazardPoints = Array.from({ length: n_points }, () => {
      const lat = lat_min + Math.random() * (lat_max - lat_min);
      const lon = lon_min + Math.random() * (lon_max - lon_min);
      const report_count = Math.floor(Math.random() * 9) + 1; // 1–9
      return { lat, lon, report_count };
    });

    const max_count = Math.max(...hazardPoints.map((p) => p.report_count));

    
    const pointsLayer = L.layerGroup();
    hazardPoints.forEach((p) => {
      const color =
        p.report_count > 0.66 * max_count
          ? "red"
          : p.report_count > 0.33 * max_count
          ? "orange"
          : "green";

      L.circleMarker([p.lat, p.lon], {
        radius: 4,
        color,
        fillOpacity: 0.7,
      })
        .bindPopup(`Reports: ${p.report_count}`)
        .addTo(pointsLayer);
    });
    pointsLayer.addTo(leafletMap);

    
    const heatData = hazardPoints.map((p) => [p.lat, p.lon, p.report_count]);
    const heatLayer = L.heatLayer(heatData, {
      radius: 12,
      blur: 20,
      minOpacity: 0.25,
      maxZoom: 18,
    });
    heatLayer.addTo(leafletMap);

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
    };
  }, []);

  
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
      {/* Floating search bar */}
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
      </form>

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
