import { useContext } from "react";
import { valueContext } from "../counter/counter";

const MyPosts = () => {
  const { ogList } = useContext(valueContext);

  if (ogList.length === 0) {
    return (
      <p
        style={{
          color: "#b71c1c",
          fontWeight: "bold",
          fontSize: "18px",
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        🚫 No posts yet
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        padding: "20px",
      }}
    >
      {ogList.map((item, index) => (
        <div
          key={index}
          style={{
            backgroundColor: "#fff5f5",
            border: "1px solid #ffcdd2",
            borderRadius: "12px",
            boxShadow: "0 4px 8px rgba(183, 28, 28, 0.2)",
            overflow: "hidden",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow =
              "0 6px 12px rgba(183, 28, 28, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 8px rgba(183, 28, 28, 0.2)";
          }}
        >
          <div
            style={{
              backgroundColor: "#d32f2f",
              color: "white",
              textAlign: "center",
              padding: "10px",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            {item.location || "Unknown Location"}
          </div>

          <img
            src={item.photoURL || "https://via.placeholder.com/250x150?text=No+Image"}
            alt="Post"
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              borderBottom: "1px solid #ffcdd2",
            }}
          />

          <div style={{ padding: "12px" }}>
            <p style={{ margin: "5px 0", color: "#b71c1c" }}>
              <strong>Disaster:</strong> {item.disaster || "N/A"}
            </p>
            <p style={{ margin: "5px 0", color: "#b71c1c" }}>
              <strong>Severity:</strong> {item.severity || "N/A"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyPosts;
