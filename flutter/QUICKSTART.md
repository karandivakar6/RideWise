# RideWise Flutter - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Features Implemented ✅

**All Web App Features Now in Flutter:**

1. ✅ **Authentication** - Login/Register with password toggle
2. ✅ **Autocomplete Search** - Real-time location search with Photon API
3. ✅ **Recent Searches** - Shows last 3 searches (auto-save can be disabled)
4. ✅ **Sound Effects** - Haptic feedback on actions (can be disabled)
5. ✅ **Translations** - 4 languages (English, Hindi, Kannada, Tamil)
6. ✅ **Currency Conversion** - INR, USD, EUR with real rates
7. ✅ **Location Sharing** - Toggle in settings
8. ✅ **Settings Persistence** - All settings saved locally
9. ✅ **Price Comparison** - Real-time from backend with traffic
10. ✅ **QR Codes** - Book rides via QR
11. ✅ **Dark Theme** - Matches web app design

### Step 1: Prerequisites

Make sure you have:
- ✅ Flutter SDK installed (https://flutter.dev)
- ✅ Android Studio or Xcode (for emulators)
- ✅ RideWise backend running on port 5000

Check Flutter installation:
```bash
flutter doctor
```

### Step 2: Install Dependencies

```bash
cd flutter
flutter pub get
```

### Step 3: Start Backend Server

In a separate terminal:
```bash
cd backend
npm start
```

Make sure it's running on `http://localhost:5000`

### Step 4: Update Base URL (For Physical Devices)

If testing on a physical device, update the `baseUrl` in these files:

**lib/screens/auth_screen.dart:**
```dart
final String baseUrl = 'http://YOUR_COMPUTER_IP:5000';  // e.g., http://192.168.1.10:5000
```

**lib/screens/search_screen.dart:**
```dart
final String baseUrl = 'http://YOUR_COMPUTER_IP:5000';
```

**For Android Emulator:**
```dart
final String baseUrl = 'http://10.0.2.2:5000';
```

**For iOS Simulator:**
```dart
final String baseUrl = 'http://localhost:5000';  // Works as-is
```

### Step 5: Run the App

**On Android Emulator/Device:**
```bash
flutter run
```

**On iOS Simulator:**
```bash
flutter run
```

**On Chrome (for quick testing):**
```bash
flutter run -d chrome
```

### Step 6: Test the App

1. **Register/Login**: Create account or login
2. **Search Rides**: Click "SEARCH RIDES"
3. **Select Locations**: Choose pickup and dropoff
4. **Compare Prices**: View prices from all providers
5. **Book**: Tap a ride to see QR code or open app

## 📱 Building Release APK

### Android

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

Install on device:
```bash
flutter install
```

### iOS

```bash
flutter build ios --release
```

Then open in Xcode to submit to App Store.

## 🐛 Common Issues

### 1. Cannot connect to backend

**Problem**: App shows "Cannot connect to server"

**Solution**:
- Check backend is running (`npm start`)
- Update `baseUrl` to your computer's IP
- Ensure device and computer on same WiFi
- Check firewall settings

### 2. Location not working

**Problem**: Cannot get current location

**Solution**:
- Grant location permission in app settings
- Enable GPS on device
- Check `AndroidManifest.xml` / `Info.plist` has location permissions

### 3. Build fails

**Problem**: Gradle/CocoaPods errors

**Solution**:
```bash
flutter clean
flutter pub get

# For iOS only:
cd ios
pod install
pod update
cd ..
```

### 4. Hot reload not working

**Problem**: Changes not reflecting

**Solution**:
- Press `r` in terminal for hot reload
- Press `R` for hot restart
- Stop and run again if needed

## 🎯 Key Features to Test

- ✅ Login with password show/hide toggle
- ✅ Recent searches (shows 3 most recent)
- ✅ Price comparison across providers
- ✅ QR code generation for booking
- ✅ Settings (sound, location, language, currency)
- ✅ Deep linking to provider apps

## 📦 Project Structure

```
flutter/
├── lib/
│   ├── main.dart                 # App entry
│   ├── screens/                  # All screens
│   │   ├── auth_screen.dart      # Login/Register
│   │   ├── home_screen.dart      # Dashboard
│   │   ├── search_screen.dart    # Search form
│   │   └── results_screen.dart   # Price results
│   ├── widgets/                  # Reusable widgets
│   │   ├── ride_card.dart        # Ride option card
│   │   └── settings_modal.dart   # Settings
│   └── utils/
│       └── theme.dart            # App theme
├── android/                      # Android config
├── ios/                          # iOS config
├── pubspec.yaml                  # Dependencies
└── README.md                     # Full docs
```

## 🔧 Customization

### Change App Name

**pubspec.yaml:**
```yaml
name: your_app_name
```

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<application android:label="Your App Name">
```

**iOS** (`ios/Runner/Info.plist`):
```xml
<key>CFBundleDisplayName</key>
<string>Your App Name</string>
```

### Change App Icon

Replace images in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/`

Or use: https://pub.dev/packages/flutter_launcher_icons

### Change Theme Colors

Edit `lib/utils/theme.dart`:
```dart
primaryColor: Colors.teal,  // Change to your color
```

## 📞 Support

- Check [README.md](README.md) for full documentation
- Backend API: http://localhost:5000
- Test with Postman to verify backend works

## 🎉 Next Steps

Once the app is working:

1. **Add Real Maps**: Integrate Google Maps for route visualization
2. **Add Payments**: Integrate payment gateway
3. **Add History**: Show past rides
4. **Add Notifications**: Push notifications for ride updates
5. **Optimize**: Profile and optimize performance
6. **Deploy**: Publish to Google Play / App Store

Happy Coding! 🚀
