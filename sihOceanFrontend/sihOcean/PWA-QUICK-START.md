# 🚀 PWA Quick Start Guide

## Testing Your Ocean Hazard PWA

### 1. Development Testing
```bash
cd sihOceanFrontend/sihOcean
npm run dev
```
- Open `http://localhost:3000`
- PWA features are enabled in development mode

### 2. Production Testing
```bash
npm run build
npm run preview
```
- Open the preview URL (usually `http://localhost:4173`)
- Test full PWA functionality

### 3. Mobile Testing
1. **Access from mobile device**:
   - Connect to the same network
   - Visit `http://[your-ip]:3000` (dev) or `http://[your-ip]:4173` (preview)
   
2. **Install on mobile**:
   - **Android**: Tap "Add to Home Screen" banner
   - **iOS**: Safari → Share → "Add to Home Screen"

### 4. PWA Features to Test

#### ✅ Installation
- Look for install prompt/banner
- Test "Add to Home Screen" functionality
- Verify app opens in standalone mode

#### ✅ Offline Functionality
1. Open the app
2. Turn off internet/WiFi
3. Navigate the app - should work offline
4. Submit a form - will sync when online
5. Visit `/offline.html` directly

#### ✅ Service Worker
1. Open Chrome DevTools → Application → Service Workers
2. Verify service worker is registered and active
3. Check Cache Storage for cached resources

#### ✅ Manifest
1. Chrome DevTools → Application → Manifest
2. Verify all manifest properties are loaded
3. Check icons and theme colors

### 5. Browser Testing

#### Chrome/Edge (Recommended)
- Full PWA support
- Install prompt available
- Best testing experience

#### Safari (iOS/macOS)
- Add to Home Screen supported
- Limited install prompt
- Good offline support

#### Firefox
- Basic PWA support
- Some features may be limited

### 6. PWA Audit
1. Open Chrome DevTools → Lighthouse
2. Run audit with "Progressive Web App" checked
3. Aim for 90+ PWA score

### 7. Common Test Scenarios

#### Scenario 1: First-time visitor
1. Visit the app
2. Browse around
3. Look for install banner
4. Install the app
5. Launch from home screen

#### Scenario 2: Offline usage
1. Visit the app while online
2. Browse to cache content
3. Go offline
4. Test app functionality
5. Try submitting forms
6. Go back online and verify sync

#### Scenario 3: Update testing
1. Make a small change to the app
2. Build and deploy
3. Visit the app
4. Look for update notification
5. Refresh to get new version

### 8. Troubleshooting

#### Install prompt not showing?
- Check if already installed
- Verify HTTPS (or localhost)
- Clear browser data
- Check console for errors

#### Service worker not working?
- Hard refresh (Ctrl+Shift+R)
- Clear cache and storage
- Check browser console
- Verify service worker scope

#### Offline mode not working?
- Visit app while online first
- Check cache in DevTools
- Test with slow 3G throttling
- Verify service worker is active

### 9. Production Deployment

When deploying to production:
1. Ensure HTTPS is enabled
2. Update start_url in manifest
3. Test on real mobile devices
4. Monitor service worker logs
5. Set up analytics for PWA events

### 🎯 Success Criteria

Your PWA is working correctly if:
- ✅ Lighthouse PWA score > 90
- ✅ Installs on mobile devices
- ✅ Works offline with cached content
- ✅ Shows install prompt on desktop
- ✅ Service worker registers successfully
- ✅ Updates notify users properly
- ✅ Icons display correctly on home screen

---

*For detailed technical documentation, see PWA-README.md*

