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

    df = pd.DataFrame(hazard_points, columns=["lat", "lon", "report_count", "group_id"])
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
    k_neighbors = min(6, len(gdf_for_gi) - 1)
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
    hotspots = gdf_wgs[(gdf_wgs["GiZ"] > 1.5) & (gdf_wgs["report_count"] >= 6)].copy()

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

    # Emit a small manifest JSON
    manifest = {
        "points": os.path.relpath(points_out, REPO_DIR).replace("\\", "/"),
        "clusters": os.path.relpath(clusters_out, REPO_DIR).replace("\\", "/"),
        "hotspots": os.path.relpath(hotspots_out, REPO_DIR).replace("\\", "/"),
        "stats": {
            "num_points": int(len(gdf_wgs)),
            "num_clusters": int(len([c for c in gdf_wgs['cluster'].unique() if c != -1])),
            "num_hotspots": int(len(hotspots)),
            "avg_reports": float(gdf_wgs['report_count'].mean()),
        },
    }
    with open(os.path.join(OUTPUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("Ocean Hazard Analytics: GeoJSON export complete")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()


