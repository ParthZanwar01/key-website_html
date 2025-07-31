import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useHours } from '../contexts/HourContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && { minHeight: '100vh' }),
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    minHeight: screenHeight,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 30,
  },
  button: {
    width: '100%',
    backgroundColor: '#4a90e2',
    marginBottom: 12,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#102644',
    padding: 20,
    marginTop: 40,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
  },
  profileName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileRole: {
    color: 'lightgray',
    fontSize: 12,
    marginTop: 5,
  },
  
  // Hamburger Menu Styles
  hamburgerButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    width: '100%',
    height: '100%',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: Platform.OS === 'web' ? '100vh' : screenHeight,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    flexDirection: 'column',
    flex: 1,
    zIndex: 10000,
    overflow: 'hidden',
  },
  menuHeader: {
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: Platform.OS === 'web' ? 10 : 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#1a365d',
  },
  menuUserInfo: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 8 : 20,
  },
  menuUserAvatar: {
    width: Platform.OS === 'web' ? 40 : 60,
    height: Platform.OS === 'web' ? 40 : 60,
    borderRadius: Platform.OS === 'web' ? 20 : 30,
    backgroundColor: '#4299e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'web' ? 4 : 10,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  menuUserRole: {
    fontSize: 14,
    color: '#cbd5e0',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
    marginTop: Platform.OS === 'web' ? 20 : 0,
    overflow: 'auto',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  menuItemIcon: {
    width: Platform.OS === 'web' ? 28 : 40,
    height: Platform.OS === 'web' ? 28 : 40,
    borderRadius: Platform.OS === 'web' ? 14 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  menuItemArrow: {
    color: '#a0aec0',
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53e3e',
  },
});

export default function HomeScreen() {
  const { user, isAdmin, logout } = useAuth();
  const { getStudentHours } = useHours();
  const navigation = useNavigation();
  const [currentHours, setCurrentHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [previousHours, setPreviousHours] = useState(0);
  
  // Animations
  const menuSlideAnim = useRef(new Animated.Value(-300)).current;

  // Load current hours when component mounts
  useEffect(() => {
    const loadCurrentHours = async () => {
      if (user?.sNumber && !isAdmin) {
        const hours = await getStudentHours(user.sNumber);
        setCurrentHours(hours);
      }
      setLoading(false);
    };
    loadCurrentHours();
  }, [user, getStudentHours, isAdmin]);

  const toggleMenu = () => {
    const toValue = menuVisible ? 0 : 1;
    setMenuVisible(!menuVisible);
    
    Animated.timing(menuSlideAnim, {
      toValue: toValue === 1 ? 0 : -300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const navigateTo = (screen) => {
    setTimeout(() => {
      if (screen === 'home') {
        navigation.navigate('Home');
      } else if (screen === 'calendar') {
        navigation.navigate('Calendar');
      } else if (screen === 'hours') {
        if (isAdmin) {
          navigation.navigate('Calendar', { screen: 'AdminHourManagement' });
        } else {
          navigation.navigate('Calendar', { screen: 'HourRequest' });
        }
      } else if (screen === 'announcements') {
        navigation.navigate('Announcements');
      } else if (screen === 'officers') {
        navigation.navigate('Officers');
      } else if (screen === 'contact' || screen === 'help') {
        navigation.navigate('Contact');
      } else if (screen === 'studentManagement') {
        navigation.navigate('AdminStudentManagement');
      } else if (screen === 'Logout' || screen === 'logout') {
        logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    }, 150);
  };

  const menuItems = [
    {
      id: 'home',
      title: 'Home',
      icon: 'home',
      gradient: ['#4299e1', '#3182ce'],
      action: () => navigateTo('Home')
    },
    {
      id: 'calendar',
      title: 'Events',
      icon: 'calendar',
      gradient: ['#38b2ac', '#319795'],
      action: () => navigateTo('Calendar')
    },
    {
      id: 'hours',
      title: isAdmin ? 'Review Hours' : 'Request Hours',
      icon: isAdmin ? 'time' : 'add-circle',
      gradient: ['#ed8936', '#dd6b20'],
      action: () => navigateTo(isAdmin ? 'hours' : 'hours')
    },
    {
      id: 'announcements',
      title: 'Announcements',
      icon: 'megaphone',
      gradient: ['#9f7aea', '#805ad5'],
      action: () => navigateTo('Announcements')
    },
    {
      id: 'officers',
      title: 'Officers',
      icon: 'people',
      gradient: ['#48bb78', '#38a169'],
      action: () => navigateTo('Officers')
    },
    {
      id: 'contact',
      title: isAdmin ? 'Help' : 'Contact',
      icon: isAdmin ? 'help-circle' : 'mail',
      gradient: ['#ed64a6', '#d53f8c'],
      action: () => navigateTo('Contact')
    },
    ...(isAdmin ? [{
      id: 'studentManagement',
      title: 'Student Management',
      icon: 'people',
      gradient: ['#4299e1', '#3182ce'],
      action: () => navigateTo('studentManagement')
    }] : []),
  ];

  return (
    <SafeAreaView style={[styles.safeArea, Platform.OS === 'web' && { flex: 1, minHeight: '100vh' }]}>
      {/* Hamburger Button */}
      <LinearGradient
        colors={['#4299e1', '#3182ce']}
        style={styles.hamburgerButton}
      >
        <TouchableOpacity onPress={toggleMenu} activeOpacity={0.8}>
          <Ionicons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Key Club</Text>
        <Text style={styles.subtitle}>
          {isAdmin ? 'Manage events and oversee club activities' : 'Track events, hours, and stay connected'}
        </Text>

        <View style={styles.buttonContainer}>
          {isAdmin ? (
            <>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('studentManagement')}>
                <Text style={styles.buttonText}>View Registered Users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('calendar')}>
                <Text style={styles.buttonText}>Check In Members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('announcements')}>
                <Text style={styles.buttonText}>Send Announcements</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('calendar')}>
                <Text style={styles.buttonText}>Manage Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('hours')}>
                <Text style={styles.buttonText}>Review Volunteer Logs</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('calendar')}>
                <Text style={styles.buttonText}>View Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('hours')}>
                <Text style={styles.buttonText}>Request Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('announcements')}>
                <Text style={styles.buttonText}>View Announcements</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigateTo('officers')}>
                <Text style={styles.buttonText}>Meet Officers</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileName}>
            {user?.name || user?.sNumber || 'Member'}
          </Text>
          <Text style={styles.profileRole}>
            {isAdmin ? 'Administrator' : 'Student'}
          </Text>
        </View>
      </ScrollView>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleMenu}
        accessibilityViewIsModal={true}
        accessibilityLabel="Navigation Menu"
      >
        <View style={styles.menuModal}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={toggleMenu}
            activeOpacity={1}
          />
          
          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [{ translateX: menuSlideAnim }]
              }
            ]}
          >
            <View style={styles.menuHeader}>
              <View style={styles.menuUserInfo}>
                <LinearGradient
                  colors={['#4299e1', '#3182ce']}
                  style={styles.menuUserAvatar}
                >
                  <Ionicons name="person" size={30} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.menuUserName}>
                  {user?.name || user?.sNumber || 'Member'}
                </Text>
                <Text style={styles.menuUserRole}>
                  {isAdmin ? 'Administrator' : 'Student'}
                </Text>
              </View>
            </View>
            
            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => {
                    console.log('Sidebar tab pressed:', item.id);
                    toggleMenu();
                    setTimeout(() => navigateTo(item.id), 150);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Navigate to ${item.title}`}
                >
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.menuItemIcon}
                  >
                    <Ionicons name={item.icon} size={20} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} style={styles.menuItemArrow} />
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.menuFooter}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => navigateTo('Logout')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Logout"
              >
                <View style={styles.logoutIcon}>
                  <Ionicons name="log-out" size={20} color="#ffffff" />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}