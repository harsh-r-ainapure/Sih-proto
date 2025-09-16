---
description: Repository Information Overview
alwaysApply: true
---

# Sih-proto Information

## Summary
Sih-proto is a full-stack application focused on ocean hazard analysis and visualization. It consists of a React frontend, Express.js backend, and Python analytics component for processing and analyzing ocean hazard data.

## Structure
- **sihOceanBackend**: Express.js backend server
- **sihOceanFrontend/sihOcean**: React frontend application
- **analytics**: Python-based data analysis scripts
- **.env.example**: Template for environment variables

## Projects

### Backend (sihOceanBackend)
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: ES Modules (type: "module")
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- express (^5.1.0): Web framework
- @supabase/supabase-js (^2.57.4): Supabase client
- cors (^2.8.5): CORS middleware
- dotenv (^17.2.2): Environment variable management
- multer (^2.0.2): File upload handling
- pg (^8.16.3): PostgreSQL client

**Development Dependencies**:
- nodemon (^3.1.10): Development server with auto-reload

#### Build & Installation
```bash
npm install
npm run dev  # Development with auto-reload
npm start    # Production
```

#### Main Files
**Entry Point**: app.js
**Controllers**: contollers/hostcontroller.js
**Data Storage**: uploads/ directory for file uploads

### Frontend (sihOceanFrontend/sihOcean)
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript (React)
**Version**: React 19
**Build System**: Vite 7
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react (^19.1.1): UI library
- react-dom (^19.1.1): DOM bindings for React
- leaflet (^1.9.4): Interactive maps
- leaflet.heat (^0.2.0): Heatmap visualization
- bootstrap (^5.3.8): CSS framework
- exifr (^7.1.3): EXIF data extraction

**Development Dependencies**:
- vite (^7.1.5): Build tool and dev server
- eslint (^9.33.0): Code linting
- @vitejs/plugin-react (^5.0.0): React plugin for Vite

#### Build & Installation
```bash
npm install
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

#### Main Files
**Entry Point**: src/main.jsx
**App Component**: src/App.jsx
**Utilities**: src/utils/ (i18n.js, indiaCities.js)

### Analytics Component
**Configuration File**: requirements.txt

#### Language & Runtime
**Language**: Python
**Main Script**: ocean_hazard_analysis.py

#### Dependencies
**Main Dependencies**:
- geopandas (>=0.14): Geospatial data handling
- shapely (>=2.0): Geometric operations
- scikit-learn (>=1.4): Machine learning tools
- numpy (>=1.24): Numerical computing
- pandas (>=2.0): Data analysis
- libpysal (>=4.10): Spatial analysis
- esda (>=2.5): Exploratory spatial data analysis
- scipy (>=1.11): Scientific computing

#### Build & Installation
```bash
pip install -r requirements.txt
python ocean_hazard_analysis.py
```

## Environment Configuration
The project uses environment variables for configuration, with templates provided in `.env.example`:

**Database**:
- DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

**API Keys**:
- OPENWEATHER_API_KEY

**Authentication**:
- JWT_SECRET, JWT_EXPIRES_IN

**Server**:
- PORT, NODE_ENV

**Frontend**:
- REACT_APP_API_URL, REACT_APP_MAP_TILE_URL

**Analytics**:
- PYTHON_PATH, ANALYTICS_OUTPUT_DIR