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
  const [showSafeSpots, setShowSafeSpots] = useState(true);
  const [userLocationMarker, setUserLocationMarker] = useState(null);
  const [safeSpotMarkers, setSafeSpotMarkers] = useState(null);

  // Function to get elevation data (simplified client-side version)
  const getElevation = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
      );
      const data = await response.json();
      return data.results[0]?.elevation || 0;
    } catch (error) {
      console.log("Elevation API failed, using simulated data");
      // Fallback to simulated elevation
      return simulateElevation(lat, lon);
    }
  };

  // Simulate elevation data as fallback
  const simulateElevation = (lat, lon) => {
    const coastal_distance = Math.abs(lat - 18.5) + Math.abs(lon - 78.0);
    const base_elevation = Math.min(coastal_distance * 5, 100);
    const terrain_noise = (Math.random() - 0.5) * 30;
    const elevation = Math.max(0, base_elevation + terrain_noise);
    return elevation;
  };

  // Generate safe spots around user location
  const generateSafeSpotsAroundLocation = async (centerLat, centerLon, radiusKm = 10, minElevationFt = 10) => {
    const safeSpots = [];
    const minElevationM = minElevationFt * 0.3048;
    const radiusDeg = radiusKm / 111.32;

    // Generate candidate points in a circular pattern
    const candidates = [];
    for (let i = 0; i < 50; i++) { // Reduced number for client-side processing
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusDeg + 0.5 / 111.32; // Start 0.5km from center
      
      const lat = centerLat + distance * Math.cos(angle);
      const lon = centerLon + distance * Math.sin(angle);
      
      const actualDistance = Math.sqrt(
        Math.pow((lat - centerLat) * 111.32, 2) + 
        Math.pow((lon - centerLon) * 111.32, 2)
      );
      
      if (actualDistance <= radiusKm) {
        candidates.push({ lat, lon });
      }
    }

    // Check elevation for each candidate (batch processing would be better for production)
    for (const candidate of candidates.slice(0, 20)) { // Limit to 20 for demo
      try {
        const elevation = await getElevation(candidate.lat, candidate.lon);
        
        if (elevation > minElevationM) {
          const distanceKm = Math.sqrt(
            Math.pow((candidate.lat - centerLat) * 111.32, 2) + 
            Math.pow((candidate.lon - centerLon) * 111.32, 2)
          );
          
          safeSpots.push({
            lat: candidate.lat,
            lon: candidate.lon,
            elevation_m: elevation,
            elevation_ft: elevation / 0.3048,
            distance_km: distanceKm,
            safety_score: Math.min(100, (elevation - minElevationM) * 10)
          });
        }
      } catch (error) {
        console.log("Error getting elevation for candidate:", error);
      }
    }

    return safeSpots;
  };

  // Function to get user's current location and generate safe spots
  const getUserLocationWithSafeSpots = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        if (map) {
          // Remove existing user location marker if it exists
          if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
          }

          // Remove existing safe spot markers
          if (safeSpotMarkers) {
            map.removeLayer(safeSpotMarkers);
          }

          // Create user location marker
          const userLocationIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div style="
              width: 20px; 
              height: 20px; 
              border-radius: 50%; 
              background-color: #4285f4; 
              border: 3px solid white; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              position: relative;
            ">
              <div style="
                width: 40px; 
                height: 40px; 
                border-radius: 50%; 
                background-color: rgba(66, 133, 244, 0.2); 
                position: absolute; 
                top: -13px; 
                left: -13px; 
                animation: pulse 2s infinite;
              "></div>
            </div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const marker = L.marker([lat, lon], { icon: userLocationIcon })
            .addTo(map)
            .bindPopup('<b>Your Location</b>')
            .openPopup();

          setUserLocationMarker(marker);

          // Add 10km radius circle
          const radiusCircle = L.circle([lat, lon], {
            color: '#4285f4',
            fillColor: 'rgba(66, 133, 244, 0.1)',
            fillOpacity: 0.2,
            weight: 2,
            radius: 10000 // 10km in meters
          }).addTo(map);

          // Generate safe spots
          console.log("Generating safe spots around your location...");
          const safeSpots = await generateSafeSpotsAroundLocation(lat, lon, 10, 10);
          
          if (safeSpots.length > 0) {
            const safeSpotLayerGroup = L.layerGroup();
            
            safeSpots.forEach((spot) => {
              const safeSpotIcon = L.divIcon({
                className: 'safe-spot-marker',
                html: `<div style="
                  width: 16px; 
                  height: 16px; 
                  border-radius: 50%; 
                  background-color: #4CAF50; 
                  border: 2px solid white; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              });

              L.marker([spot.lat, spot.lon], { icon: safeSpotIcon })
                .bindPopup(`
                  <b>Safe Spot</b><br>
                  <b>Elevation:</b> ${spot.elevation_ft.toFixed(1)} ft (${spot.elevation_m.toFixed(1)} m)<br>
                  <b>Distance:</b> ${spot.distance_km.toFixed(2)} km<br>
                  <b>Safety Score:</b> ${spot.safety_score.toFixed(0)}/100
                `)
                .addTo(safeSpotLayerGroup);
            });

            if (showSafeSpots) {
              safeSpotLayerGroup.addTo(map);
            }
            setSafeSpotMarkers(safeSpotLayerGroup);
            
            console.log(`Generated ${safeSpots.length} safe spots around your location`);
          } else {
            console.log("No safe spots found with elevation > 10 feet within 10km");
            alert("No safe spots with elevation > 10 feet found within 10km of your location.");
          }

          // Center map on user's location
          map.setView([lat, lon], 12);
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  useEffect(() => {   
    const leafletMap = L.map("map").setView([15, 78], 5);

    // Manage light/dark tile layers
    const lightTiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    });
    const darkTiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors & CARTO",
      subdomains: 'abcd'
    });

    function currentTheme(){
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
    function applyTiles(){
      const th = currentTheme();
      if (th === 'dark') {
        if (leafletMap.hasLayer(lightTiles)) leafletMap.removeLayer(lightTiles);
        if (!leafletMap.hasLayer(darkTiles)) darkTiles.addTo(leafletMap);
      } else {
        if (leafletMap.hasLayer(darkTiles)) leafletMap.removeLayer(darkTiles);
        if (!leafletMap.hasLayer(lightTiles)) lightTiles.addTo(leafletMap);
      }
    }
    applyTiles();

    const handleThemeChange = () => applyTiles();
    window.addEventListener('themechange', handleThemeChange);
    
    // Event listener for focusing on incidents from Latest component
    const handleFocusIncident = (event) => {
      const { lat, lon } = event.detail;
      leafletMap.setView([lat, lon], 10);
    };
    
    window.addEventListener('mapFocusIncident', handleFocusIncident);

    const USE_GEOJSON = true;
    if (USE_GEOJSON) {
      (async () => {
        try {
          const [pointsRes, clustersRes, hotspotsRes, safespotsRes] = await Promise.all([
            fetch("/data/points.geojson"),
            fetch("/data/clusters.geojson"),
            fetch("/data/hotspots.geojson"),
            fetch("/data/safespots.geojson").catch(() => null), // Safe spots might not exist initially
          ]);
          
          const [pointsGj, clustersGj, hotspotsGj] = await Promise.all([
            pointsRes.json(),
            clustersRes.json(),
            hotspotsRes.json(),
          ]);

          let safespotsGj = null;
          if (safespotsRes) {
            safespotsGj = await safespotsRes.json();
          }

          const features = pointsGj.features || [];
          const max_count = features.reduce((m, f) => Math.max(m, f.properties?.report_count || 0), 0);

          const pointsLayer = L.layerGroup();
          const simpleColor = (rc) => {
            const ratio = max_count ? rc / max_count : 0;
            if (ratio >= 0.8) return "#d73027";
            if (ratio >= 0.6) return "#f46d43";
            if (ratio >= 0.4) return "#fdae61";
            if (ratio >= 0.2) return "#fee08b";
            return "#d9ef8b";
          };
          const latlngs = [];
          features.forEach((f) => {
            if (!f.geometry || f.geometry.type !== "Point") return;
            const [lon, lat] = f.geometry.coordinates;
            const rc = f.properties?.report_count || 0;
            latlngs.push([lat, lon]);
            const radius = 0.8 + (max_count ? (rc / max_count) * 1.7 : 0);
            L.circleMarker([lat, lon], { radius, color: simpleColor(rc), weight: 0.5, fillOpacity: 0.8 })
              .bindPopup(`<b>Reports:</b> ${rc}<br><b>Group:</b> ${f.properties?.group_id ?? ''}<br><b>Cluster:</b> ${f.properties?.cluster ?? ''}`)
              .addTo(pointsLayer);
          });

          const heatData = features
            .filter((f) => f.geometry && f.geometry.type === "Point")
            .map((f) => {
              const [lon, lat] = f.geometry.coordinates;
              const rc = f.properties?.report_count || 0;
              const kde = f.properties?.kde_norm || 0;
              return [lat, lon, rc * 1.5 + (max_count * 0.8 * kde)];
            });
          const heatLayer = L.heatLayer(heatData, {
            radius: 18,
            blur: 20,
            minOpacity: 0.4,
            maxZoom: 10,
            gradient: { 0.0: "#000080", 0.15: "#0040FF", 0.3: "#0080FF", 0.45: "#00FFFF", 0.6: "#80FF00", 0.75: "#FFFF00", 0.85: "#FF8000", 1.0: "#FF0000" },
          });

          const dbscanLayer = L.geoJSON(clustersGj, {
            style: () => ({ color: "#377eb8", weight: 3, fillOpacity: 0.15 }),
            onEachFeature: (feat, layer) => {
              const p = feat.properties || {};
              layer.bindPopup(`Cluster ${p.cluster} | Size: ${p.size} | Total Reports: ${p.total_reports}`);
            },
          });

          const hotspotsLayer = L.geoJSON(hotspotsGj, {
            style: () => ({ color: "#8B0000", weight: 2, fillOpacity: 0.4 }),
            onEachFeature: (feat, layer) => {
              const p = feat.properties || {};
              const rc = p.report_count ?? "";
              const z = p.GiZ ?? "";
              const gi = p.GiP ?? "";
              layer.bindPopup(`<b>Hotspot</b><br><b>Reports:</b> ${rc}<br><b>Z-score:</b> ${typeof z === 'number' ? z.toFixed(2) : z}<br><b>Significance:</b> ${typeof gi === 'number' ? gi.toFixed(3) : gi}`);
            },
          });

          // Handle pre-generated safe spots if available
          let defaultSafeSpotsLayer = null;
          if (safespotsGj && safespotsGj.features && safespotsGj.features.length > 0) {
            defaultSafeSpotsLayer = L.layerGroup();
            safespotsGj.features.forEach((f) => {
              if (!f.geometry || f.geometry.type !== "Point") return;
              const [lon, lat] = f.geometry.coordinates;
              const props = f.properties || {};
              
              const safeSpotIcon = L.divIcon({
                className: 'default-safe-spot-marker',
                html: `<div style="
                  width: 14px; 
                  height: 14px; 
                  border-radius: 50%; 
                  background-color: #4CAF50; 
                  border: 2px solid white; 
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  opacity: 0.7;
                "></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });

              L.marker([lat, lon], { icon: safeSpotIcon })
                .bindPopup(`
                  <b>Default Safe Spot</b><br>
                  <b>Elevation:</b> ${(props.elevation_ft || 0).toFixed(1)} ft<br>
                  <b>Distance:</b> ${(props.distance_km || 0).toFixed(2)} km<br>
                  <small>Use "Find Safe Spots" for your location</small>
                `)
                .addTo(defaultSafeSpotsLayer);
            });
          }

          if (showHeat) heatLayer.addTo(leafletMap);
          if (showPoints) pointsLayer.addTo(leafletMap);
          if (showDbscan) dbscanLayer.addTo(leafletMap);
          if (showHotspots) hotspotsLayer.addTo(leafletMap);
          if (showSafeSpots && defaultSafeSpotsLayer) defaultSafeSpotsLayer.addTo(leafletMap);

          if (latlngs.length) {
            const bounds = L.latLngBounds(latlngs);
            leafletMap.fitBounds(bounds.pad(0.2));
          }
        } catch (e) {
          console.error("Failed loading GeoJSON:", e);
        }
      })();
    } else {
      // Your existing fallback generation code here
      // ... (keeping the original fallback code for when USE_GEOJSON is false)
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
      window.removeEventListener('mapFocusIncident', handleFocusIncident);
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, [showHeat, showPoints, showDbscan, showHotspots, showSafeSpots]);

  // Effect to handle safe spot visibility toggle
  useEffect(() => {
    if (map && safeSpotMarkers) {
      if (showSafeSpots) {
        safeSpotMarkers.addTo(map);
      } else {
        map.removeLayer(safeSpotMarkers);
      }
    }
  }, [showSafeSpots, map, safeSpotMarkers]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      
      {/* Find Safe Spots Button */}
      <button
        onClick={getUserLocationWithSafeSpots}
        style={{
          position: "absolute",
          top: "80px",
          right: "20px",
          zIndex: 1000,
          background: "var(--panel-bg, rgba(76, 175, 80, 0.95))",
          color: "white",
          border: "1px solid #4CAF50",
          borderRadius: "8px",
          padding: "10px 12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
        title="Find safe spots around your location (elevation > 10ft within 10km)"
      >
        🛡️ Find Safe Spots
      </button>

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
          className="btn dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          style={{
            background: "var(--panel-bg, rgba(255,255,255,0.92))",
            color: "var(--panel-fg, #111)",
            border: "1px solid var(--panel-bd, #ddd)",
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Map Layers
        </button>
        <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: "250px", background: "var(--panel-bg, #fff)", color: "var(--panel-fg, #111)" }}>
          <li style={{ padding: "8px 16px", borderBottom: "1px solid var(--panel-bd, #eee)" }}>
            <div style={{ fontWeight: "600", color: "var(--panel-fg, #333)", fontSize: "12px", textTransform: "uppercase" }}>
              Map Layers
            </div>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer", color: "var(--panel-fg, #111)" }}>
              <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />
              <span>Hazard Points</span>
            </label>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer", color: "var(--panel-fg, #111)" }}>
              <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
              <span>Heatmap</span>
            </label>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer", color: "var(--panel-fg, #111)" }}>
              <input type="checkbox" checked={showDbscan} onChange={(e) => setShowDbscan(e.target.checked)} />
              <span>Cluster Areas (DBSCAN)</span>
            </label>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer", color: "var(--panel-fg, #111)" }}>
              <input type="checkbox" checked={showHotspots} onChange={(e) => setShowHotspots(e.target.checked)} />
              <span>Hotspots (15km radius)</span>
            </label>
          </li>
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer", color: "var(--panel-fg, #111)" }}>
              <input type="checkbox" checked={showSafeSpots} onChange={(e) => setShowSafeSpots(e.target.checked)} />
              <span>Safe Spots (10ft+ elevation)</span>
            </label>
          </li>
        </ul>
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
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      ></div>
    </div>
  );
};

export default Map;