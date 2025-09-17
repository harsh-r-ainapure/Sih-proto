import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { 
  registerServiceWorker, 
  requestNotificationPermission, 
  initNetworkMonitoring,
  isPWA 
} from "./utils/swRegistration.js";

// Initialize PWA features
const initPWA = async () => {
  try {
    // Register service worker
    await registerServiceWorker();
    console.log('PWA: Service worker registered successfully');
    
    // Initialize network monitoring
    initNetworkMonitoring();
    
    // Request notification permission if PWA
    if (isPWA()) {
      await requestNotificationPermission();
    }
    
    // Add PWA class to body for styling
    if (isPWA()) {
      document.body.classList.add('pwa-mode');
    }
    
  } catch (error) {
    console.error('PWA: Initialization failed:', error);
  }
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Initialize PWA features after React app is mounted
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPWA);
} else {
  initPWA();
}
