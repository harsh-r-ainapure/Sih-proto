import { useContext } from "react";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";

const Navbar = ({ onclickhome,  onclickform, onclickinsta, onclickreddit }) => {
  const { currentLang } = useContext(valueContext);
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
            <form className="d-none d-md-flex" role="search">
              <input
                className="form-control me-2"
                type="search"
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
