import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Key Club Logo Component
const KeyClubLogo = ({ size = 120, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200">
    {/* Outer rope border */}
    <Circle
      cx="100"
      cy="100"
      r="95"
      fill="none"
      stroke="#d4af37"
      strokeWidth="8"
      strokeDasharray="15,10"
    />
    
    {/* Inner circle background */}
    <Circle
      cx="100"
      cy="100"
      r="80"
      fill="#1e3a8a"
    />
    
    {/* Key shape */}
    <G>
      {/* Key body */}
      <Path
        d="M70 85 L70 115 L130 115 L130 105 L140 105 L140 95 L130 95 L130 85 Z"
        fill={color}
        stroke="#d4af37"
        strokeWidth="2"
      />
      
      {/* Key head (circle) */}
      <Circle
        cx="70"
        cy="100"
        r="25"
        fill={color}
        stroke="#d4af37"
        strokeWidth="2"
      />
      
      {/* Key hole */}
      <Circle
        cx="70"
        cy="100"
        r="8"
        fill="#1e3a8a"
      />
      
      {/* Key teeth */}
      <Path
        d="M130 105 L135 105 L135 110 L140 110 L140 115 L130 115 Z"
        fill={color}
        stroke="#d4af37"
        strokeWidth="1"
      />
    </G>
    
    {/* Text around the circle */}
    <Path
      id="textcircle"
      d="M 50,100 A 50,50 0 1,1 150,100 A 50,50 0 1,1 50,100"
      fill="none"
    />
  </Svg>
);

// Floating particle component
const FloatingParticle = ({ delay = 0, duration = 3000, color = '#ffca3b' }) => {
  const translateY = useRef(new Animated.Value(height + 50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(duration - 1000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset and restart
        translateY.setValue(height + 50);
        translateX.setValue(Math.random() * width);
        opacity.setValue(0);
        scale.setValue(0);
        setTimeout(startAnimation, Math.random() * 1000);
      });
    };

    setTimeout(startAnimation, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <View style={[styles.particleInner, { backgroundColor: color }]} />
    </Animated.View>
  );
};

const SplashAnimationScreen = ({ onAnimationComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const backgroundRotation = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  
  // Geometric shapes animations
  const shape1Rotation = useRef(new Animated.Value(0)).current;
  const shape2Scale = useRef(new Animated.Value(0)).current;
  const shape3Translation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background continuous rotation
    Animated.loop(
      Animated.timing(backgroundRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Logo entrance animation
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulsing effect for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Geometric shapes animations
    Animated.loop(
      Animated.timing(shape1Rotation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shape2Scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shape2Scale, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shape3Translation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shape3Translation, {
          toValue: -1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Complete animation after 3 seconds
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const backgroundRotationInterpolated = backgroundRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logoRotationInterpolated = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shape1RotationInterpolated = shape1Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shape3TranslationInterpolated = shape3Translation.interpolate({
    inputRange: [-1, 1],
    outputRange: [-50, 50],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Animated gradient background */}
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Rotating background pattern */}
      <Animated.View
        style={[
          styles.backgroundPattern,
          {
            transform: [{ rotate: backgroundRotationInterpolated }],
          },
        ]}
      >
        {[...Array(8)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.backgroundLine,
              {
                transform: [{ rotate: `${index * 45}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Floating particles */}
      {[...Array(15)].map((_, index) => (
        <FloatingParticle
          key={index}
          delay={index * 200}
          duration={3000 + Math.random() * 2000}
          color={['#ffca3b', '#fbbf24', '#f59e0b', '#d97706'][index % 4]}
        />
      ))}

      {/* Geometric shapes */}
      <Animated.View
        style={[
          styles.geometricShape,
          styles.shape1,
          {
            transform: [{ rotate: shape1RotationInterpolated }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.geometricShape,
          styles.shape2,
          {
            transform: [{ scale: shape2Scale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.geometricShape,
          styles.shape3,
          {
            transform: [{ translateX: shape3TranslationInterpolated }],
          },
        ]}
      />

      {/* Main logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: Animated.multiply(logoScale, pulseScale) },
              { rotate: logoRotationInterpolated },
            ],
            opacity: logoOpacity,
          },
        ]}
      >
        <KeyClubLogo size={150} color="#ffffff" />
      </Animated.View>

      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            opacity: logoOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundPattern: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundLine: {
    position: 'absolute',
    width: width * 2,
    height: 2,
    backgroundColor: 'rgba(255, 202, 59, 0.1)',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 202, 59, 0.3)',
    shadowColor: '#ffca3b',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  particle: {
    position: 'absolute',
    zIndex: 5,
  },
  particleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#ffca3b',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  geometricShape: {
    position: 'absolute',
    opacity: 0.2,
  },
  shape1: {
    top: height * 0.15,
    left: width * 0.1,
    width: 60,
    height: 60,
    backgroundColor: '#ffca3b',
    borderRadius: 30,
  },
  shape2: {
    top: height * 0.7,
    right: width * 0.15,
    width: 40,
    height: 40,
    backgroundColor: '#f59e0b',
    transform: [{ rotate: '45deg' }],
  },
  shape3: {
    top: height * 0.3,
    right: width * 0.2,
    width: 30,
    height: 80,
    backgroundColor: '#d97706',
    borderRadius: 15,
  },
});

export default SplashAnimationScreen;