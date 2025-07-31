// utils/AccessibilityHelper.js
import { Platform } from 'react-native';

// Focus management utility for web
export const manageFocus = (elementRef, shouldFocus = true) => {
  if (Platform.OS === 'web' && elementRef && elementRef.current) {
    if (shouldFocus) {
      elementRef.current.focus();
    } else {
      elementRef.current.blur();
    }
  }
};

// Prevent focus on hidden elements
export const preventFocusOnHidden = () => {
  if (Platform.OS === 'web') {
    const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
    hiddenElements.forEach(element => {
      element.setAttribute('tabindex', '-1');
      element.style.pointerEvents = 'none';
    });
  }
};

// Restore focus management
export const restoreFocusManagement = () => {
  if (Platform.OS === 'web') {
    const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
    hiddenElements.forEach(element => {
      element.removeAttribute('tabindex');
      element.style.pointerEvents = '';
    });
  }
};

// Add accessibility attributes to elements
export const addAccessibilityAttributes = (element, attributes = {}) => {
  if (Platform.OS === 'web' && element) {
    Object.keys(attributes).forEach(key => {
      element.setAttribute(key, attributes[key]);
    });
  }
}; 