# Provider Logos for Flutter App

## How to Add Provider Logos

To add actual provider logos to the Flutter app:

1. **Download official logos** from:
   - **Rapido**: Visit rapido.bike or search for their logo
   - **Uber**: Visit uber.com/brand for official assets
   - **Namma Yatri**: Visit nammayatri.in for their logo

2. **Prepare the images**:
   - Format: PNG with transparent background
   - Size: 200x200 pixels recommended (or any square size)
   - Save as:
     - `rapido.png`
     - `uber.png`
     - `namma_yatri.png`

3. **Place files in this directory**:
   ```
   flutter/assets/images/logos/
   ├── rapido.png
   ├── uber.png
   └── namma_yatri.png
   ```

4. **Rebuild the app** - The logos will appear automatically!

## Notes
- The app currently shows icon placeholders until you add the logo files
- Logo files are referenced in `pubspec.yaml` under assets
- If logos don't appear, run `flutter clean` and rebuild

