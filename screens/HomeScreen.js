import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
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
  
  // Debug logging - only log once when values change
  useEffect(() => {
    console.log('Target Hours:', targetHours, 'Current Hours:', currentHours, 'Percentage:', percentage);
  }, [targetHours, currentHours, percentage]);
  
  // Circle properties - make the progress ring go all the way around
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
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
        animatedValue.current += diff * 0.08; // Smooth easing
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
              width: size * 0.6, 
              height: size * 0.6 
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
          <View style={styles.progressDetails}>
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
      {/* Header with Welcome Message */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.name || user?.sNumber || 'Member'}</Text>
      </View>

      {/* Logo with Progress Ring for Students */}
      {!isAdmin ? (
        <View style={styles.logoSection}>
          <CircularProgressLogo 
            currentHours={currentHours}
            targetHours={25}
            size={240}
            strokeWidth={8}
            animated={true}
          />
        </View>
      ) : (
        /* Simple logo for admins */
        <Image source={require('../assets/images/keyclublogo-modified.png')} style={styles.simpleLogo} />
      )}
      
      <Text style={styles.title}>Cypress Ranch Key Club</Text>
      
      {/* Hours Card for Students */}
      {!isAdmin && (
        <View style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <Ionicons name="trophy" size={32} color="#ffd60a" />
            <View style={styles.hoursInfo}>
              <Text style={styles.hoursCardLabel}>Your Progress</Text>
              <Text style={styles.hoursCardValue}>
                {loading ? '...' : `${currentHours.toFixed(1)} / 75 hours`}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => navigation.navigate('Hours')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#0d1b2a" />
            <Text style={styles.requestButtonText}>Request Hours</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin Dashboard */}
      {isAdmin && (
        <View style={styles.adminCard}>
          <Text style={styles.adminTitle}>Admin Dashboard</Text>
          <View style={styles.adminButtons}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Calendar', { screen: 'EventCreation' })}
            >
              <Ionicons name="calendar" size={20} color="#0d1b2a" />
              <Text style={styles.adminButtonText}>Create Event</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Hours')}
            >
              <Ionicons name="time" size={20} color="#0d1b2a" />
              <Text style={styles.adminButtonText}>Manage Hours</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <Text style={styles.subtitle}>
        {isAdmin ? 'Manage events and oversee club activities' : 'Track events, hours, and stay connected'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logoSection: {
    marginBottom: 60,
    alignItems: 'center',
  },
  simpleLogo: {
    width: 200,
    height: 200,
    marginBottom: 20,
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
    borderRadius: 120,
    width: 240 * 0.6,
    height: 240 * 0.6,
    borderWidth: 2,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  progressHours: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  progressHoursLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  progressTarget: {
    fontSize: 12,
    color: '#ccc',
  },
  progressTextContainer: {
    position: 'absolute',
    bottom: -50,
    alignItems: 'center',
    zIndex: 2,
  },
  hoursText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  hoursLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd60a',
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffd60a',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 60,
    marginTop: 0,
  },
  hoursCard: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  hoursInfo: {
    marginLeft: 15,
    flex: 1,
  },
  hoursCardLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  hoursCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd60a',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd60a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#0d1b2a',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  adminCard: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  adminTitle: {
    fontSize: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#0d1b2a',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
});