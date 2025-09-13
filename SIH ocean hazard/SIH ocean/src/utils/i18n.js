// Simple i18n utilities with hardcoded UI strings and Sarvam AI for user content only
// Note: store your Sarvam API key in Vite env as VITE_SARVAM_API_KEY

const LANGS = {
  en: { label: "English" },
  hi: { label: "हिन्दी" },
  mr: { label: "मराठी" },
};

// Hardcoded UI strings
const UI_STRINGS = {
  en: {
    app_title: "Ocean Hazard",
    nav_home: "Home",
    nav_inform: "Report Incident",
    nav_latest: "Latest",
    nav_social_media: "Social Media",
    nav_instagram: "Instagram",
    nav_x: "X",
    nav_reddit: "Reddit",
    
    latest_incidents: "LATEST OCEAN HAZARD INCIDENTS",

    search_placeholder: "Search for a place",
    search_button: "Search",
    show_heatmap: "Show Heatmap",
    hide_heatmap: "Hide Heatmap",

    layer_panel_title: "OpenStreetMap",
    layer_hazard_points: "Hazard Points",
    layer_heatmap: "Heatmap",
    layer_dbscan: "DBSCAN Clusters",
    layer_hotspots: "Hotspots (Gi*)",

    form_enter_location: "Enter Location",
    form_enter_disaster_type: "Enter Disaster Type",
    form_enter_severity: "Enter Severity",
    form_paste_photo_url: "Paste Photo URL",
    form_submit: "Submit",

    myposts_empty: "No posts yet",
    label_disaster: "Disaster:",
    label_severity: "Severity:",

    footer_my_posts: "My Posts",
    footer_faqs: "FAQs",
    footer_about: "About",
    footer_settings: "Settings",
    language: "Language",

    report_title: "Report Incident",
    report_upload_image: "Upload image",
    report_city: "City",
    report_short_desc: "Short description",
    report_long_desc: "Long description (optional)",
    report_name: "Your name",
    report_time: "Time",
    report_cancel: "Cancel",
    report_submit: "Submit",
  },
  hi: {
    app_title: "समुद्र खतरा",
    nav_home: "होम",
    nav_inform: "घटना रिपोर्ट करें",
    nav_latest: "नवीनतम",
    nav_social_media: "सोशल मीडिया",
    nav_instagram: "इंस्टाग्राम",
    nav_x: "एक्स",
    nav_reddit: "रेडिट",
    
    latest_incidents: "नवीनतम समुद्री खतरे की घटनाएँ",

    search_placeholder: "स्थान खोजें",
    search_button: "खोजें",
    show_heatmap: "हीटमैप दिखाएँ",
    hide_heatmap: "हीटमैप छिपाएँ",

    layer_panel_title: "ओपनस्ट्रीटमैप",
    layer_hazard_points: "���तरे के बिंदु",
    layer_heatmap: "हीटमैप",
    layer_dbscan: "DBSCAN क्लस्टर",
    layer_hotspots: "हॉटस्पॉट (Gi*)",

    form_enter_location: "स्थान दर्ज करें",
    form_enter_disaster_type: "आपदा का प्रकार दर्ज करें",
    form_enter_severity: "गंभीरता दर्ज करें",
    form_paste_photo_url: "फोटो URL पेस्ट करें",
    form_submit: "सबमिट",

    myposts_empty: "अभी कोई पोस्ट नहीं",
    label_disaster: "आपदा:",
    label_severity: "गंभीरता:",

    footer_my_posts: "मेरी पोस्टें",
    footer_faqs: "प्रश्नोत्तर",
    footer_about: "परिचय",
    footer_settings: "सेटिंग्स",
    language: "भाषा",

    report_title: "घटना रिपोर्ट करें",
    report_upload_image: "छवि अपलोड करें",
    report_city: "शहर",
    report_short_desc: "संक्षिप्त विवरण",
    report_long_desc: "विस्तृत व��वरण (वैकल्पिक)",
    report_name: "आपका नाम",
    report_time: "समय",
    report_cancel: "रद्द करें",
    report_submit: "सबमिट",
  },
  mr: {
    app_title: "समुद्र धोका",
    nav_home: "मुखपृष्ठ",
    nav_inform: "माहिती द्या",
    nav_latest: "नवीन",
    nav_social_media: "सोशल मीडिया",
    nav_instagram: "इंस्टाग्राम",
    nav_x: "एक्स",
    nav_reddit: "रेडिट",
    
    latest_incidents: "नवीनतम समुद्री धोका घटना",

    search_placeholder: "ठिकाण शोधा",
    search_button: "शोधा",
    show_heatmap: "हीटमॅप दाखवा",
    hide_heatmap: "हीटमॅप लपवा",

    layer_panel_title: "ओपनस्ट्रीटमॅप",
    layer_hazard_points: "धोका बिंदू",
    layer_heatmap: "हीटमॅप",
    layer_dbscan: "DBSCAN क्लस्टर्स",
    layer_hotspots: "हॉटस्पॉट्स (Gi*)",

    form_enter_location: "स्थान लिहा",
    form_enter_disaster_type: "आपत्ती प्रकार लिहा",
    form_enter_severity: "तीव्रता लिहा",
    form_paste_photo_url: "फोटो URL पेस्ट करा",
    form_submit: "सबमिट",

    myposts_empty: "अजून पोस्ट नाहीत",
    label_disaster: "आपत्ती:",
    label_severity: "तीव्रता:",

    footer_my_posts: "माझ्या पोस्ट",
    footer_faqs: "���्रश्नोत्तर",
    footer_about: "माहिती",
    footer_settings: "सेटिंग्ज",
    language: "भाषा",

    report_title: "घटना रिपोर्ट करा",
    report_upload_image: "प्रतिमा अपलोड करा",
    report_city: "शहर",
    report_short_desc: "संक्षिप्त वर्णन",
    report_long_desc: "सविस्तर वर्णन (पर्यायी)",
    report_name: "तुमचे नाव",
    report_time: "वेळ",
    report_cancel: "रद्द करा",
    report_submit: "सबमिट",
  },
};

export function t(key, lang) {
  const code = normalizeLang(lang);
  return (UI_STRINGS[code] && UI_STRINGS[code][key]) || (UI_STRINGS.en[key] || key);
}

export function getSupportedLangs() {
  return LANGS;
}

export function normalizeLang(code) {
  if (!code) return "en";
  const c = code.toLowerCase();
  if (c.startsWith("en")) return "en";
  if (c.startsWith("hi") || c === "hin") return "hi";
  if (c.startsWith("mr") || c === "mar") return "mr";
  return "en";
}

export function persistLang(code) {
  try {
    localStorage.setItem("app.lang", normalizeLang(code));
  } catch (_) {}
}

// Detect basic language of a short text with heuristics
export function guessLang(text) {
  if (!text) return "en";
  const dev = /[\u0900-\u097F]/.test(text);
  if (dev) {
    return "hi"; // default to Hindi for Devanagari
  }
  return "en";
}

// Translate text via Sarvam AI for user-generated content only
export async function translateText(text, from, to) {
  const src = normalizeLang(from);
  const tgt = normalizeLang(to);
  if (!text || src === tgt) return text;

  const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
  if (!apiKey) {
    console.warn("Missing VITE_SARVAM_API_KEY; returning original text.");
    return text;
  }

  const body = {
    input: text,
    source_language: src,
    target_language: tgt,
  };

  try {
    const res = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("Sarvam translate failed", res.status);
      return text;
    }
    const data = await res.json();
    return data.translated_text || text;
  } catch (e) {
    console.warn("Sarvam translate error", e);
    return text;
  }
}
