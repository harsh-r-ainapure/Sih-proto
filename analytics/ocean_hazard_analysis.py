import os
import json
import warnings
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, MultiPoint
from sklearn.cluster import DBSCAN
from sklearn.neighbors import KernelDensity
from scipy.spatial.distance import pdist
from libpysal.weights import KNN
from esda.getisord import G_Local
import requests
import time

warnings.filterwarnings("ignore")

# Output directory (relative to repo root)
REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(REPO_DIR, "sihOceanFrontend", "sihOcean", "public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# deterministic RNG
GLOBAL_SEED = 42
RNG = np.random.default_rng(GLOBAL_SEED)


def generate_group(lat, lon, n=None, spread=0.9):
    """Generate n random points around a central coordinate."""
    if n is None:
        local_seed = int((lat + lon) * 100000) ^ GLOBAL_SEED
        local_rng = np.random.default_rng(local_seed)
        n = int(local_rng.integers(10, 21))

    seed = int((lat * 1000 + lon * 1000) % (2**32 - 1)) ^ GLOBAL_SEED
    local_rng = np.random.default_rng(seed)

    # Use normal distribution for more realistic clustering
    lats = lat + local_rng.normal(0, spread / 2, n)
    lons = lon + local_rng.normal(0, spread / 2, n)
    return list(zip(lats, lons))


def adaptive_bandwidth_kde(coords):
    """Calculate adaptive bandwidth for better heatmap based on projected coords."""
    if len(coords) < 2:
        return 20000

    distances = pdist(coords, metric="euclidean")
    std_dist = np.std(distances)
    n = len(coords)
    bandwidth = std_dist * (n ** (-1 / 5))  # Scott's rule adapted
    return max(10000, min(bandwidth, 40000))


def get_elevation_batch(coordinates, batch_size=100):
    """
    Get elevation data for coordinates using Open-Elevation API
    coordinates: list of (lat, lon) tuples
    Returns: list of elevation values in meters
    """
    elevations = []
    
    for i in range(0, len(coordinates), batch_size):
        batch = coordinates[i:i + batch_size]
        
        # Prepare locations for API
        locations = [{"latitude": lat, "longitude": lon} for lat, lon in batch]
        
        try:
            response = requests.post(
                'https://api.open-elevation.com/api/v1/lookup',
                json={'locations': locations},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                batch_elevations = [result['elevation'] for result in data['results']]
                elevations.extend(batch_elevations)
            else:
                print(f"Elevation API error: {response.status_code}")
                # Use simulated elevation data as fallback
                elevations.extend([simulate_elevation(lat, lon) for lat, lon in batch])
                
        except Exception as e:
            print(f"Elevation API request failed: {e}")
            # Use simulated elevation data as fallback
            elevations.extend([simulate_elevation(lat, lon) for lat, lon in batch])
        
        # Rate limiting - be nice to the API
        time.sleep(0.1)
    
    return elevations


def simulate_elevation(lat, lon):
    """
    Simulate elevation data based on coastal proximity and terrain patterns
    This is a fallback when elevation API is not available
    """
    # Create deterministic but realistic elevation patterns
    seed = int((lat * 1000 + lon * 1000) % (2**32 - 1)) ^ GLOBAL_SEED
    local_rng = np.random.default_rng(seed)
    
    # Distance from coast approximation (very rough)
    coastal_distance = abs(lat - 18.5) + abs(lon - 78.0)  # Approximate distance from central coast
    
    # Base elevation increases with distance from coast
    base_elevation = min(coastal_distance * 5, 100)
    
    # Add some terrain variation
    terrain_noise = local_rng.normal(0, 15)
    
    # Some areas are naturally lower (river deltas, coastal plains)
    if coastal_distance < 2:
        base_elevation *= 0.3
    
    elevation = max(0, base_elevation + terrain_noise)
    return elevation


def get_user_location_elevation(lat, lon):
    """
    Get elevation for user's current location
    """
    try:
        elevation = get_elevation_batch([(lat, lon)])[0]
        return elevation
    except Exception as e:
        print(f"Error getting user elevation: {e}")
        return simulate_elevation(lat, lon)


def generate_safe_spots_around_location(center_lat, center_lon, radius_km=10, min_elevation_ft=10, 
                                       user_elevation_m=None, average_tsunami_height_m=25):
    """
    Generate safe spots within radius_km of the given location with elevation > min_elevation_ft
    
    Parameters:
    - center_lat, center_lon: User's current location
    - radius_km: Search radius for safe spots
    - min_elevation_ft: Minimum elevation for safe spots in feet
    - user_elevation_m: User's current elevation in meters (if None, will be fetched)
    - average_tsunami_height_m: Average tsunami wave height in meters (default 25m)
    
    Returns:
    - If user elevation > tsunami level: returns a message indicating safety
    - If user elevation <= tsunami level: returns elevated safe spots
    """
    safe_spots = []
    min_elevation_m = min_elevation_ft * 0.3048  # Convert feet to meters
    
    # Get user's current elevation if not provided
    if user_elevation_m is None:
        print(f"Getting elevation for user location ({center_lat}, {center_lon})...")
        user_elevation_m = get_user_location_elevation(center_lat, center_lon)
    
    print(f"User elevation: {user_elevation_m:.1f}m, High tsunami level: {average_tsunami_height_m}m")
    
    # Check if user is already above tsunami risk level
    if user_elevation_m > average_tsunami_height_m:
        print(f"User is at {user_elevation_m:.1f}m elevation, which is above high tsunami level ({average_tsunami_height_m}m)")
        print("No evacuation needed - you are already at a safe elevation!")
        return [{
            'message': 'safe_elevation',
            'user_elevation_m': user_elevation_m,
            'tsunami_level_m': average_tsunami_height_m,
            'safety_status': 'safe',
            'reason': f'Your current elevation ({user_elevation_m:.1f}m) is above the high tsunami risk level ({average_tsunami_height_m}m)'
        }]
    
    print(f"User is within tsunami risk zone. Finding higher elevation safe spots...")
    
    # Ensure minimum elevation for safe spots is above tsunami level
    required_elevation_m = max(min_elevation_m, average_tsunami_height_m + 5)  # Add 5m safety buffer
    
    # Generate a grid of points within the radius
    # Convert radius to approximate degrees (rough conversion)
    radius_deg = radius_km / 111.32  # 1 degree ≈ 111.32 km
    
    # Create a grid of potential safe spot locations
    grid_resolution = 0.005  # About 500m spacing
    
    seed = int((center_lat * 1000 + center_lon * 1000) % (2**32 - 1)) ^ GLOBAL_SEED
    local_rng = np.random.default_rng(seed)
    
    candidates = []
    
    # Generate candidate points in a circular pattern
    for i in range(200):  # Generate 200 candidate points
        # Random angle and distance within radius
        angle = local_rng.uniform(0, 2 * np.pi)
        # Ensure minimum distance doesn't exceed radius
        min_distance = min(0.5 / 111.32, radius_deg * 0.1)  # 0.5km or 10% of radius, whichever is smaller
        distance = local_rng.uniform(min_distance, radius_deg)
        
        lat = center_lat + distance * np.cos(angle)
        lon = center_lon + distance * np.sin(angle)
        
        # Check if point is within circular radius
        actual_distance = np.sqrt((lat - center_lat)**2 + (lon - center_lon)**2) * 111.32
        if actual_distance <= radius_km:
            candidates.append((lat, lon))
    
    if not candidates:
        return safe_spots
    
    # Get elevation data for all candidates
    print(f"Getting elevation data for {len(candidates)} candidate safe spots...")
    elevations = get_elevation_batch(candidates)
    
    # Filter points with elevation > required_elevation_m
    for (lat, lon), elevation in zip(candidates, elevations):
        if elevation > required_elevation_m:
            # Add some additional attributes
            distance_km = np.sqrt((lat - center_lat)**2 + (lon - center_lon)**2) * 111.32
            elevation_above_tsunami = elevation - average_tsunami_height_m
            safe_spots.append({
                'lat': lat,
                'lon': lon,
                'elevation_m': elevation,
                'elevation_ft': elevation / 0.3048,
                'distance_km': distance_km,
                'elevation_above_tsunami_m': elevation_above_tsunami,
                'safety_score': min(100, elevation_above_tsunami * 5),  # Safety score based on height above tsunami level
                'user_elevation_m': user_elevation_m,
                'tsunami_level_m': average_tsunami_height_m
            })
    
    return safe_spots


def main():
    # Generate coastal hazard data
    coastal_points = [
        (23.5, 68.5), (20.0, 72.8), (13.0, 74.8), (10.0, 76.2), (8.4, 77.0),
        (12.8, 80.3), (15.5, 80.0), (17.7, 83.3), (19.8, 85.8), (21.6, 87.5),
        (22.2, 88.1), (15.0, 73.8), (9.3, 79.0), (16.7, 82.2), (18.5, 84.0),
        (11.0, 75.8), (21.0, 69.1), (20.7, 70.9), (22.0, 72.5), (22.6, 88.3)
    ]

    groups = [generate_group(lat, lon) for lat, lon in coastal_points]

    # Generate hazard points with more realistic distribution
    hazard_points = []
    for gi, grp in enumerate(groups, start=1):
        group_seed = int((gi * 9973) ^ GLOBAL_SEED) & 0xFFFFFFFF
        group_rng = np.random.default_rng(group_seed)

        # Some groups are higher risk than others
        if group_rng.random() < 0.25:  # 25% chance of high-risk group
            base_risk = int(group_rng.integers(12, 25))
        else:
            base_risk = int(group_rng.integers(1, 12))

        for pt in grp:
            variation = int(group_rng.integers(-3, 4))
            rc = max(1, base_risk + variation)
            hazard_points.append((pt[0], pt[1], rc, gi))

    df = pd.DataFrame(hazard_points, columns=["lat", "lon", "report_count", "group_id"]) # this should be implemented into db(lat lon should be fetched,check how many reports are there from nearby coordinates)
    max_count = float(df["report_count"].max())

    # Create geodataframes
    gdf_wgs = gpd.GeoDataFrame(df.copy(), geometry=[Point(xy) for xy in zip(df.lon, df.lat)], crs="EPSG:4326")
    gdf_m = gdf_wgs.to_crs(epsg=3857)
    gdf_m["x"] = gdf_m.geometry.x
    gdf_m["y"] = gdf_m.geometry.y

    # Enhanced KDE for better weights
    coords_m = np.vstack([gdf_m["x"].values, gdf_m["y"].values]).T
    bandwidth = adaptive_bandwidth_kde(coords_m)

    kde = KernelDensity(bandwidth=bandwidth, kernel="gaussian")
    kde.fit(coords_m, sample_weight=df["report_count"].values)
    log_dens = kde.score_samples(coords_m)
    dens = np.exp(log_dens)
    dens_norm = (dens - dens.min()) / (dens.max() - dens.min() + 1e-12)
    gdf_wgs["kde_norm"] = dens_norm

    # Clustering (DBSCAN, in meters space)
    eps_m = 35000.0
    min_samples = 3
    db = DBSCAN(eps=eps_m, min_samples=min_samples, metric="euclidean").fit(coords_m)
    gdf_wgs["cluster"] = db.labels_
    gdf_m["cluster"] = db.labels_

    # Hotspot detection (Getis-Ord Gi*) in meters space
    gdf_for_gi = gdf_m.copy()
    gdf_for_gi["report_count"] = gdf_for_gi["report_count"].astype(np.float64)
    k_neighbors = min(4, len(gdf_for_gi) - 1)
    if k_neighbors > 0:
        try:
            w = KNN.from_dataframe(gdf_for_gi, k=k_neighbors)
            gi = G_Local(gdf_for_gi["report_count"].values, w, permutations=999, n_jobs=1)
            gdf_for_gi["GiZ"] = gi.Zs
            gdf_for_gi["GiP"] = gi.p_sim if hasattr(gi, 'p_sim') else np.full(len(gdf_for_gi), np.nan)
        except Exception:
            gdf_for_gi["GiZ"] = np.zeros(len(gdf_for_gi))
            gdf_for_gi["GiP"] = np.ones(len(gdf_for_gi))
    else:
        gdf_for_gi["GiZ"] = np.zeros(len(gdf_for_gi))
        gdf_for_gi["GiP"] = np.ones(len(gdf_for_gi))

    gdf_wgs["GiZ"] = gdf_for_gi["GiZ"].values
    gdf_wgs["GiP"] = gdf_for_gi["GiP"].values

    # Define hotspots selection similar to original
    hotspots = gdf_wgs[(gdf_wgs["GiZ"] > 1.35) & (gdf_wgs["report_count"] >= 10)].copy()

    # Generate safe spots for different test locations
    # Test 1: True coastal location (should show safe spots if low elevation)
    coastal_location = (19.0760, 72.8777)  # Mumbai (coastal, lower elevation)
    print(f"\n=== Testing coastal location (Mumbai): {coastal_location} ===")
    coastal_safe_spots = generate_safe_spots_around_location(
        coastal_location[0], coastal_location[1], 
        radius_km=10, min_elevation_ft=10, average_tsunami_height_m=600
    )
    
    # Test 2: High elevation location like Pune (should show "safe" message)
    pune_location = (18.5204, 73.8567)  # Pune coordinates
    print(f"\n=== Testing high elevation location (Pune): {pune_location} ===")
    pune_safe_spots = generate_safe_spots_around_location(
        pune_location[0], pune_location[1], 
        radius_km=10, min_elevation_ft=10, average_tsunami_height_m=600
    )
    
    # Use coastal data for actual file generation (to maintain existing functionality)
    # In real usage, this would be based on user's actual location
    safe_spots_data = coastal_safe_spots
    
    # Print summary
    print(f"\n=== Summary ===")
    print(f"Coastal location safe spots: {len(coastal_safe_spots) if isinstance(coastal_safe_spots, list) and not (len(coastal_safe_spots) == 1 and 'message' in coastal_safe_spots[0]) else 'N/A'}")
    print(f"Pune location safe spots: {len(pune_safe_spots) if isinstance(pune_safe_spots, list) and not (len(pune_safe_spots) == 1 and 'message' in pune_safe_spots[0]) else 'Safe elevation - no spots needed'}")

    # 1) Export points with attributes
    points_out = os.path.join(OUTPUT_DIR, "points.geojson")
    gdf_wgs.to_file(points_out, driver="GeoJSON")

    # 2) Export cluster convex hulls
    hull_records = []
    for cid in sorted(gdf_m["cluster"].unique()):
        if cid == -1:
            continue
        cluster_rows = gdf_m[gdf_m["cluster"] == cid]
        total_reports = int(gdf_wgs[gdf_wgs["cluster"] == cid]["report_count"].sum())
        if len(cluster_rows) == 1:
            geom_m = cluster_rows.geometry.iloc[0]
        else:
            geom_m = MultiPoint(list(cluster_rows.geometry)).convex_hull
        geom_wgs = gpd.GeoSeries([geom_m], crs="EPSG:3857").to_crs(epsg=4326).iloc[0]
        hull_records.append({
            "geometry": geom_wgs,
            "cluster": int(cid),
            "size": int(len(cluster_rows)),
            "total_reports": total_reports,
        })

    if hull_records:
        hulls_gdf = gpd.GeoDataFrame(hull_records, crs="EPSG:4326")
    else:
        hulls_gdf = gpd.GeoDataFrame(columns=["geometry", "cluster", "size", "total_reports"], crs="EPSG:4326")
    clusters_out = os.path.join(OUTPUT_DIR, "clusters.geojson")
    hulls_gdf.to_file(clusters_out, driver="GeoJSON")

    # 3) Export hotspot circles (6 km radius) buffered in meters then back to WGS84
    if not hotspots.empty:
        hot_m = hotspots.to_crs(epsg=3857).copy()
        hot_m["geometry"] = hot_m.buffer(6000)
        hot_wgs = hot_m.to_crs(epsg=4326)
        hotspots_out = os.path.join(OUTPUT_DIR, "hotspots.geojson")
        hot_wgs.to_file(hotspots_out, driver="GeoJSON")
    else:
        hotspots_out = os.path.join(OUTPUT_DIR, "hotspots.geojson")
        gpd.GeoDataFrame(columns=gdf_wgs.columns, geometry=[], crs="EPSG:4326").to_file(hotspots_out, driver="GeoJSON")

    # 4) Export safe spots as GeoJSON
    safespots_out = os.path.join(OUTPUT_DIR, "safespots.geojson")
    
    # Check if safe_spots_data contains a safety message instead of actual spots
    if safe_spots_data and len(safe_spots_data) == 1 and 'message' in safe_spots_data[0]:
        # User is at safe elevation - create a special message file
        message_data = safe_spots_data[0]
        safe_message_gdf = gpd.GeoDataFrame(
            [message_data],
            geometry=[Point(0, 0)],  # Dummy geometry
            crs="EPSG:4326"
        )
        safe_message_gdf.to_file(safespots_out, driver="GeoJSON")
    elif safe_spots_data and len(safe_spots_data) > 0:
        # Normal safe spots with actual locations
        safe_spots_gdf = gpd.GeoDataFrame(
            safe_spots_data,
            geometry=[Point(spot['lon'], spot['lat']) for spot in safe_spots_data],
            crs="EPSG:4326"
        )
        safe_spots_gdf.to_file(safespots_out, driver="GeoJSON")
    else:
        # Create empty safe spots file
        empty_safespots = gpd.GeoDataFrame(
            columns=['lat', 'lon', 'elevation_m', 'elevation_ft', 'distance_km', 'safety_score', 'geometry'],
            crs="EPSG:4326"
        )
        empty_safespots.to_file(safespots_out, driver="GeoJSON")

    # Calculate safe spots count for manifest
    safespots_count = 0
    is_safe_elevation = False
    if safe_spots_data and len(safe_spots_data) == 1 and 'message' in safe_spots_data[0]:
        is_safe_elevation = True
        safespots_count = 0
    else:
        safespots_count = len(safe_spots_data) if safe_spots_data else 0

    # Emit a small manifest JSON
    manifest = {
        "points": os.path.relpath(points_out, REPO_DIR).replace("\\", "/"),
        "clusters": os.path.relpath(clusters_out, REPO_DIR).replace("\\", "/"),
        "hotspots": os.path.relpath(hotspots_out, REPO_DIR).replace("\\", "/"),
        "safespots": os.path.relpath(safespots_out, REPO_DIR).replace("\\", "/"),
        "stats": {
            "num_points": int(len(gdf_wgs)),
            "num_clusters": int(len([c for c in gdf_wgs['cluster'].unique() if c != -1])),
            "num_hotspots": int(len(hotspots)),
            "num_safespots": safespots_count,
            "is_safe_elevation": is_safe_elevation,
            "avg_reports": float(gdf_wgs['report_count'].mean()),
        },
    }
    with open(os.path.join(OUTPUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("Ocean Hazard Analytics: GeoJSON export complete")
    if is_safe_elevation:
        print("Safe elevation detected - no evacuation spots needed")
    else:
        print(f"Generated {safespots_count} safe spots around default location")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()