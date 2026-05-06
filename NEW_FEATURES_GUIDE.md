# RideWise - New Features Guide 🚀

This guide explains how to use the new features added to RideWise.

## 📍 Feature 1: Favorite Locations

Save your frequently visited locations (Home, Work, Gym, etc.) for quick access!

### How to Add Favorites:

#### Web App:
1. **Search for a location** in the pickup or dropoff field
2. **Look for the ⭐ star icon** next to each search result
3. **Click the star** and enter a label (e.g., "Home", "Work", "Gym")
4. The location is now saved!

#### Mobile App:
1. **Search for a location** in either field
2. **Tap the star icon (⭐)** next to any search result
3. **Enter a label** when prompted
4. Done! Your favorite is saved.

### How to Use Favorites:

- **Web**: Click on a favorite chip and choose "Pickup" or "Dropoff"
- **Mobile**: Tap a favorite chip and select whether to use it as pickup or dropoff

### How to Remove Favorites:

- **Web**: Hover over a favorite and click the ❌ that appears
- **Mobile**: Long-press a favorite and confirm removal

### Tips:
- Use descriptive labels: "Home", "Office", "Mom's House", "Gym", etc.
- The app automatically suggests icons based on your label
- You can save unlimited favorite locations

---

## 🎨 Feature 2: Provider Logos

Real provider logos now appear on ride cards instead of generic icons!

### Current Status:

**Web App**: ✅ Placeholder logos are working!
- Rapido: Yellow badge with "R"
- Uber: Black badge with "U"  
- Namma Yatri: Purple badge with "NY"

**Mobile App**: Icons will show until you add logo files

### How to Add Real Logos:

#### For Web App:
Logo files are located in: `frontend/public/logos/`

To replace placeholders:
1. Download official logos from provider websites
2. Save as SVG or PNG format (200x200px recommended)
3. Name them: `rapido.svg`, `uber.svg`, `namma_yatri.svg`
4. Place in `frontend/public/logos/` directory
5. Refresh browser - done!

#### For Mobile App:
Logo files go in: `flutter/assets/images/logos/`

To add logos:
1. Download official logos as PNG files
2. Save as: `rapido.png`, `uber.png`, `namma_yatri.png`
3. Place in `flutter/assets/images/logos/` directory
4. Run `flutter clean` and rebuild app

### Where to Get Logos:

- **Rapido**: rapido.bike (footer or about page)
- **Uber**: uber.com/brand (official brand assets)
- **Namma Yatri**: nammayatri.in (header/footer)

Or search "[Provider Name] logo PNG transparent" on Google Images.

---

## 🔍 Quick Troubleshooting

### "I don't see the favorites section"
- It's always visible now! Look below the "Find Rides" button
- If you haven't added favorites yet, you'll see instructions on how to add them

### "The star icons are hard to see"
- They're ⭐ bright yellow/gold color
- Located on the right side of each search suggestion
- Larger now (18px) and easier to click

### "Logos aren't showing"
- **Web**: Check `frontend/public/logos/` for SVG files
- **Mobile**: Check `flutter/assets/images/logos/` for PNG files  
- Make sure files are named exactly: `rapido.svg`, `uber.svg`, `namma_yatri.svg`
- Web app has working placeholder logos!

### "How do I search for locations?"
1. Click in the pickup or dropoff field
2. Type at least 2 characters
3. Wait for suggestions to appear
4. Click a suggestion to select it
5. Click the ⭐ star to save as favorite

---

## 🎯 Examples

### Example: Adding "Home" as Favorite
1. Type your home address in pickup field
2. Select it from the dropdown
3. Click the ⭐ star icon next to your address
4. Type "Home" when prompted
5. Now you can quickly select "Home" anytime!

### Example: Using Favorites for Quick Search
1. Want to go home? Click the "Home" favorite chip
2. Choose "Dropoff" when prompted
3. Enter your current location or another favorite as pickup
4. Click "Find Rides"!

---

**Need help?** Check the README files in the logos directories for more details!
