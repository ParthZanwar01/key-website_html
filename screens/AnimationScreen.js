import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { Svg, Path, Circle, Rect, G } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function AnimationScreen() {
  const { hideAnimation } = useAuth();
  
  // Animation values
  const keySlideAnim = useRef(new Animated.Value(-100)).current;
  const keyRotateAnim = useRef(new Animated.Value(0)).current;
  const lockOpenAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start the animation sequence
    const startAnimation = () => {
      // Fade in and scale up initially
      Animated.parallel([
        Animated.timing(fadeInAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Key slides into lock
        Animated.timing(keySlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          // Key rotates to unlock
          Animated.timing(keyRotateAnim, {
            toValue: 90,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            // Lock opens
            Animated.timing(lockOpenAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              // Wait a moment then transition
              setTimeout(() => {
                hideAnimation();
              }, 800);
            });
          });
        });
      });
    };

    startAnimation();
  }, []);

  // Interpolated values
  const keyTranslateX = keySlideAnim;
  const keyRotation = keyRotateAnim.interpolate({
    inputRange: [0, 90],
    outputRange: ['0deg', '90deg'],
  });

  const lockShackleTranslateY = lockOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const lockShackleRotate = lockOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#1a1a2e',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Animated.View
        style={{
          opacity: fadeInAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <AnimatedSvg
          width={300}
          height={200}
          viewBox="0 0 300 200"
        >
          {/* Lock Body */}
          <Rect
            x="100"
            y="80"
            width="100"
            height="80"
            rx="10"
            ry="10"
            fill="#4a4a4a"
            stroke="#666"
            strokeWidth="2"
          />
          
          {/* Lock Body Highlight */}
          <Rect
            x="105"
            y="85"
            width="20"
            height="70"
            fill="#5a5a5a"
          />
          
          {/* Keyhole */}
          <Circle
            cx="150"
            cy="110"
            r="8"
            fill="#2a2a2a"
          />
          <Rect
            x="146"
            y="110"
            width="8"
            height="15"
            fill="#2a2a2a"
          />
          
          {/* Lock Shackle */}
          <AnimatedG
            transform={`translate(150, 60) rotate(${lockShackleRotate}) translate(-150, -60)`}
          >
            <Animated.View
              style={{
                transform: [{ translateY: lockShackleTranslateY }],
              }}
            >
              <Path
                d="M 120 60 Q 120 30 150 30 Q 180 30 180 60 L 180 80 L 170 80 L 170 60 Q 170 40 150 40 Q 130 40 130 60 L 130 80 L 120 80 Z"
                fill="none"
                stroke="#4a4a4a"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </Animated.View>
          </AnimatedG>
          
          {/* Key */}
          <AnimatedG
            transform={`translate(${keyTranslateX}, 0) rotate(${keyRotation}, 75, 120)`}
          >
            {/* Key Head */}
            <Circle
              cx="40"
              cy="120"
              r="15"
              fill="#ffd700"
              stroke="#ffed4e"
              strokeWidth="2"
            />
            <Circle
              cx="40"
              cy="120"
              r="6"
              fill="#2a2a2a"
            />
            
            {/* Key Shaft */}
            <Rect
              x="55"
              y="117"
              width="60"
              height="6"
              fill="#ffd700"
              stroke="#ffed4e"
              strokeWidth="1"
            />
            
            {/* Key Teeth */}
            <Rect
              x="95"
              y="123"
              width="8"
              height="8"
              fill="#ffd700"
            />
            <Rect
              x="85"
              y="123"
              width="6"
              height="6"
              fill="#ffd700"
            />
            <Rect
              x="105"
              y="123"
              width="10"
              height="4"
              fill="#ffd700"
            />
            
            {/* Key Shine Effect */}
            <Rect
              x="57"
              y="118"
              width="56"
              height="2"
              fill="#ffed4e"
              opacity="0.8"
            />
          </AnimatedG>
          
          {/* Sparkle Effects */}
          <AnimatedG opacity={lockOpenAnim}>
            <Path
              d="M 80 50 L 85 60 L 95 55 L 85 65 L 80 75 L 75 65 L 65 55 L 75 60 Z"
              fill="#ffed4e"
              opacity="0.7"
            />
            <Path
              d="M 220 70 L 223 77 L 230 74 L 223 81 L 220 88 L 217 81 L 210 74 L 217 77 Z"
              fill="#ffed4e"
              opacity="0.5"
            />
            <Path
              d="M 90 160 L 92 165 L 97 163 L 92 168 L 90 173 L 88 168 L 83 163 L 88 165 Z"
              fill="#ffed4e"
              opacity="0.6"
            />
            <Path
              d="M 210 140 L 213 147 L 220 144 L 213 151 L 210 158 L 207 151 L 200 144 L 207 147 Z"
              fill="#ffed4e"
              opacity="0.4"
            />
          </AnimatedG>
        </AnimatedSvg>
      </Animated.View>
    </View>
  );
}
