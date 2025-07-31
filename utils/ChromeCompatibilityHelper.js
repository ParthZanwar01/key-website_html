// utils/ChromeCompatibilityHelper.js
import { Platform } from 'react-native';

// Chrome-specific fixes for HP Envy and other devices
export const fixChromeRendering = () => {
  if (Platform.OS === 'web') {
    // Force hardware acceleration
    if (document.body) {
      document.body.style.transform = 'translateZ(0)';
      document.body.style.webkitTransform = 'translateZ(0)';
      document.body.style.backfaceVisibility = 'hidden';
      document.body.style.webkitBackfaceVisibility = 'hidden';
    }
    
    // Prevent layout thrashing by optimizing transforms
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      if (el.style && el.style.transform) {
        el.style.willChange = 'auto';
        el.style.transform = 'translateZ(0)';
        el.style.webkitTransform = 'translateZ(0)';
      }
    });
  }
};

// Fix for Chrome's handling of flexbox and overflow
export const fixChromeLayout = () => {
  if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.textContent = `
      /* Chrome-specific layout fixes */
      .flex-container {
        display: flex !important;
        flex-direction: column !important;
      }
      
      /* Prevent Chrome from creating extra scrollbars */
      .scroll-container {
        overflow: hidden !important;
      }
      
      /* Fix for Chrome's transform rendering */
      .transform-fix {
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        backface-visibility: hidden !important;
        -webkit-backface-visibility: hidden !important;
      }
      
      /* HP Envy specific fixes */
      @media screen and (min-resolution: 1.25dppx) {
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

// Detect Chrome on HP Envy or similar devices
export const isChromeOnHighDPIDevice = () => {
  if (Platform.OS === 'web') {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isHighDPI = window.devicePixelRatio > 1;
    
    return isChrome && isHighDPI;
  }
  return false;
};

// Apply Chrome-specific optimizations
export const applyChromeOptimizations = () => {
  if (Platform.OS === 'web' && isChromeOnHighDPIDevice()) {
    fixChromeRendering();
    fixChromeLayout();
    
    // Additional optimizations for high DPI displays
    const style = document.createElement('style');
    style.textContent = `
      /* High DPI Chrome optimizations */
      * {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      
      /* Prevent subpixel rendering issues */
      .text-fix {
        text-rendering: optimizeLegibility;
        -webkit-font-feature-settings: "kern" 1;
        font-feature-settings: "kern" 1;
      }
    `;
    document.head.appendChild(style);
  }
}; 