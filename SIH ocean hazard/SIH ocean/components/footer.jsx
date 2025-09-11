import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Footer = ({ onclickmypost }) => {
  return (
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
    >
      {/* Navigation Links */}
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
        }}
      >
        {[ "My Posts", "Language/भाषा", "FAQs", "About"].map((item, index) => (
          <li key={index} style={{ margin: "0 10px" }}>
            <a
              href="#"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "500",
                transition: "color 0.3s ease",
              }}
              onMouseOver={(e) => (e.target.style.color = "#FFD700")}
              onMouseOut={(e) => (e.target.style.color = "white")}
              onClick={()=>{
                if (item=="My Posts") {
                  onclickmypost();
                }
              }}
            >
              {item}
            </a>
          </li>
        ))}

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
            Settings
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
                    backgroundColor: "orange"
                  }}
                  onMouseOver={(e) => (e.target.style.color = "black")}
                  onMouseOut={(e) => (e.target.style.color = "gray")}
                  onClick={() => {
                    
                    
                  }}
                >
                  {platform}
                </button>
              </li>
            ))}
          </ul>
        </li>
      </ul>

      {/* Copyright */}
      <p style={{ margin: 0, fontSize: "14px" }}>© 2024 Company, Inc</p>
    </footer>
  );
};

export default Footer;
