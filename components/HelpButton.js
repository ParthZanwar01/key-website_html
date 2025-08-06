import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHelper } from '../contexts/HelperContext';

export default function HelpButton({ 
  tooltipId, 
  tooltipContent, 
  helpContent, 
  size = 20, 
  color = '#4299e1',
  style,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) {
  const { showTooltip, hideTooltip, showHelp, tutorialState } = useHelper();

  const handlePress = () => {
    if (helpContent) {
      showHelp(helpContent);
    } else if (tooltipContent && tutorialState.showTooltips) {
      showTooltip(tooltipId, tooltipContent);
    }
  };

  const handleLongPress = () => {
    if (tooltipContent) {
      hideTooltip();
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 10, left: 10 };
      case 'top-right':
        return { top: 10, right: 10 };
      case 'bottom-left':
        return { bottom: 10, left: 10 };
      case 'bottom-right':
        return { bottom: 10, right: 10 };
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.helpButton,
        getPositionStyle(),
        { width: size + 8, height: size + 8 },
        style,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <Ionicons name="help-circle-outline" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  helpButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
}); 