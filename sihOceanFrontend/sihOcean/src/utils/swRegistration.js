// Service Worker Registration Utility
// This file handles PWA service worker registration and management

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      console.log('PWA: Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('PWA: Service worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('PWA: New service worker found, installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('PWA: New content available, refresh to update');
              showUpdateNotification();
            } else {
              // Content is cached for the first time
              console.log('PWA: Content cached for offline use');
              showOfflineReadyNotification();
            }
          }
        });
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('PWA: Message from service worker:', event.data);
        
        if (event.data.type === 'CACHE_UPDATED') {
          showUpdateNotification();
        }
      });

      // Check for waiting service worker
      if (registration.waiting) {
        showUpdateNotification();
      }

      return registration;
    } catch (error) {
      console.error('PWA: Service worker registration failed:', error);
      throw error;
    }
  } else {
    console.log('PWA: Service workers not supported in this browser');
    throw new Error('Service workers not supported');
  }
};

// Show notification when app is ready for offline use
const showOfflineReadyNotification = () => {
  if (window.showToast) {
    window.showToast('App is ready for offline use!', 'success');
  } else {
    console.log('PWA: App is ready for offline use!');
  }
};

// Show notification when new content is available
const showUpdateNotification = () => {
  if (window.showToast) {
    window.showToast('New version available! Refresh to update.', 'info');
  } else {
    // Fallback: show browser notification
    if (Notification.permission === 'granted') {
      new Notification('Ocean Hazard Update', {
        body: 'New version available! Refresh to update.',
        icon: '/icons/icon-192x192.png'
      });
    }
    console.log('PWA: New version available! Refresh to update.');
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      console.log('PWA: Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('PWA: Failed to request notification permission:', error);
      return false;
    }
  }
  return false;
};

// Check if app is running as PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Install prompt handling
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA: Install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button/banner
  showInstallBanner();
});

export const showInstallPrompt = async () => {
  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      deferredPrompt = null;
      hideInstallBanner();
    } catch (error) {
      console.error('PWA: Failed to show install prompt:', error);
    }
  }
};

const showInstallBanner = () => {
  // Create a simple install banner
  if (!document.getElementById('pwa-install-banner')) {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(45deg, #0077be, #87CEEB);
        color: white;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div>
          <strong>Install Ocean Hazard</strong><br>
          <small>Add to home screen for quick access</small>
        </div>
        <div>
          <button onclick="window.installPWA()" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            margin-right: 10px;
            cursor: pointer;
          ">Install</button>
          <button onclick="window.dismissInstallBanner()" style="
            background: transparent;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
          ">×</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }
};

const hideInstallBanner = () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.remove();
  }
};

// Global functions for install banner
window.installPWA = showInstallPrompt;
window.dismissInstallBanner = hideInstallBanner;

// Handle app installed event
window.addEventListener('appinstalled', (e) => {
  console.log('PWA: App was installed successfully');
  hideInstallBanner();
  
  // Track install event if analytics is available
  if (window.gtag) {
    window.gtag('event', 'pwa_installed', {
      event_category: 'engagement',
      event_label: 'PWA Installation'
    });
  }
});

// Network status monitoring
export const initNetworkMonitoring = () => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    console.log('PWA: Network status:', isOnline ? 'online' : 'offline');
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
      detail: { isOnline }
    }));
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  // Initial status
  updateNetworkStatus();
};

