import { useContext } from "react";
import { valueContext } from "../counter/counter";

export default function InformForm() {
  const { locationRef, disasterRef, severityRef, photoURLRef, setOgList } =
    useContext(valueContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = {
      location: locationRef.current.value.trim(),
      disaster: disasterRef.current.value.trim(),
      severity: severityRef.current.value.trim(),
      photoURL: photoURLRef.current.value.trim(),
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
      <input ref={locationRef} type="text" placeholder="Enter Location" />
      <input ref={disasterRef} type="text" placeholder="Enter Disaster Type" />
      <input ref={severityRef} type="text" placeholder="Enter Severity" />
      <input ref={photoURLRef} type="text" placeholder="Paste Photo URL" />
      <button type="submit">Submit</button>
    </form>
  );
}
