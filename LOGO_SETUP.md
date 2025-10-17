# Adding Your Tree n Turf Logo

To display your company logo on the splash screen:

## Steps:

1. **Get your logo file** (PNG or SVG format recommended)
   - Transparent background works best
   - Recommended size: 500x500px or larger

2. **Save it to the public folder**:
   ```
   public/images/tree-n-turf-logo.png
   ```

3. **The splash screen will automatically display it!**

## Customizing the Green Color:

The splash screen uses `#2d5016` as the background color. To change it:

1. Open `src/components/SplashScreen.tsx`
2. Find the line:
   ```typescript
   backgroundColor: '#2d5016', // Tree n Turf green
   ```
3. Replace `#2d5016` with your brand's green color code

## Common Green Shades:
- Forest Green: `#228B22`
- Dark Green: `#006400`
- Lime Green: `#32CD32`
- Olive Green: `#556B2F`
- Hunter Green: `#355E3B`

## Testing:

1. Log out of the app
2. The splash screen should appear with your logo
3. Tap anywhere to proceed to login

## Logo Not Showing?

If your logo doesn't appear:
1. Make sure the file is named exactly: `tree-n-turf-logo.png`
2. Make sure it's in the `public/images/` folder
3. Refresh the browser (Ctrl+F5)
4. Check the browser console for errors
