const Navbar = ({ onclickhome,  onclickform, onclickinsta }) => {
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
          Ocean Hazard
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
                Home
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
                Inform
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
                Latest
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
                Social Media
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
                        // Add handlers for X and Reddit here if needed
                      }}
                    >
                      {platform}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          {/* Search */}
          <form className="d-flex" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
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
              Search
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
