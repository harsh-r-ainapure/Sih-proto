import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useContext } from "react";
import { valueContext } from "../counter/counter";
import { getSupportedLangs, persistLang, t } from "../src/utils/i18n";

const Footer = ({ onclickmypost }) => {
  const { currentLang, setCurrentLang } = useContext(valueContext);
  const langs = getSupportedLangs();

  const changeLang = (code) => {
    setCurrentLang(code);
    try { persistLang(code); } catch (_) {}
  };

  return (
    <>
      {/* Desktop Footer */}
      <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#007BFF",
        color: "white",
        padding: "15px 0",
        borderTop: "2px solid #0056b3",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        zIndex: 1000,
      }}
      className="d-none d-md-block"
    >
      {/* Navigation Links - Mobile responsive */}
      <ul
        style={{
          display: "flex",
          justifyContent: "center",
          listStyleType: "none",
          margin: 0,
          padding: 0,
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
          paddingBottom: "10px",
          marginBottom: "10px",
          flexWrap: "wrap",
          gap: "5px",
        }}
      >
        <li style={{ margin: "0 5px" }}>
          <a
            href="#"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "500",
              transition: "color 0.3s ease",
              fontSize: "14px",
            }}
            onMouseOver={(e) => (e.target.style.color = "#FFD700")}
            onMouseOut={(e) => (e.target.style.color = "white")}
            onClick={() => onclickmypost()}
          >
            {t("footer_my_posts", currentLang)}
          </a>
        </li>
        <li style={{ margin: "0 5px" }}>
          <a
            href="#"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "500",
              transition: "color 0.3s ease",
              fontSize: "14px",
            }}
            onMouseOver={(e) => (e.target.style.color = "#FFD700")}
            onMouseOut={(e) => (e.target.style.color = "white")}
          >
            {t("footer_faqs", currentLang)}
          </a>
        </li>
        <li style={{ margin: "0 5px" }}>
          <a
            href="#"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "500",
              transition: "color 0.3s ease",
              fontSize: "14px",
            }}
            onMouseOver={(e) => (e.target.style.color = "#FFD700")}
            onMouseOut={(e) => (e.target.style.color = "white")}
          >
            {t("footer_about", currentLang)}
          </a>
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
            {t("footer_settings", currentLang)}
          </button>
          <ul className="dropdown-menu">
            {["Dark"].map((platform, index) => (
              <li key={index}>
                <button
                  className="dropdown-item btn btn-link"
                  style={{
                    color: "black",
                    fontWeight: "500",
                    textDecoration: "none",
                    backgroundColor: "orange",
                  }}
                  onMouseOver={(e) => (e.target.style.color = "black")}
                  onMouseOut={(e) => (e.target.style.color = "gray")}
                  onClick={() => {}}
                >
                  {platform}
                </button>
              </li>
            ))}
          </ul>
        </li>
      </ul>

      {/* Language dropdown - Mobile responsive */}
      <div
        className="dropdown"
        style={{
          position: "fixed",
          right: "16px",
          bottom: "55px",
          zIndex: 1001,
        }}
      >
        <button
          className="btn btn-light dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title={t("language", currentLang)}
          style={{
            fontSize: "12px",
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            backgroundColor: "white",
            color: "#333",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          🌐 {langs[currentLang]?.label || currentLang.toUpperCase()}
        </button>
        <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: "120px" }}>
          {Object.entries(langs).map(([code, meta]) => (
            <li key={code}>
              <button 
                className="dropdown-item" 
                onClick={() => changeLang(code)}
                style={{
                  fontSize: "14px",
                  padding: "8px 12px",
                  backgroundColor: currentLang === code ? "#f8f9fa" : "transparent",
                }}
              >
                {meta.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Copyright */}
      <p style={{ margin: 0, fontSize: "14px" }}>© 2025 GEN-NOVA, Inc</p>
    </footer>

    {/* Mobile Compact Footer */}
    <footer
      className="d-md-none"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#007BFF",
        color: "white",
        padding: "8px 0",
        borderTop: "1px solid #0056b3",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
        <a
          href="#"
          style={{
            color: "white",
            textDecoration: "none",
            fontSize: "12px",
            fontWeight: "500",
          }}
          onClick={() => onclickmypost()}
        >
          {t("footer_my_posts", currentLang)}
        </a>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>|</span>
        <a
          href="#"
          style={{
            color: "white",
            textDecoration: "none",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {t("footer_about", currentLang)}
        </a>
      </div>
    </footer>
    </>
  );
};

export default Footer;
