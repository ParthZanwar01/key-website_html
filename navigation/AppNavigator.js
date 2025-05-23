import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Screens
import LandingScreen from '../screens/LandingScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import StudentLoginScreen from '../screens/StudentLoginScreen';
import StudentVerificationScreen from '../screens/StudentVerificationScreen';
import StudentAccountCreationScreen from '../screens/StudentAccountCreationScreen';
import CalendarScreen from '../screens/CalendarScreen';
import EventScreen from '../screens/EventScreen';
import EventCreationScreen from '../screens/EventCreationScreen';
import EventDeletionScreen from '../screens/EventDeletionScreen';
import AttendeeListScreen from '../screens/AttendeeListScreen';
import OfficersScreen from '../screens/OfficersScreen';
import HomeScreen from '../screens/HomeScreen';
import ContactScreen from '../screens/ContactScreen';
// Removed CheckInScreen import

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function CalendarStack({ navigation }) {
  const { logout } = useAuth();
  
  // Update logout handler function in AppNavigator.js
  const handleLogout = async () => {
    try {
      const success = await logout();
      // Always navigate regardless of success to ensure user can get back to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to Landing screen even if there's an error
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
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
      <Stack.Screen name="Event" component={EventScreen} options={{ title: "Event Details" }} />
      <Stack.Screen name="EventCreation" component={EventCreationScreen} options={{ title: "Create Event" }} />
      <Stack.Screen name="EventDeletion" component={EventDeletionScreen} options={{ title: "Manage Events" }} />
      <Stack.Screen name="AttendeeList" component={AttendeeListScreen} options={{ title: "Attendees" }} />
    </Stack.Navigator>
  );
}

function MainTabNavigator({ navigation }) {
  const { logout, isAdmin } = useAuth();

  // Centralized logout handler
  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to Landing screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Still try to navigate even if there's an error
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Officers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Create Event') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ffca3b',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {/* Middle tab */}
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

      {/* Left tab */}
      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{ headerShown: false }}
      />

      {/* Right tab */}
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

      {/* Only visible to admin */}
      {isAdmin && (
        <Tab.Screen
          name="Create Event"
          component={EventCreationScreen}
          options={{
            tabBarIcon: ({ focused, size, color }) => (
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={size}
                color={color}
              />
            ),
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
      )}

      {/* Only visible to student logins */}
      {!isAdmin && (
        <Tab.Screen
          name="Contact"
          component={ContactScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'mail' : 'mail-outline'}
                size={size}
                color={color}
              />
            ),
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
      )}
      {/* Removed CheckIn tab completely */}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
      <Stack.Screen name="StudentVerification" component={StudentVerificationScreen} />
      <Stack.Screen name="StudentAccountCreation" component={StudentAccountCreationScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}