// Simple i18n utilities with hardcoded UI strings and Sarvam AI for user content only
// Note: store your Sarvam API key in Vite env as VITE_SARVAM_API_KEY

const LANGS = {
  en: { label: "English" },
  hi: { label: "हिन्दी" },
  mr: { label: "मराठी" },
  gu: { label: "ગુજરાતી" },
  kn: { label: "ಕನ್ನಡ" },
  ml: { label: "മലയാളം" },
  ta: { label: "தமிழ்" },
  te: { label: "తెలుగు" },
  or: { label: "ଓଡ଼ିଆ" },
  bn: { label: "বাংলা" },
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
  gu: {
    app_title: "સમુદ્ર જોખમ",
    nav_home: "મુખ્ય પેજ",
    nav_inform: "ઘટના રિપોર્ટ કરો",
    nav_latest: "તાજેતરના",
    nav_social_media: "સોશિયલ મીડિયા",
    nav_instagram: "ઇન્સ્ટાગ્રામ",
    nav_x: "એક્સ",
    nav_reddit: "રેડિટ",

    latest_incidents: "તાજેતરની સમુદ્ર જોખમ ઘટનાઓ",

    search_placeholder: "સ્થળ શોધો",
    search_button: "શોધો",
    show_heatmap: "હીટમેપ બતાવો",
    hide_heatmap: "હીટમેપ છુપાવો",

    layer_panel_title: "ઓપનસ્ટ્રીટમેપ",
    layer_hazard_points: "જોખમ બિંદુઓ",
    layer_heatmap: "હીટમેપ",
    layer_dbscan: "DBSCAN ક્લસ્ટર્સ",
    layer_hotspots: "હોટસ્પોટ્સ (Gi*)",

    form_enter_location: "સ્થાન દાખલ કરો",
    form_enter_disaster_type: "આપત્તિનો પ્રકાર દાખલ કરો",
    form_enter_severity: "તીવ્રતા દાખલ કરો",
    form_paste_photo_url: "ફોટો URL પેસ્ટ કરો",
    form_submit: "સબમિટ",

    myposts_empty: "હજુ સુધી કોઈ પોસ્ટ નથી",
    label_disaster: "આપત્તિ:",
    label_severity: "તીવ્રતા:",

    footer_my_posts: "મારી પોસ્ટ્સ",
    footer_faqs: "પ્રશ્નો",
    footer_about: "વિશે",
    footer_settings: "સેટિંગ્સ",
    language: "ભાષા",

    report_title: "ઘટના રિપોર્ટ કરો",
    report_upload_image: "છબી અપલોડ કરો",
    report_city: "શહેર",
    report_short_desc: "ટૂંકું વર્ણન",
    report_long_desc: "વિસ્તૃત વર્ણન (વૈકલ્પિક)",
    report_name: "તમારું નામ",
    report_time: "સમય",
    report_cancel: "રદ કરો",
    report_submit: "સબમિટ",
  },
  kn: {
    app_title: "ಸಮುದ್ರ ಅಪಾಯ",
    nav_home: "ಮುಖಪುಟ",
    nav_inform: "ಘಟನೆಯನ್ನು ವರದಿ ಮಾಡಿ",
    nav_latest: "ಇತ್ತೀಚಿನವು",
    nav_social_media: "ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ",
    nav_instagram: "ಇನ್‌ಸ್ಟಾಗ್ರಾಂ",
    nav_x: "ಎಕ್ಸ್",
    nav_reddit: "ರೆಡ್ಡಿಟ್",

    latest_incidents: "ಇತ್ತೀಚಿನ ಸಮುದ್ರ ಅಪಾಯ ಘಟನೆಗಳು",

    search_placeholder: "ಸ್ಥಳವನ್ನು ಹುಡುಕಿ",
    search_button: "ಹುಡುಕಿ",
    show_heatmap: "ಹಿಟ್‌ಮ್ಯಾಪ್ ತೋರಿಸಿ",
    hide_heatmap: "ಹಿಟ್‌ಮ್ಯಾಪ್ ಮರೆಮಾಡಿ",

    layer_panel_title: "ಒಪನ್‌ಸ್ಟ್ರೀಟ್‌ಮ್ಯಾಪ್",
    layer_hazard_points: "ಅಪಾಯ ಬಿಂದುಗಳು",
    layer_heatmap: "ಹಿಟ್‌ಮ್ಯಾಪ್",
    layer_dbscan: "DBSCAN ಕ್ಲಸ್ಟರ್‌ಗಳು",
    layer_hotspots: "ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು (Gi*)",

    form_enter_location: "ಸ್ಥಳ ನಮೂದಿಸಿ",
    form_enter_disaster_type: "ವಿಪತ್ತು ಪ್ರಕಾರ ನಮೂದಿಸಿ",
    form_enter_severity: "ತೀವ್ರತೆ ನಮೂದಿಸಿ",
    form_paste_photo_url: "ಫೋಟೋ URL ಅಂಟಿಸಿ",
    form_submit: "ಸಲ್ಲಿಸು",

    myposts_empty: "ಇನ್ನೂ ಯಾವುದೇ ಪೋಸ್ಟ್‌ಗಳಿಲ್ಲ",
    label_disaster: "ವಿಪತ್ತು:",
    label_severity: "ತೀವ್ರತೆ:",

    footer_my_posts: "ನನ್ನ ಪೋಸ್ಟ್‌ಗಳು",
    footer_faqs: "ಪ್ರಶ್ನೋತ್ತರ",
    footer_about: "ಬಗ್ಗೆ",
    footer_settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    language: "ಭಾಷೆ",

    report_title: "ಘಟನೆಯನ್ನು ವರದಿ ಮಾಡಿ",
    report_upload_image: "ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    report_city: "ನಗರ",
    report_short_desc: "ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ",
    report_long_desc: "ವಿಸ್ತೃತ ವಿವರಣೆ (ಐಚ್ಛಿಕ)",
    report_name: "ನಿಮ್ಮ ಹೆಸರು",
    report_time: "ಸಮಯ",
    report_cancel: "ರದ್ದುಮಾಡಿ",
    report_submit: "ಸಲ್ಲಿಸು",
  },
  ml: {
    app_title: "സമുദ്ര അപകടം",
    nav_home: "ഹോം",
    nav_inform: "സംഭവം റിപ്പോർട്ട് ചെയ്യുക",
    nav_latest: "പുതിയത്",
    nav_social_media: "സോഷ്യൽ മീഡിയ",
    nav_instagram: "ഇൻസ്റ്റാഗ്രാം",
    nav_x: "എക്സ്",
    nav_reddit: "റെഡിറ്റ്",

    latest_incidents: "സമീപകാല സമുദ്ര അപകട സംഭവങ്ങൾ",

    search_placeholder: "സ്ഥലം തിരയുക",
    search_button: "തിരയുക",
    show_heatmap: "ഹീറ്റ്‌മാപ്പ് കാണിക്കുക",
    hide_heatmap: "ഹീറ്റ്‌മാപ്പ് മറയ്ക്കുക",

    layer_panel_title: "ഓപ്പൺസ്ട്രീറ്റ്‌മാപ്പ്",
    layer_hazard_points: "അപകട പോയിന്റുകൾ",
    layer_heatmap: "ഹീറ്റ്‌മാപ്പ്",
    layer_dbscan: "DBSCAN ക്ലസ്റ്ററുകൾ",
    layer_hotspots: "ഹോട്ട്‌സ്പോട്ടുകൾ (Gi*)",

    form_enter_location: "സ്ഥലം നൽകുക",
    form_enter_disaster_type: "ദുരന്ത തരം നൽകുക",
    form_enter_severity: "തീവ്രത നൽകുക",
    form_paste_photo_url: "ഫോട്ടോ URL ഒട്ടിക്കുക",
    form_submit: "സമർപ്പിക്കുക",

    myposts_empty: "ഇതുവരെ പോസ്റ്റുകളൊന്നുമില്ല",
    label_disaster: "ദുരന്തം:",
    label_severity: "തീവ്രത:",

    footer_my_posts: "എന്റെ പോസ്റ്റുകൾ",
    footer_faqs: "ചോദ്യോത്തരങ്ങൾ",
    footer_about: "കുറിച്ച്",
    footer_settings: "ക്രമീകരണങ്ങൾ",
    language: "ഭാഷ",

    report_title: "സംഭവം റിപ്പോർട്ട് ചെയ്യുക",
    report_upload_image: "ചിത്രം അപ്‌ലോഡ് ചെയ്യുക",
    report_city: "നഗരം",
    report_short_desc: "ചുരുക്ക വിവരണം",
    report_long_desc: "വിശദ വിവരണം (ഐച്ഛികം)",
    report_name: "നിങ്ങളുടെ പേര്",
    report_time: "സമയം",
    report_cancel: "റദ്ദാക്കുക",
    report_submit: "സമർപ്പിക്കുക",
  },
  ta: {
    app_title: "கடல் அபாயம்",
    nav_home: "முகப்பு",
    nav_inform: "நிகழ்வை அறிவிக்கவும்",
    nav_latest: "புதியவை",
    nav_social_media: "சமூக ஊடகம்",
    nav_instagram: "இன்ஸ்டாகிராம்",
    nav_x: "எக்ஸ்",
    nav_reddit: "ரெட்டிட்",

    latest_incidents: "சமீபத்திய கடல் அபாய நிகழ்வுகள்",

    search_placeholder: "இடத்தை தேடவும்",
    search_button: "தேடுக",
    show_heatmap: "ஹீட்மேப் காட்டவும்",
    hide_heatmap: "ஹீட்மேப் மறைக்கவும்",

    layer_panel_title: "ஓபன்ஸ்ட்ரீட்மேப்",
    layer_hazard_points: "அபாய புள்ளிகள்",
    layer_heatmap: "ஹீட்மேப்",
    layer_dbscan: "DBSCAN குழுக்கள்",
    layer_hotspots: "ஹாட்ஸ்பாட்கள் (Gi*)",

    form_enter_location: "இடத்தை உள்ளிடவும்",
    form_enter_disaster_type: "அபாய வகையை உள்ளிடவும்",
    form_enter_severity: "தீவிரத்தை உள்ளிடவும்",
    form_paste_photo_url: "புகைப்பட URL ஒட்டவும்",
    form_submit: "சமர்ப்பிக்கவும்",

    myposts_empty: "இன்னும் எந்த பதிவுகளும் இல்லை",
    label_disaster: "அபாயம்:",
    label_severity: "தீவிரம்:",

    footer_my_posts: "என் பதிவுகள்",
    footer_faqs: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    footer_about: "பற்றி",
    footer_settings: "அமைப்புகள்",
    language: "மொழி",

    report_title: "நிகழ்வை அறிவிக்கவும்",
    report_upload_image: "படத்தைப் பதிவேற்றவும்",
    report_city: "நகர்",
    report_short_desc: "சுருக்கமான விளக்கம்",
    report_long_desc: "விரிவான விளக்கம் (விருப்பம்)",
    report_name: "உங்கள் பெயர்",
    report_time: "நேரம்",
    report_cancel: "ரத்து",
    report_submit: "சமர்ப்பிக்கவும்",
  },
  te: {
    app_title: "సముద్ర ప్రమాదం",
    nav_home: "హోమ్",
    nav_inform: "ఘటనను నివేదించండి",
    nav_latest: "తాజా",
    nav_social_media: "సోషల్ మీడియా",
    nav_instagram: "ఇన్‌స్టాగ్రామ్",
    nav_x: "ఎక్స్",
    nav_reddit: "రెడిట్",

    latest_incidents: "ఇటీవలి సముద్ర ప్రమాద ఘటనలు",

    search_placeholder: "స్థలాన్ని వెతకండి",
    search_button: "వెతకండి",
    show_heatmap: "హీట్‌మ్యాప్ చూపించండి",
    hide_heatmap: "హీట్‌మ్యాప్ దాచండి",

    layer_panel_title: "ఓపెన్‌స్ట్రీట్‌మ్యాప్",
    layer_hazard_points: "ప్రమాద పాయింట్లు",
    layer_heatmap: "హీట్‌మ్యాప్",
    layer_dbscan: "DBSCAN క్లస్టర్లు",
    layer_hotspots: "హాట్‌స్పాట్లు (Gi*)",

    form_enter_location: "స్థలాన్ని నమోదు చేయండి",
    form_enter_disaster_type: "విపత్తు రకం నమోదు చేయండి",
    form_enter_severity: "తీవ్రత నమోదు చేయండి",
    form_paste_photo_url: "ఫోటో URL పేస్ట్ చేయండి",
    form_submit: "సమర్పించండి",

    myposts_empty: "ఇంకా ఎలాంటి పోస్టులు లేవు",
    label_disaster: "విపత్తు:",
    label_severity: "తీవ్రత:",

    footer_my_posts: "నా పోస్టులు",
    footer_faqs: "ప్రశ్నలు",
    footer_about: "గురించి",
    footer_settings: "సెట్టింగ్స్",
    language: "భాష",

    report_title: "ఘటికను నివేదించండి",
    report_upload_image: "చిత్రాన్ని అప్‌లోడ్ చేయండి",
    report_city: "నగరం",
    report_short_desc: "సంక్షిప్త వివరణ",
    report_long_desc: "వివరణాత్మక వివరణ (ఐచ్చికం)",
    report_name: "మీ పేరు",
    report_time: "సమయం",
    report_cancel: "రద్దు చేయండి",
    report_submit: "సమర్పించండి",
  },
  or: {
    app_title: "ସମୁଦ୍ର ବିପଦ",
    nav_home: "ମୂଳ ପୃଷ୍ଠା",
    nav_inform: "ଘଟଣା ରିପୋର୍ଟ କରନ୍ତୁ",
    nav_latest: "ସେଶ",
    nav_social_media: "ସୋସିଆଲ ମିଡିଆ",
    nav_instagram: "ଇନ୍ସ୍ଟାଗ୍ରାମ",
    nav_x: "ଏକ୍ସ",
    nav_reddit: "ରେଡିଟ",

    latest_incidents: "ସମୀପତମ ସମୁଦ୍ର ବିପଦ ଘଟଣା",

    search_placeholder: "ଏକ ସ୍ଥାନ ଖୋଜନ୍ତୁ",
    search_button: "ଖୋଜନ୍ତୁ",
    show_heatmap: "ହିଟମ୍ୟାପ ଦେଖାନ୍ତୁ",
    hide_heatmap: "ହିଟମ୍ୟାପ ଲୁଚାନ୍ତୁ",

    layer_panel_title: "ଓପନ୍‌ଷ୍ଟ୍ରିଟମ୍ୟାପ୍",
    layer_hazard_points: "ବିପଦ ବିନ୍ଦୁଗୁଡ଼ିକ",
    layer_heatmap: "ହିଟମ୍ୟାପ",
    layer_dbscan: "DBSCAN କ୍ଲଷ୍ଟର",
    layer_hotspots: "ହଟସ୍ପଟ୍ (Gi*)",

    form_enter_location: "ସ୍ଥାନ ଦିଅନ୍ତୁ",
    form_enter_disaster_type: "ଦୁର୍ଘଟଣା ପ୍ରକାର ଦିଅନ୍ତୁ",
    form_enter_severity: "ତୀବ୍ରତା ଦିଅନ୍ତୁ",
    form_paste_photo_url: "ଫୋଟୋ URL ପେଷ୍ଟ କରନ୍ତୁ",
    form_submit: "ସମର୍ପଣ କରନ୍ତୁ",

    myposts_empty: "ଏଯାବତ୍ କୌଣସି ପୋଷ୍ଟ ନାହିଁ",
    label_disaster: "ଦୁର୍ଘଟଣା:",
    label_severity: "ତୀବ୍ରତା:",

    footer_my_posts: "ମୋ ପୋଷ୍ଟଗୁଡ଼ିକ",
    footer_faqs: "ପ୍ରଶ୍ନୋତ୍ତର",
    footer_about: "ବିଷୟରେ",
    footer_settings: "ସେଟିଂସ",
    language: "ଭାଷା",

    report_title: "ଘଟଣା ରିପୋର୍ଟ କରନ୍ତୁ",
    report_upload_image: "ଛବି ଅପଲୋଡ୍ କରନ୍ତୁ",
    report_city: "ସହର",
    report_short_desc: "ସଂକ୍ଷିପ୍ତ ବିବରଣୀ",
    report_long_desc: "ବିସ୍ତୃତ ବିବରଣୀ (ଇଚ୍ଛାନୁସାରେ)",
    report_name: "ଆପଣଙ୍କ ନାମ",
    report_time: "ସମୟ",
    report_cancel: "ବାତିଲ୍ କରନ୍ତୁ",
    report_submit: "ସମର୍ପଣ କରନ୍ତୁ",
  },
  bn: {
    app_title: "সমুদ্র বিপদ",
    nav_home: "হোম",
    nav_inform: "ঘটনা রিপোর্ট করুন",
    nav_latest: "সর্বশেষ",
    nav_social_media: "সোশ্যাল মিডিয়া",
    nav_instagram: "ইনস্টাগ্রাম",
    nav_x: "এক্স",
    nav_reddit: "রেডিট",

    latest_incidents: "সাম্প্রতিক সমুদ্র বিপদের ঘটনা",

    search_placeholder: "স্থান খুঁজুন",
    search_button: "খুঁজুন",
    show_heatmap: "হিটম্যাপ দেখান",
    hide_heatmap: "হিটম্যাপ লুকান",

    layer_panel_title: "ওপেনস্ট্রিটম্যাপ",
    layer_hazard_points: "বিপদ পয়েন্টসমূহ",
    layer_heatmap: "হিটম্যাপ",
    layer_dbscan: "DBSCAN ক্লাস্টার",
    layer_hotspots: "হটস্পট (Gi*)",

    form_enter_location: "স্থান লিখুন",
    form_enter_disaster_type: "দুর্যোগের ধরন লিখুন",
    form_enter_severity: "তীব্রতা লিখুন",
    form_paste_photo_url: "ফটো URL পেস্ট করুন",
    form_submit: "জমা দিন",

    myposts_empty: "এখনও কোনো পোস্ট নেই",
    label_disaster: "দুর্যোগ:",
    label_severity: "তীব্রতা:",

    footer_my_posts: "আমার পোস্ট",
    footer_faqs: "প্রশ্নোত্তর",
    footer_about: "সম্পর্কে",
    footer_settings: "সেটিংস",
    language: "ভাষা",

    report_title: "ঘটনা রিপোর্ট করুন",
    report_upload_image: "ছবি আপলোড করুন",
    report_city: "শহর",
    report_short_desc: "সংক্ষিপ্ত বিবরণ",
    report_long_desc: "বিস্তারিত বিবরণ (ঐচ্ছিক)",
    report_name: "আপনার নাম",
    report_time: "সময়",
    report_cancel: "বাতিল",
    report_submit: "জমা দিন",
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
  if (c.startsWith("gu") || c === "guj") return "gu";
  if (c.startsWith("kn") || c === "kan") return "kn";
  if (c.startsWith("ml") || c === "mal") return "ml";
  if (c.startsWith("ta") || c === "tam") return "ta";
  if (c.startsWith("te") || c === "tel") return "te";
  if (c.startsWith("or") || c === "ori" || c === "od" || c === "odi") return "or";
  if (c.startsWith("bn") || c === "ben") return "bn";
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
  // Devanagari (Hindi/Marathi)
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
  // Oriya (Odia)
  if (/[\u0B00-\u0B7F]/.test(text)) return "or";
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  // Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
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