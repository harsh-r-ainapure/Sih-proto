# Ocean Hazard Analytics (Python)

This directory contains a standalone Python pipeline that generates GeoJSON layers for the frontend map.

Outputs are written to:
- `sihOceanFrontend/sihOcean/public/data/points.geojson`
- `sihOceanFrontend/sihOcean/public/data/clusters.geojson`
- `sihOceanFrontend/sihOcean/public/data/hotspots.geojson`
- `sihOceanFrontend/sihOcean/public/data/manifest.json`

## Setup

1) Create a virtual environment and install requirements:
```bash
python -m venv .venv
. .venv/bin/activate   # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2) Run the exporter:
```bash
python ocean_hazard_analysis.py
```

After it runs, start the frontend; Leaflet can load these GeoJSON files from `public/data`.

## Notes
- DBSCAN uses eps=35 km and min_samples=3 in projected meters.
- Hotspots use Gi* Z-scores; output is a 6 km buffered polygon around hotspot points.
- The generator is deterministic (seed 42) for consistent demo data.

