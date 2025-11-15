# Accessibility Color System - Standalone

A fully dynamic, accessible color customization system that allows users to choose any color from a round color wheel, with full color-blind support and persistence.

## Features

- **Round Color Wheel UI**: Interactive HSV/HSL color picker with draggable selector
- **Brightness/Saturation Control**: Vertical slider for adjusting brightness
- **Global Website Recoloring**: Instantly updates all website colors via CSS variables
- **Color-Blind Support**: Optional filters for protanopia, deuteranopia, and tritanopia
- **Persistence**: Saves settings to localStorage and restores on page reload
- **Fully Responsive**: Works on all screen sizes
- **No Dependencies**: Pure vanilla JavaScript

## Quick Start

### Option 1: Include in HTML

Add these lines to your HTML `<head>` and before closing `</body>`:

```html
<head>
  <!-- Add this in your <head> -->
  <link rel="stylesheet" href="accessibility-color-system.css">
</head>
<body>
  <!-- Your content -->
  
  <!-- Add this before closing </body> -->
  <script src="accessibility-color-system.js"></script>
</body>
```

### Option 2: Use CDN (if hosted)

```html
<link rel="stylesheet" href="https://your-domain.com/accessibility-color-system.css">
<script src="https://your-domain.com/accessibility-color-system.js"></script>
```

## CSS Variables

The system uses the following CSS variables that are dynamically updated:

- `--primary`: Primary accent color
- `--accent`: Complementary accent color
- `--background`: Main background color
- `--text`: Main text color
- `--background-secondary`: Secondary background color
- `--border`: Border color

### Using the Variables in Your CSS

```css
.my-element {
  background-color: var(--primary);
  color: var(--text);
  border: 1px solid var(--border);
}

.my-button {
  background: var(--primary);
  color: white;
}

.my-button:hover {
  background: var(--accent);
}
```

## Color-Blind Filters

The system includes three color-blind simulation filters:

1. **Protanopia**: Red-green color blindness (red cone missing)
2. **Deuteranopia**: Red-green color blindness (green cone missing)
3. **Tritanopia**: Blue-yellow color blindness

These filters are applied using CSS filters and provide real-time preview of how the website appears to users with color vision deficiencies.

## JavaScript API

The system exposes a global `window.accessibilityColorSystem` object:

```javascript
// Set color-blind filter
window.accessibilityColorSystem.setFilter('protanopia');

// Reset to default colors
window.accessibilityColorSystem.reset();

// Get current state
const state = window.accessibilityColorSystem.getState();
console.log(state); // { hue: 210, saturation: 100, brightness: 50, colorBlindFilter: 'none' }

// Set custom state
window.accessibilityColorSystem.setState({
  hue: 120,
  saturation: 80,
  brightness: 60,
  colorBlindFilter: 'none'
});
```

## Persistence

Settings are automatically saved to `localStorage` with the key `accessibility-color-settings`. The saved data includes:

```json
{
  "hue": 210,
  "saturation": 100,
  "brightness": 50,
  "colorBlindFilter": "none"
}
```

## Customization

### Changing Default Colors

Edit the `DEFAULT_STATE` object in `accessibility-color-system.js`:

```javascript
const DEFAULT_STATE = {
  hue: 210,        // Default hue (0-360)
  saturation: 100, // Default saturation (0-100)
  brightness: 50,  // Default brightness (0-100)
  colorBlindFilter: 'none'
};
```

### Styling the Button

Modify `.accessibility-color-btn` in `accessibility-color-system.css`:

```css
.accessibility-color-btn {
  bottom: 2rem;    /* Distance from bottom */
  right: 2rem;     /* Distance from right */
  /* Add your custom styles */
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Custom Properties (CSS Variables) required
- localStorage required for persistence
- CSS Filters required for color-blind simulation

## Accessibility Features

- **Keyboard Navigation**: All controls are keyboard accessible
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Focus Indicators**: Clear focus states for all interactive elements
- **Screen Reader Support**: All controls are properly labeled

## Troubleshooting

### Colors Not Updating

1. Check that CSS variables are being used in your styles
2. Verify that the script is loaded correctly
3. Check browser console for JavaScript errors

### Color-Blind Filter Not Working

1. Verify browser support for CSS filters
2. Check that the SVG filter data URLs are properly formatted
3. Try a different filter type to isolate the issue

### Settings Not Persisting

1. Check that localStorage is enabled in the browser
2. Verify the STORAGE_KEY constant matches
3. Check browser console for storage errors

## License

This accessibility color system is available for use in any project.

