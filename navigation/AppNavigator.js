import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LandingScreen from '../screens/LandingScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import StudentLoginScreen from '../screens/StudentLoginScreen';
import CalendarScreen from '../screens/CalendarScreen';
import OfficersScreen from '../screens/OfficersScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Officers') {
            iconName = focused ? 'people' : 'people-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ffca3b',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => (
          <Ionicons
            name="log-out-outline"
            size={24}
            color="black"
            style={{ marginRight: 15 }}
            onPress={() => {
              const { logout } = useAuth();
              logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
              });
            }}
          />
        ),
      })}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Officers" component={OfficersScreen} />
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