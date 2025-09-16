// Coastal Indian states/UTs and coastal/near-coastal cities only
// Curated for UX selection during coastal incident reporting

export const CITIES_BY_STATE = {
  // States with coastline
  "Gujarat": [
    "Surat",
    "Valsad",
    "Navsari",
    "Bhavnagar",
    "Jamnagar",
    "Porbandar",
    "Veraval",
    "Dwarka",
    "Okha",
    "Mundra",
    "Kandla"
  ],
  "Maharashtra": [
    "Mumbai",
    "Navi Mumbai",
    "Thane",
    "Vasai-Virar",
    "Alibag",
    "Uran",
    "Panvel",
    "Ratnagiri",
    "Malvan",
    "Vengurla",
    "Dahanu"
  ],
  "Goa": [
    "Panaji",
    "Vasco da Gama",
    "Margao",
    "Mapusa",
    "Calangute",
    "Candolim",
    "Benaulim",
    "Colva",
    "Morjim",
    "Canacona"
  ],
  "Karnataka": [
    "Mangaluru",
    "Udupi",
    "Karwar",
    "Bhatkal",
    "Kundapur",
    "Kumta",
    "Honnavar",
    "Ankola",
    "Murdeshwar",
    "Byndoor"
  ],
  "Kerala": [
    "Thiruvananthapuram",
    "Kollam",
    "Varkala",
    "Alappuzha",
    "Cherthala",
    "Kochi",
    "Kozhikode",
    "Kannur",
    "Ponnani",
    "Payyannur"
  ],
  "Tamil Nadu": [
    "Chennai",
    "Ennore",
    "Mahabalipuram",
    "Cuddalore",
    "Nagapattinam",
    "Thoothukudi",
    "Rameswaram",
    "Kanyakumari",
    "Tiruchendur",
    "Colachel"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Bheemunipatnam",
    "Kakinada",
    "Amalapuram",
    "Narasapuram",
    "Machilipatnam",
    "Ongole",
    "Chirala",
    "Srikakulam",
    "Tuni"
  ],
  "Odisha": [
    "Puri",
    "Paradip",
    "Gopalpur",
    "Chandipur",
    "Dhamra",
    "Astaranga",
    "Konark",
    "Satpada",
    "Balasore",
    "Berhampur"
  ],
  "West Bengal": [
    "Digha",
    "Mandarmani",
    "Shankarpur",
    "Tajpur",
    "Haldia",
    "Diamond Harbour",
    "Bakkhali",
    "Fraserganj",
    "Kakdwip",
    "Sagar"
  ],

  // Coastal Union Territories
  "Andaman and Nicobar Islands": [
    "Port Blair",
    "Havelock Island",
    "Neil Island",
    "Rangat",
    "Mayabunder",
    "Diglipur",
    "Hut Bay",
    "Campbell Bay",
    "Car Nicobar",
    "Nancowry"
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Daman",
    "Diu"
  ],
  "Puducherry": [
    "Puducherry",
    "Karaikal",
    "Mahe",
    "Yanam"
  ],
  "Lakshadweep": [
    "Kavaratti",
    "Agatti",
    "Amini",
    "Andrott",
    "Minicoy",
    "Kalpeni",
    "Kadmat",
    "Chetlat",
    "Bitra",
    "Kiltan"
  ]
};

export function getAllCities() {
  const out = [];
  for (const key of Object.keys(CITIES_BY_STATE)) {
    out.push(...CITIES_BY_STATE[key]);
  }
  return out;
}