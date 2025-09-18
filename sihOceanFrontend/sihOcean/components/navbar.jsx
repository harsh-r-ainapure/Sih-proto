import { useContext, useState } from "react";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";

const Navbar = ({ onclickhome, onclickform, onclickinsta, onclickreddit, onclicklatest, theme = "light", onToggleTheme }) => {
  const { currentLang } = useContext(valueContext);
  
  // Diagnostics: quick ping to show SARVAM proxy status (dev only)
  // window.__sarvamDiag = async () => {
  //   try {
  //     const res = await fetch((import.meta.env.VITE_API_BASE||'') + '/sarvam-translate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ input:'Hello', source_language:'en', target_language:'hi' }) });
  //     console.log('Diag /sarvam-translate', res.status, await res.text());
  //   } catch(e) { console.error('Diag error', e); }
  // };
  const [searchQuery, setSearchQuery] = useState("");

  const searchLocation = async (query) => {
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        // Navigate to home page first
        onclickhome();
        // Dispatch custom event with search data
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mapSearch', { 
            detail: { lat, lon, display_name } 
          }));
        }, 100);
        // Clear the search input
        setSearchQuery("");
      } else {
        alert("No results found.");
      }
    } catch (err) {
      console.error("Error fetching location:", err);
      alert("Error searching for location.");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await searchLocation(searchQuery);
  };

  return (
    <nav
      className="navbar navbar-expand-lg"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#007BFF",
        zIndex: 1000,
        borderBottom: "2px solid #0056b3",
        padding: "10px 20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="container-fluid">
        <a
          className="navbar-brand"
          href="#"
          style={{
            fontWeight: "bold",
            fontSize: "1.4rem",
            color: "white",
          }}
        >
          {t("app_title", currentLang)}
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ border: "1px solid white" }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Home */}
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                style={{
                  color: "white",
                  fontWeight: "500",
                  marginRight: "10px",
                  textDecoration: "none",
                }}
                onClick={onclickhome}
                onMouseOver={(e) => (e.target.style.color = "#FFD700")}
                onMouseOut={(e) => (e.target.style.color = "white")}
              >
                {t("nav_home", currentLang)}
              </button>
            </li>

            

            {/* Inform */}
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                style={{
                  color: "white",
                  fontWeight: "500",
                  marginRight: "10px",
                  textDecoration: "none",
                }}
                onClick={onclickform}
                onMouseOver={(e) => (e.target.style.color = "#FFD700")}
                onMouseOut={(e) => (e.target.style.color = "white")}
              >
                {t("nav_inform", currentLang)}
              </button>
            </li>

            {/* Latest */}
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                style={{
                  color: "white",
                  fontWeight: "500",
                  marginRight: "10px",
                  textDecoration: "none",
                }}
                onClick={onclicklatest}
                onMouseOver={(e) => (e.target.style.color = "#FFD700")}
                onMouseOut={(e) => (e.target.style.color = "white")}
              >
                {t("nav_latest", currentLang)}
              </button>
            </li>

            {/* Social Media Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link btn btn-link dropdown-toggle"
                style={{
                  color: "white",
                  fontWeight: "500",
                  marginRight: "10px",
                  textDecoration: "none",
                  
                }}
                data-bs-toggle="dropdown"
                aria-expanded="false"
                onMouseOver={(e) => (e.target.style.color = "#FFD700")}
                onMouseOut={(e) => (e.target.style.color = "white")}
              >
                {t("nav_social_media", currentLang)}
              </button>
              <ul className="dropdown-menu">
                {["Instagram", "X", "Reddit"].map((platform, index) => (
                  <li key={index}>
                    <button
                      className="dropdown-item btn btn-link"
                      style={{
                        color: "black",
                        fontWeight: "500",
                        textDecoration: "none",
                         backgroundColor: "#007BFF",
                         
                        
                      }}
                      onMouseOver={(e) => (e.target.style.color = "#FFD700")}
                      onMouseOut={(e) => (e.target.style.color = "black")}
                      onClick={() => {
                        if (platform === "Instagram") onclickinsta();
                        if (platform === "Reddit") onclickreddit();
                        // Add handlers for X here if needed
                      }}
                    >
                      {platform === "Instagram" ? t("nav_instagram", currentLang) : platform === "X" ? t("nav_x", currentLang) : t("nav_reddit", currentLang)}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          {/* Search - Mobile responsive */}
          <div className="d-flex align-items-center">
            {/* Desktop Search */}
            <form className="d-none d-md-flex" role="search" onSubmit={handleSearch}>
              <input
                className="form-control me-2"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search_button", currentLang)}
                aria-label="Search"
                style={{
                  borderRadius: "20px",
                  padding: "5px 15px",
                  border: "1px solid white",
                  backgroundColor: "rgba(255,255,255,0.9)",
                }}
              />
              <button
                className="btn"
                type="submit"
                style={{
                  borderRadius: "20px",
                  backgroundColor: "white",
                  color: "#007BFF",
                  fontWeight: "bold",
                  border: "none",
                  padding: "5px 15px",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#FFD700";
                  e.target.style.color = "#0056b3";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.color = "#007BFF";
                }}
              >
                {t("search_button", currentLang)}
              </button>
            </form>
            
            {/* Mobile Search Icon */}
            <button
              className="btn d-md-none"
              type="button"
              onClick={() => {
                const query = prompt("Enter location to search:");
                if (query && query.trim()) {
                  setSearchQuery(query);
                  // Trigger search directly
                  searchLocation(query);
                }
              }}
              style={{
                backgroundColor: "transparent",
                color: "white",
                border: "none",
                fontSize: "1.2rem",
                padding: "8px",
                borderRadius: "50%",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
                e.target.style.color = "#FFD700";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "white";
              }}
              title={t("search_button", currentLang)}
            >
              🔍
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
