import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function SocialMediaScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState({});
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for Instagram icons
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start(pulseAnimation);
    };
    pulseAnimation();
  }, []);

  const handleGoBack = () => {
    navigation.navigate('Home');
  };

  const openInstagram = async (url, name) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Cannot Open Instagram',
          'Instagram app is not installed. Would you like to visit the web version?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open in Browser', 
              onPress: () => Linking.openURL(url.replace('instagram://', 'https://instagram.com/'))
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening Instagram:', error);
      Alert.alert('Error', 'Unable to open Instagram. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const socialMediaAccounts = [
    {
      id: 'ranch',
      name: 'Cypress Ranch Key Club',
      handle: '@ranchkeyclub',
      url: 'https://www.instagram.com/ranchkeyclub',
      description: 'Follow us for club updates, event photos, and volunteer opportunities!',
      gradient: ['#E1306C', '#F56040', '#FCAF45'],
      icon: 'logo-instagram',
      followers: 'Your School Key Club'
    },
    {
      id: 'tokey',
      name: 'Texas-Oklahoma District',
      handle: '@tokeyclub',
      url: 'https://www.instagram.com/tokeyclub',
      description: 'Stay connected with the Texas-Oklahoma Key Club District for district events and news.',
      gradient: ['#405DE6', '#5851DB', '#833AB4'],
      icon: 'logo-instagram',
      followers: 'District Level Updates'
    }
  ];



  const renderSocialCard = (account, index) => (
    <Animated.View
      key={account.id}
      style={[
        styles.socialCard,
        {
          opacity: fadeAnim,
          transform: [
            { 
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50 + (index * 20)]
              })
            }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={account.gradient}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Ionicons name={account.icon} size={32} color="#ffffff" />
          </Animated.View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountHandle}>{account.handle}</Text>
            <Text style={styles.accountFollowers}>{account.followers}</Text>
          </View>
        </View>
        
        <Text style={styles.accountDescription}>{account.description}</Text>
        
        <TouchableOpacity
          style={styles.followButton}
          onPress={() => openInstagram(account.url, account.id)}
          activeOpacity={0.8}
          disabled={loading[account.id]}
        >
          {loading[account.id] ? (
            <Text style={styles.followButtonText}>Opening...</Text>
          ) : (
            <>
              <Ionicons name="logo-instagram" size={20} color="#ffffff" />
              <Text style={styles.followButtonText}>Follow on Instagram</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={handleGoBack} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#4299e1" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <View style={styles.headerIconTitleContainer}>
              <Ionicons name="logo-instagram" size={28} color="#E1306C" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Follow Us</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Stay connected with Key Club on social media
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          {/* Main Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={24} color="#4299e1" />
              <Text style={styles.sectionTitle}>Your Key Club Community</Text>
            </View>
            
            {socialMediaAccounts.map((account, index) => renderSocialCard(account, index))}
          </View>



          {/* Tips Section */}
          <Animated.View
            style={[
              styles.tipsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="lightbulb" size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Social Media Tips</Text>
            </View>
            
            <View style={styles.tipsContainer}>
              <View style={styles.tipItem}>
                <Ionicons name="camera" size={20} color="#4299e1" />
                <Text style={styles.tipText}>Tag us in your volunteer photos!</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="heart" size={20} color="#E1306C" />
                <Text style={styles.tipText}>Like and share our posts to spread awareness</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="chatbubble" size={20} color="#10B981" />
                <Text style={styles.tipText}>Comment on posts to engage with the community</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="notifications" size={20} color="#8B5CF6" />
                <Text style={styles.tipText}>Turn on notifications to never miss updates</Text>
              </View>
            </View>
          </Animated.View>

          {/* Call to Action */}
          <Animated.View
            style={[
              styles.ctaSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['#E1306C', '#F56040']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people" size={40} color="#ffffff" />
              <Text style={styles.ctaTitle}>Join Our Community!</Text>
              <Text style={styles.ctaText}>
                Follow our social media accounts to stay updated on upcoming events, 
                see photos from recent volunteer activities, and connect with fellow Key Club members.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Key Club International • Serving Others • Building Character • Developing Leadership
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  header: {
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#4299e1',
    paddingVertical: 25,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerIconTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 8,
  },
  backButton: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 153, 225, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.3)',
    shadowColor: '#4299e1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    minWidth: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299e1',
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4299e1',
    marginLeft: 12,
    textShadowColor: 'rgba(66, 153, 225, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  socialCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
    padding: 25,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  accountHandle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  accountFollowers: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  accountDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  tipsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(66, 153, 225, 0.2)',
  },
  tipsContainer: {
    marginTop: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 15,
    color: '#e2e8f0',
    marginLeft: 15,
    flex: 1,
    lineHeight: 22,
  },
  ctaSection: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaGradient: {
    padding: 30,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#cbd5e0',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
}); 