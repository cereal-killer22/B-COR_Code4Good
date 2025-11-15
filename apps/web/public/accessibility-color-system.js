/**
 * Accessibility Color System - Standalone JavaScript
 * Drop this into any website for full color customization
 * No dependencies required - pure vanilla JavaScript
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'accessibility-color-settings';
  
  // Default state
  const DEFAULT_STATE = {
    hue: 210,
    saturation: 100,
    brightness: 50,
    colorBlindFilter: 'none'
  };

  // Current state
  let colorState = { ...DEFAULT_STATE };
  let isDragging = false;
  let isDraggingSlider = false;
  let isOpen = false;

  // DOM Elements (will be created)
  let btn, overlay, panel, wheel, selector, slider, sliderHandle, sliderTrack;
  let previewBox, hueDisplay, saturationDisplay, brightnessDisplay;

  // HSV to RGB conversion
  function hsvToRgb(h, s, v) {
    h = h % 360;
    s = s / 100;
    v = v / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  // RGB to Hex
  function rgbToHex(rgb) {
    return '#' + rgb.map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // Apply colors to CSS variables
  function applyColors(state) {
    const root = document.documentElement;
    const { hue, saturation, brightness, colorBlindFilter } = state;

    // Generate primary color from HSV
    const primaryColor = hsvToRgb(hue, saturation, brightness);
    const primaryHex = rgbToHex(primaryColor);

    // Generate complementary accent color
    const accentHue = (hue + 180) % 360;
    const accentColor = hsvToRgb(accentHue, saturation, brightness);
    const accentHex = rgbToHex(accentColor);

    // Generate background (lighter/darker based on brightness)
    const bgBrightness = brightness > 50 ? 95 : 10;
    const bgColor = hsvToRgb(hue, Math.min(saturation / 3, 30), bgBrightness);
    const bgHex = rgbToHex(bgColor);

    // Generate text color (opposite of background)
    const textBrightness = brightness > 50 ? 10 : 95;
    const textColor = hsvToRgb(hue, Math.min(saturation / 2, 20), textBrightness);
    const textHex = rgbToHex(textColor);

    // Generate secondary background
    const secondaryBgBrightness = brightness > 50 ? 90 : 20;
    const secondaryBgColor = hsvToRgb(hue, Math.min(saturation / 4, 25), secondaryBgBrightness);
    const secondaryBgHex = rgbToHex(secondaryBgColor);

    // Generate border color
    const borderBrightness = brightness > 50 ? 80 : 40;
    const borderColor = hsvToRgb(hue, Math.min(saturation / 2, 30), borderBrightness);
    const borderHex = rgbToHex(borderColor);

    // Apply CSS variables
    root.style.setProperty('--primary', primaryHex);
    root.style.setProperty('--accent', accentHex);
    root.style.setProperty('--background', bgHex);
    root.style.setProperty('--text', textHex);
    root.style.setProperty('--background-secondary', secondaryBgHex);
    root.style.setProperty('--border', borderHex);

    // Apply color-blind filter
    applyColorBlindFilter(colorBlindFilter);

    // Update UI
    updateUI();
  }

  // Apply color-blind filter
  function applyColorBlindFilter(filter) {
    const root = document.documentElement;
    root.setAttribute('data-color-blind', filter);

    // Remove existing filter
    root.style.filter = '';

    if (filter !== 'none') {
      const filterValue = getColorBlindFilterCSS(filter);
      root.style.filter = filterValue;
    }
  }

  // Get color-blind filter CSS
  function getColorBlindFilterCSS(type) {
    const filters = {
      protanopia: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'protanopia\'%3E%3CfeColorMatrix type=\'matrix\' values=\'0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0\'/%3E%3C/filter%3E%3C/svg%3E#protanopia")',
      deuteranopia: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'deuteranopia\'%3E%3CfeColorMatrix type=\'matrix\' values=\'0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0\'/%3E%3C/filter%3E%3C/svg%3E#deuteranopia")',
      tritanopia: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'tritanopia\'%3E%3CfeColorMatrix type=\'matrix\' values=\'0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0\'/%3E%3C/filter%3E%3C/svg%3E#tritanopia")'
    };
    return filters[type] || 'none';
  }

  // Get position on color wheel
  function getWheelPosition(e) {
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const distance = Math.sqrt(x * x + y * y);
    const radius = rect.width / 2;

    if (distance > radius) return null;

    const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    const hue = (angle + 360) % 360;
    const saturation = Math.min((distance / radius) * 100, 100);

    return { hue, saturation };
  }

  // Handle wheel mouse down
  function handleWheelMouseDown(e) {
    isDragging = true;
    const pos = getWheelPosition(e);
    if (pos) {
      colorState.hue = pos.hue;
      colorState.saturation = pos.saturation;
      applyColors(colorState);
      saveSettings();
    }
  }

  // Handle slider mouse down
  function handleSliderMouseDown(e) {
    isDraggingSlider = true;
    const rect = slider.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
    colorState.brightness = percentage;
    applyColors(colorState);
    saveSettings();
  }

  // Handle mouse move
  function handleMouseMove(e) {
    if (isDragging) {
      const pos = getWheelPosition(e);
      if (pos) {
        colorState.hue = pos.hue;
        colorState.saturation = pos.saturation;
        applyColors(colorState);
      }
    } else if (isDraggingSlider) {
      const rect = slider.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const percentage = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
      colorState.brightness = percentage;
      applyColors(colorState);
    }
  }

  // Handle mouse up
  function handleMouseUp() {
    if (isDragging || isDraggingSlider) {
      saveSettings();
    }
    isDragging = false;
    isDraggingSlider = false;
  }

  // Update UI
  function updateUI() {
    // Update selector position
    const radius = 100;
    const angle = (colorState.hue - 90) * (Math.PI / 180);
    const distance = (colorState.saturation / 100) * radius;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    selector.style.left = (50 + x) + '%';
    selector.style.top = (50 + y) + '%';
    selector.style.color = `hsl(${colorState.hue}, ${colorState.saturation}%, ${colorState.brightness}%)`;

    // Update brightness slider
    sliderHandle.style.bottom = colorState.brightness + '%';
    sliderTrack.style.background = `linear-gradient(to top,
      hsl(${colorState.hue}, ${colorState.saturation}%, 0%),
      hsl(${colorState.hue}, ${colorState.saturation}%, 50%),
      hsl(${colorState.hue}, ${colorState.saturation}%, 100%)
    )`;

    // Update preview
    previewBox.style.backgroundColor = `hsl(${colorState.hue}, ${colorState.saturation}%, ${colorState.brightness}%)`;

    // Update displays
    const currentColor = hsvToRgb(colorState.hue, colorState.saturation, colorState.brightness);
    const hexValue = rgbToHex(currentColor);
    
    hueDisplay.textContent = `Hue: ${Math.round(colorState.hue)}°`;
    saturationDisplay.textContent = `Saturation: ${Math.round(colorState.saturation)}%`;
    brightnessDisplay.textContent = `Brightness: ${Math.round(colorState.brightness)}%`;
    
    // Update hex display if element exists
    const hexDisplay = document.getElementById('hex-display');
    if (hexDisplay) {
      hexDisplay.textContent = `Hex: ${hexValue.toUpperCase()}`;
    }

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(function(button) {
      button.classList.remove('active');
      if (button.dataset.filter === colorState.colorBlindFilter) {
        button.classList.add('active');
      }
    });
  }

  // Set color-blind filter
  function setColorBlindFilter(filter) {
    colorState.colorBlindFilter = filter;
    applyColors(colorState);
    saveSettings();
  }

  // Reset to default
  function resetToDefault() {
    colorState = { ...DEFAULT_STATE };
    applyColors(colorState);
    localStorage.removeItem(STORAGE_KEY);
    saveSettings();
  }

  // Save settings
  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colorState));
  }

  // Toggle panel
  function togglePanel() {
    isOpen = !isOpen;
    if (isOpen) {
      overlay.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      overlay.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  // Create UI elements
  function createUI() {
    // Create button
    btn = document.createElement('button');
    btn.className = 'accessibility-color-btn';
    btn.setAttribute('aria-label', 'Open Accessibility Settings');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1M20.66 3.34l-4.24 4.24m-8.48 8.48l-4.24 4.24M20.66 20.66l-4.24-4.24m-8.48-8.48L3.34 3.34" />
      </svg>
      <span>Accessibility</span>
    `;
    btn.onclick = togglePanel;
    document.body.appendChild(btn);

    // Create overlay
    overlay = document.createElement('div');
    overlay.className = 'accessibility-color-overlay hidden';
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        togglePanel();
      }
    };

    // Create panel
    panel = document.createElement('div');
    panel.className = 'accessibility-color-panel';
    panel.onclick = function(e) {
      e.stopPropagation();
    };

    // Create header
    const header = document.createElement('div');
    header.className = 'accessibility-color-header';
    header.innerHTML = `
      <h2>Accessibility Color Settings</h2>
      <button class="accessibility-color-close" aria-label="Close">×</button>
    `;
    header.querySelector('.accessibility-color-close').onclick = togglePanel;
    panel.appendChild(header);

    // Create content
    const content = document.createElement('div');
    content.className = 'accessibility-color-content';

    // Color wheel section
    const wheelSection = document.createElement('div');
    wheelSection.innerHTML = `
      <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 600; color: var(--text);">Color Customization</h3>
      <p style="margin: 0 0 1.5rem 0; font-size: 0.875rem; color: var(--text); opacity: 0.7;">
        Choose any color to customize the website appearance. Changes apply instantly across all elements.
      </p>
      <div class="color-wheel-container">
        <div id="color-wheel" class="color-wheel">
          <div class="color-wheel-inner">
            <div id="color-wheel-selector" class="color-wheel-selector"></div>
          </div>
        </div>
        <div class="brightness-slider-container">
          <label>Brightness</label>
          <div id="brightness-slider" class="brightness-slider">
            <div class="brightness-slider-track"></div>
            <div id="brightness-slider-handle" class="brightness-slider-handle"></div>
          </div>
        </div>
      </div>
      <div class="color-preview" style="margin-top: 1.5rem;">
        <div id="color-preview-box" class="color-preview-box"></div>
        <div class="color-preview-info">
          <div id="hue-display">Hue: 210°</div>
          <div id="saturation-display">Saturation: 100%</div>
          <div id="brightness-display">Brightness: 50%</div>
          <div id="hex-display">Hex: #3B82F6</div>
        </div>
      </div>
    `;
    content.appendChild(wheelSection);

    // Get references
    wheel = document.getElementById('color-wheel');
    selector = document.getElementById('color-wheel-selector');
    slider = document.getElementById('brightness-slider');
    sliderHandle = document.getElementById('brightness-slider-handle');
    sliderTrack = slider.querySelector('.brightness-slider-track');
    previewBox = document.getElementById('color-preview-box');
    hueDisplay = document.getElementById('hue-display');
    saturationDisplay = document.getElementById('saturation-display');
    brightnessDisplay = document.getElementById('brightness-display');

    // Color-blind filters section
    const filtersSection = document.createElement('div');
    filtersSection.className = 'color-blind-filters';
    filtersSection.innerHTML = `
      <h3>Color-Blind Simulation</h3>
      <p style="margin: 0 0 1rem 0; font-size: 0.875rem; color: var(--text); opacity: 0.7;">
        Preview how the website appears to users with different types of color vision.
      </p>
      <div class="filter-buttons">
        <button class="filter-btn active" data-filter="none" onclick="window.accessibilityColorSystem.setFilter('none')">Normal</button>
        <button class="filter-btn" data-filter="protanopia" onclick="window.accessibilityColorSystem.setFilter('protanopia')">Protanopia</button>
        <button class="filter-btn" data-filter="deuteranopia" onclick="window.accessibilityColorSystem.setFilter('deuteranopia')">Deuteranopia</button>
        <button class="filter-btn" data-filter="tritanopia" onclick="window.accessibilityColorSystem.setFilter('tritanopia')">Tritanopia</button>
      </div>
    `;
    content.appendChild(filtersSection);

    // Reset button
    const actionsSection = document.createElement('div');
    actionsSection.className = 'accessibility-color-actions';
    actionsSection.style.paddingTop = '1rem';
    actionsSection.style.borderTop = '2px solid var(--border)';
    actionsSection.innerHTML = `
      <button class="reset-btn" onclick="window.accessibilityColorSystem.reset()">Reset to Default Colors</button>
    `;
    content.appendChild(actionsSection);

    panel.appendChild(content);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Event listeners
    wheel.addEventListener('mousedown', handleWheelMouseDown);
    slider.addEventListener('mousedown', handleSliderMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // Initialize
  function init() {
    // Load saved settings
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        colorState = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load color settings:', e);
        colorState = { ...DEFAULT_STATE };
      }
    }

    // Create UI
    createUI();

    // Apply colors
    applyColors(colorState);

    // Expose API
    window.accessibilityColorSystem = {
      setFilter: setColorBlindFilter,
      reset: resetToDefault,
      getState: function() { return { ...colorState }; },
      setState: function(state) {
        colorState = { ...state };
        applyColors(colorState);
        saveSettings();
      }
    };
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

