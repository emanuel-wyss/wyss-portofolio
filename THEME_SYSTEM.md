# Theme System Documentation

## Overview

Wyss.rocks features a **cutting-edge, dynamic theme system** that automatically adapts colors, animations, and visual effects based on:

- **Current Season** (Spring, Summer, Autumn, Winter)
- **Simulated Weather** (Sunny, Cloudy, Rainy, Foggy, Stormy, Windy, Snowy)
- **Special Events** (Christmas, Easter, Halloween, New Year, Valentine's Day)
- **Time of Day** (Daytime or Nighttime)

The theme system uses **CSS custom properties** (variables) and **cutting-edge CSS features** including:
- CSS `@property` for animated variables
- `backdrop-filter` for glass morphism effects
- `filter` functions for dynamic effects
- Advanced keyframe animations
- Radial and linear gradients
- `filter: hue-rotate()` for color shifts

---

## Theme Features

### 🎨 Color Palette System

Each weather-season combination has a carefully curated color palette:

```typescript
// Example: Sunny Summer
{
  '--primary': '#FFA500',           // Main accent (orange)
  '--primary-light': '#FFE4B5',     // Light variant
  '--accent': '#00CED1',            // Secondary accent (cyan)
  '--accent-light': '#E0FFFF',      // Light secondary
  '--bg-primary': '#0a0e27',        // Dark background
  '--bg-secondary': '#1a1f3a',      // Secondary background
  '--text-primary': '#FFFACD',      // Primary text
  '--text-secondary': '#B8D8E8',    // Secondary text
  '--season-color-1': '#FF6347',    // Season-specific colors
  '--season-color-2': '#00CED1',
  '--season-color-3': '#32CD32',
}
```

### ✨ Animated Visual Effects

Each weather condition has unique animations:

**Sunny**
- Glowing sun effect with pulsing brightness
- Warm, energetic color palette
- High animation intensity

**Cloudy**
- Drifting cloud overlays
- Muted colors and reduced saturation
- Softer animations

**Rainy**
- Vertical rain drop patterns
- Cool blue color palette
- Moderate animation intensity
- Increased blur effect

**Foggy**
- Drifting fog layers
- Muted, desaturated colors
- Heavy blur (8-12px)
- Particle count up to 50

**Stormy**
- Lightning flash effects with brightness spikes
- Dark, intense colors
- High animation intensity (1.3-1.4)
- Lightning strikes every 8 seconds

**Windy**
- Leaf/debris swaying animations
- Subtle page translation
- Color-shifting wind effects
- Increased wind strength variable (2-2.5)

**Snowy**
- Falling snow particles
- Soft, cool color palette
- High particle count (50-60)
- Increased blur and shadow

### 🎉 Special Events

Automatic theme adjustments for special occasions:

| Event | Dates | Colors |
|-------|-------|--------|
| **Christmas** | Dec 20-31 | Red/Green/Gold with 80 particles |
| **New Year** | Jan 1-3 | Gold/Cyan/Pink with 100 particles |
| **Easter** | Apr 8-22 | Pastel Pink/Blue/Green |
| **Valentine's Day** | Feb 10-20 | Pink/Red/Magenta |
| **Halloween** | Oct 20-31 | Orange/Purple/Black |

---

## Technical Implementation

### CSS Custom Properties (Variables)

All theming is done through CSS variables, making it:
- **Fast**: GPU-accelerated
- **Responsive**: Changes apply instantly
- **Composable**: Variables can reference other variables
- **Efficient**: No JavaScript recalculations

```css
:root {
  --primary: #0066ff;
  --primary-light: #e6f0ff;
  --accent: #ff0066;
  /* ... 20+ more variables */
  
  /* Animation controls */
  --animation-intensity: 0.8;
  --particle-count: 15;
  --blur-amount: 0px;
  --shadow-intensity: 0.3;
  --wind-strength: 1;
}
```

### @property Declarations

Custom properties with type validation:

```css
@property --particle-opacity {
  syntax: '<number>';
  initial-value: 0;
  inherits: true;
}

@property --particle-y {
  syntax: '<length>';
  initial-value: 0px;
  inherits: true;
}
```

This enables **smooth animations** of CSS variables (not possible with regular variables).

### Cutting-Edge CSS Features

1. **backdrop-filter**
   ```css
   backdrop-filter: blur(var(--blur-amount));
   ```

2. **filter() functions**
   ```css
   filter: brightness(1.1) drop-shadow(0 0 30px var(--particle-color));
   ```

3. **radial-gradient() with multiple layers**
   ```css
   background: 
     radial-gradient(circle at 20% 50%, var(--primary-light) 0%, transparent 50%),
     radial-gradient(circle at 80% 20%, var(--accent-light) 0%, transparent 30%);
   ```

4. **cubic-bezier animations**
   ```css
   transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
   ```

5. **calc() with custom properties**
   ```css
   opacity: calc(0.05 * var(--animation-intensity));
   ```

---

## Usage

### Automatic Theme Detection

The theme system **automatically detects** and applies the current theme based on:
- System time (season detection)
- Date (special events)
- Hour of day (daytime vs nighttime)

No user action required!

### Manual Weather Override

Users can manually select a weather type using the **weather selector widget** (top-right corner):

```html
<select id="weather-toggle">
  <option value="">Auto (System)</option>
  <option value="sunny">☀️ Sunny</option>
  <option value="cloudy">☁️ Cloudy</option>
  <option value="rainy">🌧️ Rainy</option>
  <!-- ... more options -->
</select>
```

The selection is **persisted in localStorage**, so the user's preference is remembered.

### Programmatic Control

```typescript
import { setWeather, getThemeConfig, applyTheme } from '@/lib/theme';

// Set specific weather
setWeather('rainy');

// Get current theme config
const config = getThemeConfig();
console.log(config.weather, config.season, config.specialEvent);

// Apply custom theme variables
applyTheme({
  '--primary': '#FF0000',
  '--accent': '#00FF00',
});
```

---

## Extending the Theme System

### Adding a New Weather Type

1. **Add to `WeatherType` union**:
```typescript
export type WeatherType = 
  | 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'stormy' | 'windy' | 'snowy'
  | 'YOUR_NEW_WEATHER';  // <- Add here
```

2. **Add theme definitions in THEMES**:
```typescript
const THEMES: Record<WeatherType, Record<SeasonType, Partial<ThemeVariables>>> = {
  // ... existing themes
  your_new_weather: {
    spring: {
      '--primary': '#FF0000',
      '--accent': '#00FF00',
      // ... complete all variables
    },
    summer: { /* ... */ },
    autumn: { /* ... */ },
    winter: { /* ... */ },
  },
};
```

3. **Add CSS animation in `theme-animations.css`**:
```css
.weather-your-new-weather::before {
  animation: yourNewAnimation 3s ease-in-out infinite;
}

@keyframes yourNewAnimation {
  0% { /* start state */ }
  100% { /* end state */ }
}
```

4. **Add to weather selector**:
```html
<option value="your-new-weather">🎨 Your New Weather</option>
```

### Adding a Special Event

1. **Add to `SpecialEventType` union**:
```typescript
export type SpecialEventType = 
  | 'christmas' | 'easter' | 'halloween' | 'newyear' | 'valentines'
  | 'YOUR_EVENT';  // <- Add here
```

2. **Add theme in `SPECIAL_THEMES`**:
```typescript
const SPECIAL_THEMES: Record<SpecialEventType, Partial<ThemeVariables>> = {
  // ... existing themes
  your_event: {
    '--primary': '#FF00FF',
    '--accent': '#00FFFF',
    '--particle-count': '100',
    '--animation-intensity': '1.5',
  },
};
```

3. **Update event detection in `getCurrentSpecialEvent()`**:
```typescript
export function getCurrentSpecialEvent(): SpecialEventType | undefined {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // ... existing checks
  
  // Your Event (May 15-20)
  if (month === 5 && day >= 15 && day <= 20) return 'your_event';

  return undefined;
}
```

---

## Performance Considerations

### Optimizations

1. **GPU Acceleration**
   - CSS variables avoid JavaScript recalculations
   - `backdrop-filter` and `filter` use hardware acceleration
   - Transitions use `will-change` hints

2. **Reduced Motion Support**
   - Respects `prefers-reduced-motion` media query
   - Disables particle animations for users who prefer it
   - Sets animation intensity to 0.1

3. **Lazy Loading**
   - Animations only run on visible elements
   - Particle system uses CSS patterns (not DOM elements)
   - No JavaScript in animation loops

### Browser Support

**Full support** for:
- Chrome 85+
- Firefox 78+
- Safari 16+
- Edge 85+

**Graceful fallbacks** for older browsers (theme applies without animations).

---

## Customization Examples

### Reducing Animation Intensity

```css
:root {
  --animation-intensity: 0.5;  /* 50% speed */
}
```

### Changing Particle Count

```typescript
// In getThemeVariables()
{
  '--particle-count': '30',  // More particles
}
```

### Custom Weather-Specific Blur

```typescript
{
  '--blur-amount': '2px',  // Slight blur
}
```

### Seasonal Color Override

```typescript
const THEMES = {
  rainy: {
    spring: {
      // Base rainy spring theme
      ...baseTheme,
      
      // Custom overrides
      '--primary': '#MY_CUSTOM_BLUE',
    }
  }
}
```

---

## Testing the Theme System

### Local Testing

1. **Open browser DevTools**
2. **Go to Console tab**
3. **Try these commands**:

```javascript
// Import theme utilities (if exported)
import { setWeather, getThemeConfig } from '@/lib/theme.ts';

// Change weather
document.getElementById('weather-toggle').value = 'rainy';
document.getElementById('weather-toggle').dispatchEvent(new Event('change'));

// Check current config
console.log(getThemeConfig());

// Manually apply theme
document.documentElement.style.setProperty('--particle-count', '100');
```

### Testing Special Events

Edit `getCurrentSpecialEvent()` to force test dates:

```typescript
export function getCurrentSpecialEvent(): SpecialEventType | undefined {
  // For testing, force a date
  const testDate = new Date('2024-12-25');  // Christmas
  const month = testDate.getMonth() + 1;
  const day = testDate.getDate();

  // ... rest of function
}
```

---

## Future Enhancements

Potential extensions:

- [ ] **Real Weather API Integration** - Use OpenWeather API for actual location-based weather
- [ ] **Time-of-Day Awareness** - Auto-adjust brightness based on sunset/sunrise
- [ ] **User Preferences** - Save favorite theme combinations
- [ ] **Accessibility Controls** - High contrast mode, color blind modes
- [ ] **Theme Animations Preview** - Showcase all weather variants
- [ ] **Theme Editor UI** - Drag-and-drop color customization
- [ ] **Seasonal Transitions** - Smooth blending between seasons
- [ ] **3D Particle System** - WebGL-based advanced particles

---

## Browser DevTools Debugging

### View Current CSS Variables

```javascript
// In DevTools Console
const styles = getComputedStyle(document.documentElement);
console.log(styles.getPropertyValue('--primary'));
console.log(styles.getPropertyValue('--particle-count'));
```

### Force Specific Weather

```javascript
// Temporarily force a weather state
document.documentElement.classList.add('weather-stormy');
document.documentElement.style.setProperty('--animation-intensity', '1.4');
```

### Check Animation Performance

```javascript
// Use Performance API
performance.mark('animation-start');
// ... let animation run
performance.mark('animation-end');
performance.measure('animation', 'animation-start', 'animation-end');
```

---

## Summary

The theme system is a comprehensive, performant, and beautiful implementation of **dynamic, context-aware theming** using modern CSS and minimal JavaScript. It's:

✅ **Automatic** - Detects season, date, and time  
✅ **Customizable** - User can override with weather selector  
✅ **Extensible** - Easy to add new weathers and events  
✅ **Performant** - Uses GPU acceleration, respects prefers-reduced-motion  
✅ **Accessible** - Proper color contrast, reduced motion support  
✅ **Beautiful** - Cutting-edge CSS effects that delight  

Enjoy your dynamic, weather-themed portfolio! 🌈
