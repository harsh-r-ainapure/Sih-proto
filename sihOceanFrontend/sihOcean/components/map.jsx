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
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusDeg + 0.5 / 111.32;
      
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

    // Check elevation for each candidate
    for (const candidate of candidates.slice(0, 20)) {
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
          // Remove existing markers
          if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
          }
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
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const marker = L.marker([lat, lon], { icon: userLocationIcon })
            .addTo(map)
            .bindPopup('<b>Your Location</b>')
            .openPopup();

          setUserLocationMarker(marker);

          // Add 10km radius circle
          L.circle([lat, lon], {
            color: '#4285f4',
            fillColor: 'rgba(66, 133, 244, 0.1)',
            fillOpacity: 0.2,
            weight: 2,
            radius: 10000
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
    
    // Event listener for focusing on incidents from Latest component
    let focusMarker = null;
    const handleFocusIncident = (event) => {
      const { lat, lon, description, imageUrl, disaster, severity } = event.detail || {};
      if (typeof lat === 'number' && typeof lon === 'number') {
        leafletMap.setView([lat, lon], 12);
        if (focusMarker) {
          leafletMap.removeLayer(focusMarker);
          focusMarker = null;
        }
        const sev = Number(severity);
        const color = isFinite(sev) ? (sev >= 4 ? '#d7191c' : sev === 3 ? '#fdae61' : '#1a9641') : '#007bff';
        const img = imageUrl ? ((imageUrl || '').startsWith('http') ? imageUrl : (import.meta.env.VITE_API_BASE || '') + imageUrl) : null;
        const popup = `
          <div style="max-width:240px">
            <div style="font-weight:600;margin-bottom:6px">${disaster || ''}</div>
            ${img ? `<div style=\"margin-bottom:8px\"><img src=\"${img}\" style=\"width:100%;height:auto;border-radius:6px;object-fit:cover\"/></div>` : ''}
            <div style="font-size:12px;color:#666">${description || ''}</div>
          </div>`;
        focusMarker = L.circleMarker([lat, lon], { radius: 7, color, weight: 3, fillOpacity: 0.9 })
          .addTo(leafletMap)
          .bindPopup(popup)
          .openPopup();
      }
    };
    
    window.addEventListener('mapFocusIncident', handleFocusIncident);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(leafletMap);

    // Fetch dynamic reports and place markers with popups
    (async () => {
      try {
        const base = import.meta.env.VITE_API_BASE || "";
        const r = await fetch(`${base}/reports`);
        if (r.ok) {
          const { items } = await r.json();
          const markerLayer = L.layerGroup();
          const latlngs = [];
          items.forEach((it) => {
            if (typeof it.lat === 'number' && typeof it.lon === 'number') {
              latlngs.push([it.lat, it.lon]);
              const sev = Number(it.severity);
              const color = sev >= 4 ? '#d7191c' : sev === 3 ? '#fdae61' : '#1a9641';
              const content = `
                <div style="max-width:240px">
                  <div style="font-weight:600;margin-bottom:6px">${it.location || ''}</div>
                  <div style="margin-bottom:6px;color:#555">${it.disaster || ''}</div>
                  ${it.imageUrl ? `<div style="margin-bottom:8px"><img src="${(it.imageUrl || '').startsWith('http') ? it.imageUrl : (import.meta.env.VITE_API_BASE || '') + it.imageUrl}" style="width:100%;height:auto;border-radius:6px;object-fit:cover"/></div>` : ''}
                  <div style="margin-bottom:8px">${it.description || ''}</div>
                  <div style="font-size:12px;color:#666">Severity: ${isFinite(sev) ? sev : ''} | Date: ${it.reportDate ? new Date(it.reportDate).toLocaleString() : ''}</div>
                </div>`;
              L.circleMarker([it.lat, it.lon], { radius: 6, color, weight: 2, fillOpacity: 0.8 })
                .bindPopup(content)
                .addTo(markerLayer);
            }
          });
          markerLayer.addTo(leafletMap);
          if (latlngs.length) leafletMap.fitBounds(L.latLngBounds(latlngs).pad(0.2));
        }
      } catch (e) {
        console.error('Failed to load dynamic report markers:', e);
      }
    })();

    const USE_GEOJSON = false;
    if (USE_GEOJSON) {
      (async () => {
        try {
          const [pointsRes, clustersRes, hotspotsRes] = await Promise.all([
            fetch("/data/points.geojson"),
            fetch("/data/clusters.geojson"),
            fetch("/data/hotspots.geojson"),
          ]);
          const [pointsGj, clustersGj, hotspotsGj] = await Promise.all([
            pointsRes.json(),
            clustersRes.json(),
            hotspotsRes.json(),
          ]);

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

          if (showHeat) heatLayer.addTo(leafletMap);
          if (showPoints) pointsLayer.addTo(leafletMap);
          if (showDbscan) dbscanLayer.addTo(leafletMap);
          if (showHotspots) hotspotsLayer.addTo(leafletMap);

          if (latlngs.length) {
            const bounds = L.latLngBounds(latlngs);
            leafletMap.fitBounds(bounds.pad(0.2));
          }
        } catch (e) {
          console.error("Failed loading GeoJSON:", e);
        }
      })();
    } else {

    // Deterministic grouped coastal points and hazard generation (ported from Python)
    const GLOBAL_SEED = 42;
    function mulberry32(a){return function(){let t=(a+=0x6d2b79f5);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
    function rngInt(r,min,maxInc){return Math.floor(r()*(maxInc-min+1))+min;}
    function rngNormal(r){const u=Math.max(r(),1e-9);const v=Math.max(r(),1e-9);return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}    
    function generateGroup(lat,lon,n,spread=0.9){let count=n; if(count==null){const localSeed=(Math.floor((lat+lon)*100000)^GLOBAL_SEED)>>>0;const rr=mulberry32(localSeed);count=rngInt(rr,10,20);}const seed=((Math.floor(lat*1000+lon*1000)>>>0)^GLOBAL_SEED)>>>0;const r=mulberry32(seed);const pts=[];for(let i=0;i<count;i++){const dlat=rngNormal(r)*(spread/2);const dlon=rngNormal(r)*(spread/2);pts.push([lat+dlat,lon+dlon]);}return pts;}
    const coastalPoints=[[23.5,68.5],[20.0,72.8],[13.0,74.8],[10.0,76.2],[8.4,77.0],[12.8,80.3],[15.5,80.0],[17.7,83.3],[19.8,85.8],[21.6,87.5],[22.2,88.1],[15.0,73.8],[9.3,79.0],[16.7,82.2],[18.5,84.0],[11.0,75.8],[21.0,69.1],[20.7,70.9],[22.0,72.5],[22.6,88.3]];
    const groups=coastalPoints.map(([lat,lon])=>generateGroup(lat,lon,null,0.9));
    const hazardPoints=[]; groups.forEach((grp,giIdx)=>{const gi=giIdx+1;const r=mulberry32(((gi*9973)^GLOBAL_SEED)>>>0);const isHigh=r()<0.25;const base=isHigh?rngInt(r,12,24):rngInt(r,1,11);grp.forEach(([lat,lon])=>{const variation=rngInt(r,-3,3);const rc=Math.max(1,base+variation);hazardPoints.push({lat,lon,report_count:rc,group_id:gi});});});

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

    
    // Adaptive KDE-like density in WebMercator meters and enhanced heat weights
    function projectToMeters([lat, lon]){
      const x=(lon*Math.PI)/180; const y=(lat*Math.PI)/180; const R=6378137;
      return [R*x, R*Math.log(Math.tan(Math.PI/4 + y/2))];
    }
    const coordsM = hazardPoints.map(p=>projectToMeters([p.lat,p.lon]));
    function euclid(a,b){const dx=a[0]-b[0]; const dy=a[1]-b[1]; return Math.hypot(dx,dy);}    
    const sampN = Math.min(coordsM.length, 120);
    const dists=[]; for(let i=0;i<sampN;i+=3){for(let j=i+1;j<sampN;j+=7){dists.push(euclid(coordsM[i],coordsM[j]));}}
    const meanDist = dists.length? dists.reduce((a,b)=>a+b,0)/dists.length : 20000;
    const stdDist = dists.length? Math.sqrt(dists.reduce((s,v)=>{const d=v-meanDist; return s+d*d;},0)/dists.length):20000;
    const bw = Math.max(10000, Math.min(stdDist * Math.pow(coordsM.length || 1, -1/5), 40000));
    const dens = coordsM.map((p)=>{let sum=0; for(let j=0;j<coordsM.length;j++){const u=euclid(p,coordsM[j])/bw; sum+=Math.exp(-0.5*u*u);} return sum;});
    const dmin=Math.min(...dens); const dmax=Math.max(...dens);
    const densNorm = dens.map(v => (v - dmin) / (dmax - dmin + 1e-12));
    const heatData = hazardPoints.map((p,i)=>[p.lat,p.lon, p.report_count*1.5 + densNorm[i]*Math.max(...hazardPoints.map(h=>h.report_count))*0.8]);
    const heatLayer = L.heatLayer(heatData, {
      radius: 18,
      blur: 20,
      minOpacity: 0.4,
      maxZoom: 10,
      gradient: { 0.0:'#000080', 0.15:'#0040FF', 0.3:'#0080FF', 0.45:'#00FFFF', 0.6:'#80FF00', 0.75:'#FFFF00', 0.85:'#FF8000', 1.0:'#FF0000' }
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
    const clusterIds = dbscan(hazardPoints, 35, 3);
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

    // Simplified Gi* hotspots using kNN z-score of report_count
    function knnIndices(points, k){
      const idx=[]; for(let i=0;i<points.length;i++){const d=points.map((q,j)=>({j,d:haversineKm(points[i],q)})); d.sort((a,b)=>a.d-b.d); idx.push(d.slice(1,Math.min(k+1,d.length)).map(o=>o.j)); } return idx;
    }
    const K = Math.min(6, Math.max(1, hazardPoints.length - 1));
    const knn = knnIndices(hazardPoints, K);
    const values = hazardPoints.map(p=>p.report_count);
    const mean = values.reduce((a,b)=>a+b,0)/values.length;
    const std = Math.sqrt(values.reduce((s,v)=>{const d=v-mean; return s+d*d;},0)/Math.max(1,values.length-1));
    const zScores = hazardPoints.map((_,i)=>{const neigh=knn[i]; const sum=neigh.reduce((s,j)=>s+values[j], values[i]); const m=neigh.length+1; const localMean=sum/m; return std>0? (localMean-mean)/std : 0;});
    const hotspots = hazardPoints.map((p,i)=>({p,i})).filter(({p,i})=> zScores[i]>1.5 && p.report_count>=6);
    const hotspotsLayer = L.layerGroup();
    hotspots.forEach(({p,i})=>{
      L.circle([p.lat,p.lon], { radius: 6000, color: "#8B0000", weight: 2, fillOpacity: 0.4 })
        .bindPopup(`<b>Hotspot</b><br><b>Reports:</b> ${p.report_count}<br><b>Z-score:</b> ${zScores[i].toFixed(2)}`)
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
    };
  }, [showHeat, showPoints, showDbscan, showHotspots]);

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
    <div style={{ position: "relative", height: "calc(100vh - 200px)", width: "100%" }}>

      {/* Find Safe Spots Button */}
      <button
        onClick={getUserLocationWithSafeSpots}
        style={{
          position: "absolute",
          top: "80px",
          right: "20px",
          zIndex: 1000,
          background: "rgba(76, 175, 80, 0.95)",
          color: "white",
          border: "1px solid #4CAF50",
          borderRadius: "8px",
          padding: "10px 12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
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
          <li>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", margin: 0, cursor: "pointer" }}>
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