import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const adminButtonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(buttonAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: false,
      }),
      Animated.spring(adminButtonAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: false,
      })
    ]).start();

    // Start pulsing animation for logo
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      ]).start(pulseAnimation);
    };
    pulseAnimation();
  }, []);

  // Floating sparkles component


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      
      <Animated.View
        style={{
          opacity: logoAnim,
          transform: [
            { scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
            { scale: pulseAnim }
          ]
        }}
      >
        <Image 
          source={require('../assets/images/keyclublogo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.title,
          {
            opacity: titleAnim,
            transform: [
              { translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }
            ]
          }
        ]}
      >
        Cypress Ranch Key Club
      </Animated.Text>
      
      <Animated.Text 
        style={[
          styles.subtitle,
          {
            opacity: subtitleAnim,
            transform: [
              { translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
            ]
          }
        ]}
      >
        Track events, hours, and stay connected
      </Animated.Text>
      
      <View style={styles.buttonContainer}>
        <Animated.View
          style={{
            opacity: buttonAnim,
            transform: [
              { translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
              { scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
            ]
          }}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('AuthScreen')}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Student Login</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            opacity: adminButtonAnim,
            transform: [
              { translateY: adminButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
              { scale: adminButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
            ]
          }}
        >
          <TouchableOpacity
            style={[styles.button, styles.adminButton]}
            onPress={() => navigation.navigate('AdminLogin')}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Admin Login</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            opacity: adminButtonAnim,
            transform: [
              { translateY: adminButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
              { scale: adminButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
            ]
          }}
        >
          <TouchableOpacity
            style={[styles.button, styles.publicButton]}
            onPress={() => navigation.navigate('PublicEvents')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>View Public Events</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      <View style={styles.helpContainer}>
        <Ionicons name="information-circle" size={16} color="#999" />
        <Text style={styles.helpText}>Need help? Contact your Key Club sponsor</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#1a365d', // Deep navy blue background
    padding: 20
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#4299e1', // Professional blue
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#e2e8f0', // Light gray
    marginBottom: 50,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  button: { 
    backgroundColor: '#4299e1', // Professional blue
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16, 
    marginVertical: 10, 
    width: '100%', 
    maxWidth: 300,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  adminButton: {
    backgroundColor: 'rgba(66, 153, 225, 0.9)', // Professional blue with slight transparency
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#4299e1',
  },
  publicButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)', // Green for public access
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  buttonText: { 
    color: '#ffffff', // White for contrast against professional blue
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  helpContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    color: '#cbd5e0', // Medium gray
    fontSize: 14,
    marginLeft: 5,
  },
});