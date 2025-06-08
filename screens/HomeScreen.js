import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useHours } from '../contexts/HourContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const CircularProgressLogo = ({ 
  currentHours = 0, 
  targetHours = 100, 
  size = 200, 
  strokeWidth = 8,
  animated = true,
  onPress
}) => {
  const animatedValue = useRef(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate progress percentage (0-1)
  const targetProgress = Math.min(currentHours / targetHours, 1);
  const percentage = Math.round(targetProgress * 100);
  
  // Circle properties - adjusted to touch the logo
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Logo size - make it slightly smaller so the progress ring touches it
  const logoSize = size * 0.9;
  
  // Animate progress
  useEffect(() => {
    if (!animated) {
      setDisplayProgress(targetProgress);
      return;
    }

    let animationId;
    const animateProgress = () => {
      const diff = targetProgress - animatedValue.current;
      if (Math.abs(diff) > 0.001) {
        animatedValue.current += diff * 0.08;
        setDisplayProgress(animatedValue.current);
        animationId = requestAnimationFrame(animateProgress);
      } else {
        animatedValue.current = targetProgress;
        setDisplayProgress(targetProgress);
      }
    };
    
    animationId = requestAnimationFrame(animateProgress);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [targetProgress, animated]);

  // Calculate stroke dash offset for progress
  const strokeDashoffset = circumference - (displayProgress * circumference);

  // Handle logo press
  const handleLogoPress = () => {
    setShowDetails(!showDetails);
    
    Animated.timing(flipAnimation, {
      toValue: showDetails ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    if (onPress) onPress();
  };

  // Interpolate rotation values
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity 
      style={styles.progressContainer}
      onPress={handleLogoPress}
      activeOpacity={0.8}
    >
      {/* SVG Progress Ring */}
      <Svg width={size} height={size} style={styles.progressSvg}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffd60a" />
            <Stop offset="50%" stopColor="#ffca3b" />
            <Stop offset="100%" stopColor="#f1ca3b" />
          </LinearGradient>
        </Defs>
        
        {/* Background track - complete circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 214, 10, 0.15)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="butt"
        />
        
        {/* Progress circle - starts from top and goes clockwise */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {/* Animated Logo Container */}
      <View style={styles.logoContainer}>
        {/* Front side - Logo */}
        <Animated.View 
          style={[
            styles.logoSide,
            { transform: [{ rotateY: frontInterpolate }] }
          ]}
        >
          <Image 
            source={require('../assets/images/keyclublogo-modified.png')} 
            style={[styles.logo, { 
              width: logoSize, 
              height: logoSize 
            }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Back side - Progress Details */}
        <Animated.View 
          style={[
            styles.logoSide,
            styles.backSide,
            { transform: [{ rotateY: backInterpolate }] }
          ]}
        >
          <View style={[styles.progressDetails, {
            width: logoSize,
            height: logoSize,
            borderRadius: logoSize / 2
          }]}>
            <Text style={styles.progressHours}>{currentHours.toFixed(1)}</Text>
            <Text style={styles.progressHoursLabel}>hours</Text>
            <Text style={styles.progressPercentage}>{percentage}%</Text>
            <Text style={styles.progressTarget}>of {targetHours}</Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const { user, isAdmin } = useAuth();
  const { getStudentHours } = useHours();
  const navigation = useNavigation();
  const [currentHours, setCurrentHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // Calculate responsive layout
  const isWeb = screenData.width > 768;
  const isTablet = screenData.width > 480 && screenData.width <= 768;
  const isMobile = screenData.width <= 480;
  
  // Responsive sizing calculations
  const getResponsiveSizes = () => {
    if (isWeb) {
      return {
        welcomeFontSize: 32,
        titleFontSize: 24,
        subtitleFontSize: 16,
        logoSize: 200,
        progressRingSize: 240,
        strokeWidth: 12,
        iconSize: 28,
        padding: 20,
        cardPadding: 20,
      };
    } else if (isTablet) {
      return {
        welcomeFontSize: 28,
        titleFontSize: 22,
        subtitleFontSize: 15,
        logoSize: 180,
        progressRingSize: 220,
        strokeWidth: 10,
        iconSize: 26,
        padding: 18,
        cardPadding: 18,
      };
    } else {
      return {
        welcomeFontSize: 24,
        titleFontSize: 20,
        subtitleFontSize: 14,
        logoSize: 140,
        progressRingSize: 180,
        strokeWidth: 10,
        iconSize: 24,
        padding: 16,
        cardPadding: 16,
      };
    }
  };

  const sizes = getResponsiveSizes();

  // Load current hours when component mounts
  useEffect(() => {
    const loadCurrentHours = async () => {
      if (user?.sNumber && !isAdmin) {
        try {
          const hours = await getStudentHours(user.sNumber);
          setCurrentHours(hours);
        } catch (error) {
          console.error('Failed to load current hours:', error);
        }
      }
      setLoading(false);
    };
    
    loadCurrentHours();
  }, [user, getStudentHours, isAdmin]);
  
  return (
    <View style={styles.container}>
      {/* Grid-based Layout */}
      <View style={styles.gridContainer}>
        
        {/* Row 1: Header Section */}
        <View style={[styles.headerRow, { paddingHorizontal: sizes.padding }]}>
          <Text style={[styles.welcome, { fontSize: sizes.welcomeFontSize }]}>
            Welcome, {user?.name || user?.sNumber || 'Member'}
          </Text>
        </View>

        {/* Row 2: Logo Section */}
        <View style={[styles.logoRow, { paddingHorizontal: sizes.padding }]}>
          {!isAdmin ? (
            <CircularProgressLogo 
              currentHours={currentHours}
              targetHours={25}
              size={sizes.progressRingSize}
              strokeWidth={sizes.strokeWidth}
              animated={true}
            />
          ) : (
            <Image 
              source={require('../assets/images/keyclublogo-modified.png')} 
              style={[styles.simpleLogo, { width: sizes.logoSize, height: sizes.logoSize }]} 
            />
          )}
        </View>

        {/* Row 3: Title Section */}
        <View style={[styles.titleRow, { paddingHorizontal: sizes.padding }]}>
          <Text style={[styles.title, { fontSize: sizes.titleFontSize }]}>
            Cypress Ranch Key Club
          </Text>
          <Text style={[styles.subtitle, { fontSize: sizes.subtitleFontSize }]}>
            {isAdmin ? 'Manage events and oversee club activities' : 'Track events, hours, and stay connected'}
          </Text>
        </View>

        {/* Row 4: Action Section */}
        <View style={[styles.actionRow, { paddingHorizontal: sizes.padding }]}>
          {!isAdmin ? (
            /* Hours Card for Students */
            <View style={[styles.hoursCard, { padding: sizes.cardPadding }]}>
              <View style={styles.hoursHeader}>
                <Ionicons name="trophy" size={sizes.iconSize} color="#ffd60a" />
                <View style={styles.hoursInfo}>
                  <Text style={[styles.hoursCardLabel, { fontSize: sizes.subtitleFontSize - 2 }]}>
                    Your Progress
                  </Text>
                  <Text style={[styles.hoursCardValue, { fontSize: sizes.subtitleFontSize + 2 }]}>
                    {loading ? '...' : `${currentHours.toFixed(1)} / 25 hours`}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.requestButton, { 
                  paddingVertical: isMobile ? 10 : isTablet ? 11 : 12 
                }]}
                onPress={() => navigation.navigate('Hours')}
              >
                <Ionicons name="add-circle-outline" size={sizes.iconSize - 8} color="#0d1b2a" />
                <Text style={[styles.requestButtonText, { fontSize: sizes.subtitleFontSize }]}>
                  Request Hours
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Admin Dashboard */
            <View style={[styles.adminCard, { padding: sizes.cardPadding }]}>
              <Text style={[styles.adminTitle, { fontSize: sizes.titleFontSize - 4 }]}>
                Admin Dashboard
              </Text>
              <View style={styles.adminButtons}>
                <TouchableOpacity
                  style={[styles.adminButton, { 
                    paddingVertical: isMobile ? 8 : isTablet ? 9 : 10 
                  }]}
                  onPress={() => navigation.navigate('Calendar', { screen: 'EventCreation' })}
                >
                  <Ionicons name="calendar" size={sizes.iconSize - 8} color="#0d1b2a" />
                  <Text style={[styles.adminButtonText, { fontSize: sizes.subtitleFontSize - 2 }]}>
                    Create Event
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.adminButton, { 
                    paddingVertical: isMobile ? 8 : isTablet ? 9 : 10 
                  }]}
                  onPress={() => navigation.navigate('Hours')}
                >
                  <Ionicons name="time" size={sizes.iconSize - 8} color="#0d1b2a" />
                  <Text style={[styles.adminButtonText, { fontSize: sizes.subtitleFontSize - 2 }]}>
                    Manage Hours
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  
  // Grid Layout Container
  gridContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  
  // Grid Rows
  headerRow: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    height: 140,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  
  // Header Styles
  welcome: {
    fontWeight: 'bold',
    color: '#ffd60a',
    textAlign: 'center',
  },
  
  // Logo Styles
  simpleLogo: {
    resizeMode: 'contain',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSvg: {
    position: 'absolute',
  },
  logoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoSide: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  backSide: {
    transform: [{ rotateY: '180deg' }],
  },
  logo: {
    opacity: 0.95,
  },
  progressDetails: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  progressHours: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  progressHoursLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 6,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  progressTarget: {
    fontSize: 10,
    color: '#ccc',
  },
  
  // Title Styles
  title: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 1.3,
    paddingHorizontal: 8,
  },
  
  // Action Section Styles
  hoursCard: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hoursInfo: {
    marginLeft: 12,
    flex: 1,
  },
  hoursCardLabel: {
    color: '#ccc',
    marginBottom: 4,
  },
  hoursCardValue: {
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd60a',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#0d1b2a',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  adminCard: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  adminTitle: {
    fontWeight: 'bold',
    color: '#ffd60a',
    textAlign: 'center',
    marginBottom: 15,
  },
  adminButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd60a',
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#0d1b2a',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});