import React, { useContext, useState, useEffect, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export function useAuth() {
  return useContext(AuthContext);
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from AsyncStorage on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('currentUser');
        if (userString) {
          setCurrentUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Login function - in a real app, this would validate credentials with a backend
  async function login(email, password) {
    try {
      // This is a simple demo - in a real app, you would verify credentials with a server
      if (email === 'admin@example.com' || email === 'Admin@example.com' && password === 'password') {
        const user = { email, role: 'admin' };
        setCurrentUser(user);
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error', error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      setCurrentUser(null);
      await AsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}