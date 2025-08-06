import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHelper } from '../contexts/HelperContext';
import { useAuth } from '../contexts/AuthContext';

export default function HelpSettingsScreen({ navigation }) {
  const { 
    tutorialState, 
    toggleTooltips, 
    toggleSuggestions, 
    setHelpLevel, 
    resetTutorialProgress,
    startTutorial 
  } = useHelper();
  const { isAdmin } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Tutorial Progress',
      'This will reset all your tutorial progress and show tutorials again. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetTutorialProgress();
              Alert.alert('Success', 'Tutorial progress has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset tutorial progress.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const helpLevels = [
    { key: 'basic', label: 'Basic', description: 'Essential features only' },
    { key: 'intermediate', label: 'Intermediate', description: 'Most features with tips' },
    { key: 'advanced', label: 'Advanced', description: 'All features with detailed guidance' },
  ];

  const tutorials = [
    {
      id: 'welcome',
      title: 'Welcome Tour',
      description: 'Learn the basics of the Key Club app',
      completed: tutorialState.completedTutorials.includes('welcome'),
    },
    {
      id: 'studentFeatures',
      title: 'Student Features',
      description: 'Discover features available to students',
      completed: tutorialState.completedTutorials.includes('studentFeatures'),
      showFor: 'student',
    },
    {
      id: 'adminFeatures',
      title: 'Admin Features',
      description: 'Learn about administrative tools',
      completed: tutorialState.completedTutorials.includes('adminFeatures'),
      showFor: 'admin',
    },
  ];

  const renderTutorialItem = (tutorial) => {
    if (tutorial.showFor && tutorial.showFor !== (isAdmin ? 'admin' : 'student')) {
      return null;
    }

    return (
      <TouchableOpacity
        key={tutorial.id}
        style={styles.tutorialItem}
        onPress={() => startTutorial(tutorial.id)}
      >
        <View style={styles.tutorialInfo}>
          <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
          <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
        </View>
        <View style={styles.tutorialStatus}>
          {tutorial.completed ? (
            <Ionicons name="checkmark-circle" size={24} color="#48bb78" />
          ) : (
            <Ionicons name="play-circle" size={24} color="#4299e1" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4299e1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle" size={20} color="#4299e1" />
              <Text style={styles.settingLabel}>Show Tooltips</Text>
            </View>
            <Switch
              value={tutorialState.showTooltips}
              onValueChange={toggleTooltips}
              trackColor={{ false: '#e2e8f0', true: '#4299e1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="bulb" size={20} color="#4299e1" />
              <Text style={styles.settingLabel}>Show Suggestions</Text>
            </View>
            <Switch
              value={tutorialState.showSuggestions}
              onValueChange={toggleSuggestions}
              trackColor={{ false: '#e2e8f0', true: '#4299e1' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Help Level Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help Level</Text>
          <Text style={styles.sectionDescription}>
            Choose how much help and guidance you want to see
          </Text>
          
          {helpLevels.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.helpLevelItem,
                tutorialState.helpLevel === level.key && styles.helpLevelActive,
              ]}
              onPress={() => setHelpLevel(level.key)}
            >
              <View style={styles.helpLevelInfo}>
                <Text style={[
                  styles.helpLevelTitle,
                  tutorialState.helpLevel === level.key && styles.helpLevelTitleActive,
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.helpLevelDescription}>{level.description}</Text>
              </View>
              {tutorialState.helpLevel === level.key && (
                <Ionicons name="checkmark" size={20} color="#4299e1" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tutorials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutorials</Text>
          <Text style={styles.sectionDescription}>
            Replay tutorials to refresh your knowledge
          </Text>
          
          {tutorials.map(renderTutorialItem)}
        </View>

        {/* Reset Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reset Progress</Text>
          <Text style={styles.sectionDescription}>
            Reset all tutorial progress and start fresh
          </Text>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetProgress}
            disabled={resetting}
          >
            <Ionicons name="refresh" size={20} color="#e53e3e" />
            <Text style={styles.resetButtonText}>
              {resetting ? 'Resetting...' : 'Reset Tutorial Progress'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help Resources</Text>
          
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => navigation.navigate('Contact')}
          >
            <Ionicons name="mail" size={20} color="#4299e1" />
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Contact Support</Text>
              <Text style={styles.resourceDescription}>Get help from club officers</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => navigation.navigate('Officers')}
          >
            <Ionicons name="people" size={20} color="#4299e1" />
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Club Officers</Text>
              <Text style={styles.resourceDescription}>Contact information for officers</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e0" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        paddingTop: 10,
      },
    }),
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2d3748',
    marginLeft: 12,
  },
  helpLevelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  helpLevelActive: {
    borderColor: '#4299e1',
    backgroundColor: '#ebf8ff',
  },
  helpLevelInfo: {
    flex: 1,
  },
  helpLevelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  helpLevelTitleActive: {
    color: '#4299e1',
  },
  helpLevelDescription: {
    fontSize: 14,
    color: '#718096',
  },
  tutorialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  tutorialDescription: {
    fontSize: 14,
    color: '#718096',
  },
  tutorialStatus: {
    marginLeft: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fed7d7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#feb2b2',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53e3e',
    marginLeft: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#718096',
  },
}); 