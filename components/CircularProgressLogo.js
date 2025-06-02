import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CircularProgressLogo = ({ 
  currentHours = 0, 
  targetHours = 100, 
  size = 200, 
  strokeWidth = 8,
  animated = true 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Calculate progress percentage (0-1)
  const progress = Math.min(currentHours / targetHours, 1);
  const percentage = Math.round(progress * 100);
  
  // Circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  
  // Animate progress on mount/update
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated]);

  // Calculate stroke dash offset based on animated value
  const animatedStrokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 214, 10, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ffd60a"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {/* Logo in center */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/keyclublogo.png')} 
          style={[styles.logo, { 
            width: size * 0.6, 
            height: size * 0.6 
          }]}
          resizeMode="contain"
        />
      </View>
      
      {/* Progress text overlay */}
      <View style={styles.progressTextContainer}>
        <Text style={styles.hoursText}>{currentHours.toFixed(1)}</Text>
        <Text style={styles.hoursLabel}>hours</Text>
        <Text style={styles.progressText}>{percentage}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    transform: [{ rotate: '0deg' }],
  },
  logoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logo: {
    opacity: 0.9,
  },
  progressTextContainer: {
    position: 'absolute',
    bottom: -50,
    alignItems: 'center',
    zIndex: 2,
  },
  hoursText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  hoursLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd60a',
  },
});

export default CircularProgressLogo;