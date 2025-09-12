import { useState, useContext } from "react";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";

const IncidentForm = ({ onSubmit, onClose }) => {
  const { currentLang } = useContext(valueContext);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    lat: "",
    lng: "",
    severity: "medium",
    type: "other",
    image: null,
    reportedBy: "",
    isVerified: false
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.lat.trim()) newErrors.lat = "Latitude is required";
    if (!formData.lng.trim()) newErrors.lng = "Longitude is required";
    if (!formData.reportedBy.trim()) newErrors.reportedBy = "Reporter name is required";
    
    // Validate coordinates
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    if (isNaN(lat) || lat < -90 || lat > 90) newErrors.lat = "Invalid latitude";
    if (isNaN(lng) || lng < -180 || lng > 180) newErrors.lng = "Invalid longitude";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Create incident object
      const newIncident = {
        id: Date.now(), // Simple ID generation
        title: formData.title,
        description: formData.description,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        severity: formData.severity,
        type: formData.type,
        reportedBy: formData.reportedBy,
        reportedDate: new Date().toISOString(),
        verifiedBy: formData.isVerified ? "System Admin" : null,
        verifiedDate: formData.isVerified ? new Date().toISOString() : null,
        isVerified: formData.isVerified,
        image: formData.image ? URL.createObjectURL(formData.image) : "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop"
      };

      // Call the onSubmit callback with the new incident
      onSubmit(newIncident);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        lat: "",
        lng: "",
        severity: "medium",
        type: "other",
        image: null,
        reportedBy: "",
        isVerified: false
      });
      
      // Close the form
      onClose();
      
    } catch (error) {
      console.error("Error submitting incident:", error);
      alert("Error submitting incident report. Please try again.");
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enter coordinates manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
            zIndex: 1,
          }}
        >
          ×
        </button>

        <div style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 24px 0", color: "#333", fontSize: "24px" }}>
            Report New Incident
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                Incident Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter incident title"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `2px solid ${errors.title ? "#dc3545" : "#ddd"}`,
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
              {errors.title && <span style={{ color: "#dc3545", fontSize: "14px" }}>{errors.title}</span>}
            </div>

            {/* Description */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the incident in detail"
                rows="4"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `2px solid ${errors.description ? "#dc3545" : "#ddd"}`,
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
              {errors.description && <span style={{ color: "#dc3545", fontSize: "14px" }}>{errors.description}</span>}
            </div>

            {/* Location */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                Location *
              </label>
              <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    name="lat"
                    value={formData.lat}
                    onChange={handleInputChange}
                    placeholder="Latitude"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `2px solid ${errors.lat ? "#dc3545" : "#ddd"}`,
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  />
                  {errors.lat && <span style={{ color: "#dc3545", fontSize: "14px" }}>{errors.lat}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    name="lng"
                    value={formData.lng}
                    onChange={handleInputChange}
                    placeholder="Longitude"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `2px solid ${errors.lng ? "#dc3545" : "#ddd"}`,
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  />
                  {errors.lng && <span style={{ color: "#dc3545", fontSize: "14px" }}>{errors.lng}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007BFF",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                📍 Use Current Location
              </button>
            </div>

            {/* Severity and Type */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Severity
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="oil_spill">Oil Spill</option>
                  <option value="chemical_leak">Chemical Leak</option>
                  <option value="water_contamination">Water Contamination</option>
                  <option value="air_pollution">Air Pollution</option>
                  <option value="waste_dumping">Waste Dumping</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Reporter */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                Reported By *
              </label>
              <input
                type="text"
                name="reportedBy"
                value={formData.reportedBy}
                onChange={handleInputChange}
                placeholder="Your name or organization"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `2px solid ${errors.reportedBy ? "#dc3545" : "#ddd"}`,
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
              {errors.reportedBy && <span style={{ color: "#dc3545", fontSize: "14px" }}>{errors.reportedBy}</span>}
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                Incident Image (Optional)
              </label>
              <input
                type="file"
                name="image"
                onChange={handleInputChange}
                accept="image/*"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Verification Toggle */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleInputChange}
                  style={{ transform: "scale(1.2)" }}
                />
                <span style={{ fontWeight: "600", color: "#333" }}>
                  Mark as Verified
                </span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#007BFF",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IncidentForm;
