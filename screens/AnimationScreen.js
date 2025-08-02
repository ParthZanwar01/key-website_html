import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Text } from 'react-native';
import { Svg, Path, Circle, Rect, G, Defs, LinearGradient as SvgLinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AnimationScreen() {
  const { hideAnimation } = useAuth();
  
  // Animation values
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.1)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.5)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const orbitalAnim = useRef(new Animated.Value(0)).current;
  const glowPulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Start orbital animation loop immediately
      Animated.loop(
        Animated.timing(orbitalAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();

      // Start glow pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulseAnim, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulseAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Initial dramatic entrance
      Animated.parallel([
        Animated.timing(fadeInAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start(() => {
        
        // Logo dramatic entrance with bounce
        Animated.sequence([
          Animated.spring(logoScaleAnim, {
            toValue: 1.2,
            tension: 60,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(logoScaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();

        // Logo rotation with easing
        Animated.timing(logoRotateAnim, {
          toValue: 360,
          duration: 2500,
          useNativeDriver: true,
        }).start();

        // Ripple effect
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start();

        // Particles floating up
        Animated.loop(
          Animated.timing(particlesAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          })
        ).start();

        // Text entrance with delay
        setTimeout(() => {
          Animated.parallel([
            Animated.spring(textSlideAnim, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(textOpacityAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start();
        }, 1000);

        // Auto-transition after animation
        setTimeout(() => {
          hideAnimation();
        }, 4500);
      });
    };

    startAnimation();
  }, []);

  // Interpolated values
  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const rippleScale1 = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2.5],
  });

  const rippleScale2 = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3.5],
  });

  const rippleScale3 = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4.5],
  });

  const rippleOpacity1 = rippleAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.6, 0],
  });

  const rippleOpacity2 = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.4, 0],
  });

  const rippleOpacity3 = rippleAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 0.2, 0],
  });

  const orbitalRotation = orbitalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const particleY1 = particlesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });

  const particleY2 = particlesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -180],
  });

  const particleY3 = particlesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  });

  const particleOpacity = particlesAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  const particleScale = particlesAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.3],
  });

  return (
    <LinearGradient
      colors={['#1a365d', '#2c5282', '#3182ce']}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Animated Ripple Circles - Perfectly Centered */}
      <View style={{
        position: 'absolute',
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: '#4299e1',
            opacity: rippleOpacity1,
            transform: [{ scale: rippleScale1 }],
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 1.5,
            borderColor: '#63b3ed',
            opacity: rippleOpacity2,
            transform: [{ scale: rippleScale2 }],
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: '#90cdf4',
            opacity: rippleOpacity3,
            transform: [{ scale: rippleScale3 }],
          }}
        />
      </View>

      {/* Main Logo Container - Perfectly Centered */}
      <Animated.View
        style={{
          opacity: fadeInAnim,
          transform: [{ scale: scaleAnim }],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Glowing Background Circle */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: '#4299e1',
            opacity: glowPulseAnim,
            transform: [{ scale: logoScaleAnim }],
          }}
        />

        {/* Main Logo Circle */}
        <Animated.View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: 'rgba(66, 153, 225, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#4299e1',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 20,
            transform: [
              { scale: logoScaleAnim },
              { rotate: logoRotation },
            ],
          }}
        >
          {/* K Letter - Clean and Modern */}
          <AnimatedSvg
            width={80}
            height={80}
            viewBox="0 0 80 80"
          >
            <Defs>
              <SvgLinearGradient id="kGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <Stop offset="100%" stopColor="#e2e8f0" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            
            {/* Modern K Design */}
            <Path
              d="M 20 15 L 28 15 L 28 35 L 45 20 L 55 20 L 40 35 L 58 55 L 48 55 L 35 42 L 28 48 L 28 65 L 20 65 Z"
              fill="url(#kGradient)"
              stroke="none"
            />
            
            {/* Decorative dots */}
            <Circle cx="62" cy="25" r="3" fill="rgba(255,255,255,0.8)" />
            <Circle cx="65" cy="35" r="2" fill="rgba(255,255,255,0.6)" />
            <Circle cx="60" cy="42" r="2.5" fill="rgba(255,255,255,0.7)" />
          </AnimatedSvg>
        </Animated.View>

        {/* Orbital Elements */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            transform: [{ rotate: orbitalRotation }],
          }}
        >
          <View style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            marginLeft: -4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#90cdf4',
          }} />
          <View style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            marginLeft: -3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#63b3ed',
          }} />
          <View style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            marginTop: -2.5,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: '#4299e1',
          }} />
          <View style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            marginTop: -3.5,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: '#bee3f8',
          }} />
        </Animated.View>
      </Animated.View>

      {/* Floating Particles - Better Positioned */}
      <Animated.View
        style={{
          position: 'absolute',
          left: width * 0.2,
          top: height * 0.6,
          opacity: particleOpacity,
          transform: [
            { translateY: particleY1 },
            { scale: particleScale },
          ],
        }}
      >
        <View style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#90cdf4',
        }} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          right: width * 0.25,
          top: height * 0.65,
          opacity: particleOpacity,
          transform: [
            { translateY: particleY2 },
            { scale: particleScale },
          ],
        }}
      >
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#63b3ed',
        }} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          left: width * 0.7,
          top: height * 0.4,
          opacity: particleOpacity,
          transform: [
            { translateY: particleY3 },
            { scale: particleScale },
          ],
        }}
      >
        <View style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: '#4299e1',
        }} />
      </Animated.View>

      {/* Additional scattered particles */}
      <Animated.View
        style={{
          position: 'absolute',
          left: width * 0.15,
          top: height * 0.35,
          opacity: particleOpacity,
          transform: [
            { translateY: particleY1 },
            { scale: particleScale },
            { rotate: orbitalRotation },
          ],
        }}
      >
        <View style={{
          width: 4,
          height: 4,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#bee3f8',
          transform: [{ rotate: '45deg' }],
        }} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          right: width * 0.15,
          top: height * 0.3,
          opacity: particleOpacity,
          transform: [
            { translateY: particleY2 },
            { scale: particleScale },
            { rotate: orbitalRotation },
          ],
        }}
      >
        <View style={{
          width: 5,
          height: 5,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: '#90cdf4',
          borderRadius: 2.5,
        }} />
      </Animated.View>

      {/* Text Container - Perfectly Centered */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: height * 0.25,
          width: '100%',
          alignItems: 'center',
          opacity: textOpacityAnim,
          transform: [{ translateY: textSlideAnim }],
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 6,
            marginBottom: 8,
          }}
        >
          Welcome to Key Club! ✨
        </Text>

        <Text
          style={{
            color: '#cbd5e0',
            fontSize: 16,
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          Loading your dashboard...
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}