import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

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
import HourRequestScreen from '../screens/HourRequestScreen';
import StudentHourRequestsScreen from '../screens/StudentHourRequestsScreen';
import AdminHourManagementScreen from '../screens/AdminHourManagementScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function CalendarStack() {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      // Don't manually navigate - let the AppNavigator handle this automatically
      // The auth state change will trigger the navigation
    } catch (error) {
      console.error("Logout error:", error);
      // Still attempt logout even if there's an error
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
      <Stack.Screen name="Event" component={EventScreen} options={{ title: "Event Details" }} />
      <Stack.Screen name="EventCreation" component={EventCreationScreen} options={{ title: "Create Event" }} />
      <Stack.Screen name="EventDeletion" component={EventDeletionScreen} options={{ title: "Manage Events" }} />
      <Stack.Screen name="AttendeeList" component={AttendeeListScreen} options={{ title: "Attendees" }} />
      
      {/* Hour Management Screens */}
      <Stack.Screen name="HourRequest" component={HourRequestScreen} options={{ title: "Request Hours" }} />
      <Stack.Screen name="HourRequests" component={StudentHourRequestsScreen} options={{ title: "My Hour Requests" }} />
      <Stack.Screen name="AdminHourManagement" component={AdminHourManagementScreen} options={{ title: "Manage Hour Requests" }} />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  const { logout, isAdmin } = useAuth();

  // Centralized logout handler
  const handleLogout = async () => {
    try {
      await logout();
      // Don't manually navigate - let the AppNavigator handle this automatically
      // The auth state change will trigger the navigation to auth screens
    } catch (error) {
      console.error("Logout error:", error);
      // Still attempt logout even if there's an error
      await logout();
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
          } else if (route.name === 'Hours') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Officers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Create Event') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Contact') {
            iconName = focused ? 'help-circle' : 'help-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ffca3b',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {/* Home tab - Available to all users */}
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

      {/* Calendar tab - Available to all users */}
      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{ headerShown: false }}
      />

      {/* Hours tab - Different screens for admin vs student */}
      <Tab.Screen
        name="Hours"
        component={isAdmin ? AdminHourManagementScreen : HourRequestScreen}
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

      {/* Officers tab - Available to all users */}
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

      {/* Contact/Support tab - Available to all users but with different functionality */}
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: isAdmin ? 'Support Center' : 'Contact',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={isAdmin ? (focused ? 'help-circle' : 'help-circle-outline') : (focused ? 'mail' : 'mail-outline')}
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

      {/* Create Event tab - Only visible to admins */}
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
    </Tab.Navigator>
  );
}

// Loading component
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

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // User is authenticated - show main app
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        // User is not authenticated - show auth screens
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
          <Stack.Screen name="StudentVerification" component={StudentVerificationScreen} />
          <Stack.Screen name="StudentAccountCreation" component={StudentAccountCreationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}