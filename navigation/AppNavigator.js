import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { TouchableOpacity } from 'react-native';

// Import screens
import CalendarScreen from '../screens/CalendarScreen';
import LoginScreen from '../screens/LoginScreen';
import AdminScreen from '../screens/AdminScreen';
import EventScreen from '../screens/EventScreen';
import OfficersScreen from '../screens/OfficersScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Officers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f1ca3b',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ headerRight: () => (
      <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
        <Text style={{ color: '#1fca3b' }}>Logout</Text>
      </TouchableOpacity>
    ),
    headerShown: true, }} />
      <Tab.Screen name="Officers" component={OfficersScreen} options={{ headerRight: () => (
      <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
        <Text style={{ color: '#1fca3b' }}>Logout</Text>
      </TouchableOpacity>
    ),
    headerShown: true, }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { currentUser } = useAuth();

  return (
    <Stack.Navigator>
      {currentUser ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Event" component={EventScreen} />
          {currentUser.role === 'admin' && (
            <Stack.Screen name="Admin" component={AdminScreen} />
          )}
           <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
           <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
           <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}