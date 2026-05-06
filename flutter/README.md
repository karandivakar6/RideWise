# RideWise Flutter - Mobile Application

A cross-platform mobile application for RideWise - the Bangalore ride aggregator that compares prices across Uber, Rapido, and Namma Yatri.

## Features

✅ **Authentication**
- Email/Password login & registration
- Password show/hide toggle
- Secure token-based authentication
- Auto-login with saved credentials

✅ **Ride Search**
- Search rides with pickup/dropoff locations
- Location picker with popular Bangalore locations
- Current location detection (GPS)
- Recent searches (limited to 3 most recent)

✅ **Price Comparison**
- Real-time pricing from Uber, Rapido, Namma Yatri
- Provider-specific pricing algorithms
- Categorized by vehicle type (Bike, Auto, Cab, Premium, XL)
- Distance and time estimates

✅ **Booking**
- QR code generation for quick booking
- Deep links to provider apps
- Share ride details

✅ **Settings**
- Sound effects toggle
- Location sharing toggle
- Auto-save searches toggle
- Multi-language support (English, Hindi, Kannada, Tamil)
- Multi-currency support (INR, USD, EUR)

## Tech Stack

- **Flutter 3.0+**
- **Dart 3.0+**
- **HTTP** - API communication
- **SharedPreferences** - Local storage
- **FlutterMap** - Map integration
- **Geolocator** - GPS location
- **QR Flutter** - QR code generation
- **URL Launcher** - Deep linking

## Setup Instructions

### Prerequisites

1. Install Flutter SDK: https://flutter.dev/docs/get-started/install
2. Install Android Studio or Xcode (for iOS)
3. Ensure backend server is running on `http://localhost:5000`

### Installation

```bash
cd flutter
flutter pub get
```

### Running the App

**Android:**
```bash
flutter run
```

**iOS:**
```bash
cd ios
pod install
cd ..
flutter run
```

**Web (for testing):**
```bash
flutter run -d chrome
```

### Building Release APK

**Android:**
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

**iOS:**
```bash
flutter build ios --release
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── screens/
│   ├── auth_screen.dart      # Login/Register
│   ├── home_screen.dart      # Main dashboard
│   ├── search_screen.dart    # Ride search
│   └── results_screen.dart   # Price comparison results
├── widgets/
│   ├── ride_card.dart        # Individual ride option card
│   └── settings_modal.dart   # Settings bottom sheet
└── utils/
    └── theme.dart            # App theme configuration
```

## API Integration

The app connects to the backend server running at `http://localhost:5000`.

**Endpoints Used:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/fares` - Get ride prices

### Localhost Connection

**Android Emulator:**
- Use `http://10.0.2.2:5000` instead of `localhost:5000`

**iOS Simulator:**
- Use `http://localhost:5000` (works directly)

**Physical Device:**
- Use your computer's IP address: `http://192.168.x.x:5000`
- Ensure device and computer are on same WiFi network

## Permissions

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS** (`ios/Runner/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to find nearby rides</string>
```

## Features to Add

- [ ] Map view with route visualization
- [ ] Real-time location tracking
- [ ] Push notifications for ride updates
- [ ] Payment gateway integration
- [ ] Ride history
- [ ] Favorites/Saved locations
- [ ] Multi-language UI translations
- [ ] Offline mode with cached data

## Troubleshooting

**Cannot connect to backend:**
- Update `baseUrl` in screens to your computer's IP
- Ensure backend server is running
- Check firewall settings

**Location not working:**
- Grant location permissions
- Enable GPS on device
- Check `Info.plist` (iOS) or `AndroidManifest.xml` (Android)

**Build errors:**
- Run `flutter clean`
- Run `flutter pub get`
- Delete `ios/Pods` and run `pod install` (iOS)

## License

MIT License - Same as main RideWise project
