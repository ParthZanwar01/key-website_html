import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LandingScreen from '../screens/LandingScreen';
import AuthScreen from '../screens/AuthScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import StudentLoginScreen from '../screens/StudentLoginScreen';
import StudentVerificationScreen from '../screens/StudentVerificationScreen';
import StudentAccountCreationScreen from '../screens/StudentAccountCreationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import CalendarScreen from '../screens/CalendarScreen';
import EventScreen from '../screens/EventScreen';
import EventCreationScreen from '../screens/EventCreationScreen';
import EventDeletionScreen from '../screens/EventDeletionScreen';
import AttendeeListScreen from '../screens/AttendeeListScreen';
import OfficersScreen from '../screens/OfficersScreen';
import HomeScreen from '../screens/HomeScreen';
import ContactScreen from '../screens/ContactScreen';
import HourRequestScreen from '../screens/HourRequestScreen';
import StudentHourRequestsScreen from '../screens/StudentHourRequestsScreen';
import AdminHourManagementScreen from '../screens/AdminHourManagementScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import CreateAnnouncementScreen from '../screens/CreateAnnouncementScreen';
import AnimationScreen from '../screens/AnimationScreen';
import SplashAnimationScreen from '../screens/SplashAnimationScreen'; // New splash screen
import GoogleDriveService from '../screens/GoogleDriveService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Calendar Stack Navigator
function CalendarStack() {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      await logout();
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen 
        name="CalendarMain" 
        component={CalendarScreen} 
        options={{ title: "Calendar" }}
      />
      <Stack.Screen 
        name="Event" 
        component={EventScreen} 
        options={{ title: "Event Details" }} 
      />
      <Stack.Screen 
        name="EventCreation" 
        component={EventCreationScreen} 
        options={{ title: "Create Event" }} 
      />
      <Stack.Screen 
        name="EventDeletion" 
        component={EventDeletionScreen} 
        options={{ title: "Manage Events" }} 
      />
      <Stack.Screen 
        name="AttendeeList" 
        component={AttendeeListScreen} 
        options={{ title: "Attendees" }} 
      />
      <Stack.Screen 
        name="HourRequest" 
        component={HourRequestScreen} 
        options={{ title: "Request Hours" }} 
      />
      <Stack.Screen 
        name="HourRequests" 
        component={StudentHourRequestsScreen} 
        options={{ title: "My Hour Requests" }} 
      />
      <Stack.Screen 
        name="AdminHourManagement" 
        component={AdminHourManagementScreen} 
        options={{ title: "Manage Hour Requests" }} 
      />
    </Stack.Navigator>
  );
}

// Announcements Stack Navigator
function AnnouncementsStack() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      await logout();
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen 
        name="AnnouncementsMain" 
        component={AnnouncementsScreen} 
        options={{ title: "Announcements" }}
      />
      <Stack.Screen 
        name="CreateAnnouncement" 
        component={CreateAnnouncementScreen} 
        options={{ title: "Create Announcement" }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      await logout();
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Hours':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Announcements':
              iconName = focused ? 'megaphone' : 'megaphone-outline';
              break;
            case 'Officers':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Contact':
              iconName = isAdmin 
                ? (focused ? 'help-circle' : 'help-circle-outline')
                : (focused ? 'mail' : 'mail-outline');
              break;
            default:
              iconName = 'ellipse';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ffca3b',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="log-out-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Hours"
        component={isAdmin ? AdminHourManagementScreen : HourRequestScreen}
        options={{
          title: isAdmin ? 'Manage Hours' : 'Hours',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="log-out-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name="Announcements"
        component={AnnouncementsStack}
        options={{ 
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "megaphone" : "megaphone-outline"} 
              color={color} 
              size={size} 
            />
          ),
        }}
      />

      <Tab.Screen
        name="Officers"
        component={OfficersScreen}
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="log-out-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: isAdmin ? 'Support' : 'Contact',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="log-out-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#94cfec' 
    }}>
      <ActivityIndicator size="large" color="#59a2f0" />
    </View>
  );
}

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen 
        name="Landing" 
        component={LandingScreen} 
      />
      <Stack.Screen 
        name="AuthScreen" 
        component={AuthScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Stack.Screen 
        name="AdminLogin" 
        component={AdminLoginScreen}
        options={{
          headerShown: true,
          headerTitle: 'Admin Login',
          headerStyle: { backgroundColor: '#add8e6' },
          headerTintColor: '#333',
        }}
      />
      <Stack.Screen 
        name="StudentLogin" 
        component={StudentLoginScreen}
        options={{
          headerShown: true,
          headerTitle: 'Student Login',
          headerStyle: { backgroundColor: '#add8e6' },
          headerTintColor: '#333',
        }}
      />
      <Stack.Screen 
        name="StudentVerification" 
        component={StudentVerificationScreen}
        options={{
          headerShown: true,
          headerTitle: 'Verify Student',
          headerStyle: { backgroundColor: '#add8e6' },
          headerTintColor: '#333',
        }}
      />
      <Stack.Screen 
        name="StudentAccountCreation" 
        component={StudentAccountCreationScreen}
        options={{
          headerShown: true,
          headerTitle: 'Create Account',
          headerStyle: { backgroundColor: '#add8e6' },
          headerTintColor: '#333',
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ 
          headerShown: true,
          headerTitle: 'Reset Password',
          headerStyle: { backgroundColor: '#add8e6' },
          headerTintColor: '#333',
        }} 
      />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { isAuthenticated, loading, showAnimation, showSplashAnimation, hideSplashAnimation } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Show initial splash animation when app first loads
  if (showSplashAnimation) {
    return (
      <SplashAnimationScreen 
        onAnimationComplete={hideSplashAnimation}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        showAnimation ? (
          <Stack.Screen 
            name="Animation" 
            component={AnimationScreen}
            options={{
              animationEnabled: false,
              gestureEnabled: false,
            }}
          />
        ) : (
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator}
            options={{
              animationEnabled: true,
              animationTypeForReplace: 'push',
            }}
          />
        )
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            animationEnabled: true,
            animationTypeForReplace: 'pop',
          }}
        />
      )}
    </Stack.Navigator>
  );
}