import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HelperContext = createContext();

export const useHelper = () => {
  const context = useContext(HelperContext);
  if (!context) {
    throw new Error('useHelper must be used within a HelperProvider');
  }
  return context;
};

export function HelperProvider({ children }) {
  const [tutorialState, setTutorialState] = useState({
    isFirstTime: true,
    currentTutorial: null,
    completedTutorials: [],
    dismissedTutorials: [],
    showTooltips: true,
    showSuggestions: true,
    helpLevel: 'basic', // 'basic', 'intermediate', 'advanced'
  });

  const [activeTooltip, setActiveTooltip] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpContent, setHelpContent] = useState(null);

  // Load tutorial state from storage
  useEffect(() => {
    loadTutorialState();
  }, []);

  const loadTutorialState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('tutorialState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setTutorialState(prevState => ({ ...prevState, ...parsedState }));
      }
    } catch (error) {
      console.error('Error loading tutorial state:', error);
    }
  };

  const saveTutorialState = async (newState) => {
    try {
      await AsyncStorage.setItem('tutorialState', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving tutorial state:', error);
    }
  };

  const updateTutorialState = (updates) => {
    const newState = { ...tutorialState, ...updates };
    setTutorialState(newState);
    saveTutorialState(newState);
  };

  const startTutorial = (tutorialId) => {
    updateTutorialState({
      currentTutorial: tutorialId,
      isFirstTime: false,
    });
  };

  const completeTutorial = (tutorialId) => {
    updateTutorialState({
      currentTutorial: null,
      completedTutorials: [...tutorialState.completedTutorials, tutorialId],
    });
  };

  const dismissTutorial = (tutorialId) => {
    updateTutorialState({
      currentTutorial: null,
      dismissedTutorials: [...tutorialState.dismissedTutorials, tutorialId],
    });
  };

  const showTooltip = (tooltipId, content) => {
    if (tutorialState.showTooltips) {
      setActiveTooltip({ id: tooltipId, content });
    }
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const showHelp = (content) => {
    setHelpContent(content);
    setShowHelpModal(true);
  };

  const hideHelp = () => {
    setShowHelpModal(false);
    setHelpContent(null);
  };

  const toggleTooltips = () => {
    updateTutorialState({ showTooltips: !tutorialState.showTooltips });
  };

  const toggleSuggestions = () => {
    updateTutorialState({ showSuggestions: !tutorialState.showSuggestions });
  };

  const setHelpLevel = (level) => {
    updateTutorialState({ helpLevel });
  };

  const resetTutorialProgress = async () => {
    const resetState = {
      isFirstTime: true,
      currentTutorial: null,
      completedTutorials: [],
      dismissedTutorials: [],
      showTooltips: true,
      showSuggestions: true,
      helpLevel: 'basic',
    };
    setTutorialState(resetState);
    await AsyncStorage.removeItem('tutorialState');
  };

  const isTutorialCompleted = (tutorialId) => {
    return tutorialState.completedTutorials.includes(tutorialId);
  };

  const isTutorialDismissed = (tutorialId) => {
    return tutorialState.dismissedTutorials.includes(tutorialId);
  };

  const shouldShowTutorial = (tutorialId) => {
    return !isTutorialCompleted(tutorialId) && !isTutorialDismissed(tutorialId);
  };

  const value = {
    // State
    tutorialState,
    activeTooltip,
    showHelpModal,
    helpContent,

    // Actions
    startTutorial,
    completeTutorial,
    dismissTutorial,
    showTooltip,
    hideTooltip,
    showHelp,
    hideHelp,
    toggleTooltips,
    toggleSuggestions,
    setHelpLevel,
    resetTutorialProgress,

    // Utilities
    isTutorialCompleted,
    isTutorialDismissed,
    shouldShowTutorial,
  };

  return (
    <HelperContext.Provider value={value}>
      {children}
    </HelperContext.Provider>
  );
} 