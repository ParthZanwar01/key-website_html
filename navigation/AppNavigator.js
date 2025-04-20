import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LandingScreen from '../screens/LandingScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import StudentLoginScreen from '../screens/StudentLoginScreen';
import CalendarScreen from '../screens/CalendarScreen';
import EventScreen from '../screens/EventScreen';
import EventCreationScreen from '../screens/EventCreationScreen';
import OfficersScreen from '../screens/OfficersScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function CalendarStack({ navigation }) {
  // We need to access the parent navigation for logout
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
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
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  const { logout, isAdmin } = useAuth();

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
  {/* Left tab */}
  <Tab.Screen
    name="Calendar"
    component={CalendarStack}
    options={{ headerShown: false }}
  />

  {/* Middle tab */}
  <Tab.Screen
  name="Home"
  component={HomeScreen}
  options={({ navigation }) => ({
    headerRight: () => (
      <TouchableOpacity
        onPress={() => {
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Landing' }],
          });
        }}
        style={{ marginRight: 15 }}
      >
        <Ionicons name="log-out-outline" size={24} color="black" />
      </TouchableOpacity>
    ),
  })}
/>

  {/* Right tab */}
  <Tab.Screen
    name="Officers"
    component={OfficersScreen}
    options={{
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            });
          }}
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
      options={({ navigation }) => ({
        tabBarIcon: ({ focused, size, color }) => (
          <Ionicons
            name={focused ? 'add-circle' : 'add-circle-outline'}
            size={size}
            color={color}
          />
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
              });
            }}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="log-out-outline" size={24} color="black" />
          </TouchableOpacity>
        ),
      })}
    />
  )}
  </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}