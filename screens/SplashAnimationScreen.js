import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Enhanced Floating Particle with more animations
const FloatingParticle = ({ delay = 0 }) => {
  const translateY = useRef(new Animated.Value(height + 50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 4000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.delay(2500),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scale, {
          toValue: 1 + Math.random() * 0.5,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset and restart
        translateY.setValue(height + 50);
        translateX.setValue(Math.random() * width);
        opacity.setValue(0);
        scale.setValue(0.5);
        rotation.setValue(0);
        setTimeout(animate, Math.random() * 1000);
      });
    };

    setTimeout(animate, delay);
  }, [delay]);

  const rotationInterpolated = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
            { rotate: rotationInterpolated },
          ],
          opacity,
        },
      ]}
    >
      <View style={styles.particleInner} />
    </Animated.View>
  );
};

// Ripple Wave Animation
const RippleWave = ({ delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 3,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        scaleAnim.setValue(0);
        opacityAnim.setValue(0.8);
        setTimeout(animate, 2000 + Math.random() * 1000);
      });
    };

    setTimeout(animate, delay);
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.rippleWave,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

// Sparkle Effect
const SparkleEffect = ({ delay = 0 }) => {
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        sparkleAnim.setValue(0);
        rotateAnim.setValue(0);
        scaleAnim.setValue(0);
        setTimeout(animate, 2000 + Math.random() * 2000);
      });
    };

    setTimeout(animate, delay);
  }, [delay]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          opacity: sparkleAnim,
          transform: [
            { rotate: rotation },
            { scale: scaleAnim },
          ],
          left: Math.random() * (width - 30),
          top: Math.random() * (height - 30),
        },
      ]}
    >
      <View style={styles.sparkleInner} />
    </Animated.View>
  );
};

// Clean, Modern Key Logo Component
const KeyClubLogo = ({ size = 200, animatedRotation, animatedScale, animatedBounce }) => (
  <Animated.View
    style={{
      transform: [
        { rotate: animatedRotation },
        { scale: animatedScale },
        { translateY: animatedBounce },
      ],
    }}
  >
    <Svg width={size} height={size} viewBox="0 0 320 320" style={{ overflow: 'visible' }}>
      <Defs>
        <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4FC3F7" />
          <Stop offset="50%" stopColor="#29B6F6" />
          <Stop offset="100%" stopColor="#0288D1" />
        </SvgLinearGradient>
        <SvgLinearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="30%" stopColor="#FFD54F" />
          <Stop offset="70%" stopColor="#FFC107" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </SvgLinearGradient>
        <SvgLinearGradient id="keyShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="rgba(255, 193, 7, 0.3)" />
          <Stop offset="100%" stopColor="rgba(255, 143, 0, 0.6)" />
        </SvgLinearGradient>
      </Defs>
      
      {/* Animated ring with blue theme */}
      <Circle
        cx="160"
        cy="160"
        r="140"
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.9"
      />
      
      {/* Inner glow ring */}
      <Circle
        cx="160"
        cy="160"
        r="125"
        fill="none"
        stroke="rgba(79, 195, 247, 0.4)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Clean background */}
      <Circle
        cx="160"
        cy="160"
        r="110"
        fill="rgba(30, 136, 229, 0.95)"
        stroke="rgba(79, 195, 247, 0.5)"
        strokeWidth="2"
      />
      
      {/* Modern Key Design */}
      <G>
        {/* Key shadow for depth */}
        <Circle
          cx="128"
          cy="168"
          r="32"
          fill="url(#keyShadow)"
        />
        
        {/* Key Head - Clean circle */}
        <Circle
          cx="125"
          cy="160"
          r="32"
          fill="url(#keyGradient)"
          stroke="rgba(255, 143, 0, 0.8)"
          strokeWidth="3"
        />
        
        {/* Elegant highlight */}
        <Circle
          cx="115"
          cy="145"
          r="12"
          fill="rgba(255, 255, 255, 0.9)"
        />
        
        {/* Key hole - modern design */}
        <Circle
          cx="125"
          cy="160"
          r="10"
          fill="rgba(30, 136, 229, 0.9)"
        />
        
        {/* Key Shaft shadow */}
        <Path
          d="M 157 153 L 215 153 L 215 170 L 157 170 Z"
          fill="url(#keyShadow)"
        />
        
        {/* Key Shaft - sleek design */}
        <Path
          d="M 155 150 L 210 150 L 210 167 L 155 167 Z"
          fill="url(#keyGradient)"
          stroke="rgba(255, 143, 0, 0.8)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        
        {/* Modern Key Teeth with shadows */}
        <Path
          d="M 210 155 L 230 155 L 230 167 L 210 167 Z"
          fill="url(#keyGradient)"
          stroke="rgba(255, 143, 0, 0.8)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        <Path
          d="M 210 145 L 222 145 L 222 155 L 210 155 Z"
          fill="url(#keyGradient)"
          stroke="rgba(255, 143, 0, 0.8)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        <Path
          d="M 210 167 L 240 167 L 240 177 L 210 177 Z"
          fill="url(#keyGradient)"
          stroke="rgba(255, 143, 0, 0.8)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Elegant highlights */}
        <Path
          d="M 157 153 L 205 153 L 205 156 L 157 156 Z"
          fill="rgba(255, 255, 255, 0.7)"
        />
        <Path d="M 212 157 L 228 157 L 228 159 L 212 159 Z" fill="rgba(255, 255, 255, 0.6)" />
        <Path d="M 212 147 L 220 147 L 220 149 L 212 149 Z" fill="rgba(255, 255, 255, 0.6)" />
      </G>
      
      {/* Subtle blue accent elements */}
      <Circle cx="75" cy="95" r="4" fill="rgba(79, 195, 247, 0.6)" />
      <Circle cx="245" cy="110" r="3" fill="rgba(41, 182, 246, 0.7)" />
      <Circle cx="80" cy="225" r="3.5" fill="rgba(2, 136, 209, 0.6)" />
      <Circle cx="240" cy="210" r="3" fill="rgba(79, 195, 247, 0.5)" />
    </Svg>
  </Animated.View>
);

const SplashAnimationScreen = ({ onAnimationComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textSlide = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.8)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Enhanced logo entrance animation
    Animated.sequence([
      // Dramatic entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1.3,
          tension: 60,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Settle into place
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Enhanced continuous animations
    // More pronounced bouncing
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Enhanced pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.08,
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

    // More dramatic wiggle
    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Enhanced glow pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.2,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Complete animation
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 4000); // Longer duration for more animations

    return () => clearTimeout(timer);
  }, []);

  const logoRotationInterpolated = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  const wiggleRotation = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'], // More dramatic wiggle
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0.8, 1.2],
    outputRange: [0.3, 0.8], // More dramatic glow
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0.8, 1.2],
    outputRange: [1, 1.4], // Bigger glow effect
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* App-consistent blue gradient background */}
      <LinearGradient
        colors={['#0D47A1', '#1565C0', '#1976D2', '#42A5F5']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Enhanced floating ambient particles */}
      <FloatingParticle delay={0} />
      <FloatingParticle delay={300} />
      <FloatingParticle delay={600} />
      <FloatingParticle delay={900} />
      <FloatingParticle delay={1200} />
      <FloatingParticle delay={1500} />
      <FloatingParticle delay={1800} />
      <FloatingParticle delay={2100} />

      {/* Ripple wave effects */}
      <RippleWave delay={500} />
      <RippleWave delay={1500} />
      <RippleWave delay={2500} />

      {/* Sparkle effects */}
      <SparkleEffect delay={800} />
      <SparkleEffect delay={1300} />
      <SparkleEffect delay={1800} />
      <SparkleEffect delay={2300} />
      <SparkleEffect delay={2800} />

      {/* Enhanced glow effects */}
      <Animated.View
        style={[
          styles.mainGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Secondary warm glow */}
      <Animated.View
        style={[
          styles.secondaryGlow,
          {
            opacity: glowOpacity.interpolate({
              inputRange: [0.3, 0.8],
              outputRange: [0.4, 0.7],
            }),
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Third glow layer for extra drama */}
      <Animated.View
        style={[
          styles.thirdGlow,
          {
            opacity: glowOpacity.interpolate({
              inputRange: [0.3, 0.8],
              outputRange: [0.2, 0.5],
            }),
            transform: [{ scale: glowScale.interpolate({
              inputRange: [1, 1.4],
              outputRange: [1, 1.6],
            }) }],
          },
        ]}
      />

      {/* Main logo container */}
      <View style={styles.logoContainer}>
        <KeyClubLogo
          size={200}
          animatedRotation={Animated.add(logoRotationInterpolated, wiggleRotation)}
          animatedScale={Animated.multiply(logoScale, pulseScale)}
          animatedBounce={bounceAnim}
        />
      </View>

      {/* Text content */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textSlide }],
          },
        ]}
      >
        <Text style={styles.mainTitle}>Cypress Ranch Key Club</Text>
        <Text style={styles.subtitle}>Caring • Our way of life</Text>
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>Building Leaders • Serving Communities</Text>
        </View>
      </Animated.View>

      {/* Bottom accent line */}
      <Animated.View
        style={[
          styles.accentLine,
          {
            opacity: textOpacity,
            transform: [{ scaleX: textOpacity }],
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
    /* overflow: 'hidden', */
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  paintSplash: {
    // Removed - replaced with particles
  },
  splashMain: {
    // Removed
  },
  splashDrop1: {
    // Removed
  },
  splashDrop2: {
    // Removed
  },
  splashDrop3: {
    // Removed
  },
  splashDrop4: {
    // Removed
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    zIndex: 5,
  },
  particleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(79, 195, 247, 0.8)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  rippleWave: {
    position: 'absolute',
    left: width / 2 - 75,
    top: height / 2 - 75,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(79, 195, 247, 0.4)',
    zIndex: 2,
  },
  sparkle: {
    position: 'absolute',
    width: 30,
    height: 30,
    zIndex: 8,
  },
  sparkleInner: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 40,
  },
  mainGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 15,
  },
  secondaryGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 35,
    elevation: 12,
  },
  thirdGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(41, 182, 246, 0.1)',
    shadowColor: '#29B6F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 18,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  taglineContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  tagline: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  accentLine: {
    position: 'absolute',
    bottom: 80,
    width: 100,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default SplashAnimationScreen;