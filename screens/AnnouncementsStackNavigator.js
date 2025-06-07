// screens/AnnouncementsStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AnnouncementsScreen from './AnnouncementsScreen';
import CreateAnnouncementScreen from './CreateAnnouncementScreen';

const Stack = createStackNavigator();

export default function AnnouncementsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AnnouncementsMain"
        component={AnnouncementsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateAnnouncement"
        component={CreateAnnouncementScreen}
        options={{ title: 'Create Announcement' }}
      />
    </Stack.Navigator>
  );
}
