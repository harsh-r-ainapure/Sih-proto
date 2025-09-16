import { useContext } from "react";
import { valueContext } from "../counter/counter";
import { guessLang, normalizeLang, t } from "../src/utils/i18n";

export default function InformForm() {
  const { locationRef, disasterRef, severityRef, photoURLRef, setOgList, currentLang } =
    useContext(valueContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const location = locationRef.current.value.trim();
    const disaster = disasterRef.current.value.trim();
    const severity = severityRef.current.value.trim();
    const photoURL = photoURLRef.current.value.trim();

    const langDetected = guessLang(location || disaster || severity);

    const newItem = {
      location,
      disaster,
      severity,
      photoURL,
      lang: normalizeLang(langDetected),
    };

    // ✅ Only add to list if at least location or disaster is filled
    if (newItem.location || newItem.disaster) {
      setOgList((prev) => [newItem, ...prev]);
    }

    // ✅ send to backend as before
    try {
      await fetch("http://localhost:5000/inform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      alert("✅ Form submitted successfully!");
    } catch (err) {
      console.error("❌ Error sending data:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
      }}
    >
      <input ref={locationRef} type="text" placeholder={t("form_enter_location", currentLang)} />
      <input ref={disasterRef} type="text" placeholder={t("form_enter_disaster_type", currentLang)} />
      <input ref={severityRef} type="text" placeholder={t("form_enter_severity", currentLang)} />
      <input ref={photoURLRef} type="text" placeholder={t("form_paste_photo_url", currentLang)} />
      <button type="submit">{t("form_submit", currentLang)}</button>
    </form>
  );
}
