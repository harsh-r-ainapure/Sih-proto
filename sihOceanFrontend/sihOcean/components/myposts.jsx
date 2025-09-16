import { useContext, useEffect, useState } from "react";
import { valueContext } from "../counter/counter";
import { translateText, normalizeLang, guessLang, t } from "../src/utils/i18n";

function PostCard({ item, viewerLang }) {
  const [translated, setTranslated] = useState({ ...item });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const from = normalizeLang(item.lang || guessLang(item.location || item.disaster || item.severity || ""));
    const to = normalizeLang(viewerLang);
    if (!item || from === to) {
      setTranslated({ ...item });
      return;
    }

    let alive = true;
    setLoading(true);
    (async () => {
      const [loc, dis, sev] = await Promise.all([
        translateText(item.location || "", from, to),
        translateText(item.disaster || "", from, to),
        translateText(item.severity || "", from, to),
      ]);
      if (!alive) return;
      setTranslated({ ...item, location: loc, disaster: dis, severity: sev });
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [item, viewerLang]);

  return (
    <div
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
        e.currentTarget.style.boxShadow = "0 6px 12px rgba(183, 28, 28, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(183, 28, 28, 0.2)";
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
        {translated.location || "Unknown Location"}
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
          <strong>{t("label_disaster", viewerLang)}</strong> {translated.disaster || "N/A"}
        </p>
        <p style={{ margin: "5px 0", color: "#b71c1c" }}>
          <strong>{t("label_severity", viewerLang)}</strong> {translated.severity || "N/A"}
        </p>
        {loading && (
          <p style={{ margin: "5px 0", color: "#b71c1c", fontStyle: "italic" }}>
            Translating...
          </p>
        )}
      </div>
    </div>
  );
}

const MyPosts = () => {
  const { ogList, currentLang } = useContext(valueContext);

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
        🚫 {t("myposts_empty", currentLang)}
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
        <PostCard item={item} viewerLang={currentLang} key={index} />
      ))}
    </div>
  );
};

export default MyPosts;
