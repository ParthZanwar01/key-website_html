// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SupabaseService from '../services/SupabaseService';

// Create context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  // Enhanced authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let userData;
        
        try {
          userData = await AsyncStorage.getItem('user');
        } catch (asyncStorageError) {
          // If AsyncStorage fails (common on web), try localStorage directly
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            userData = window.localStorage.getItem('user');
          }
        }
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log("Found stored user data:", parsedUser);
          
          // Validate the stored user data
          if (parsedUser && (parsedUser.sNumber || parsedUser.role)) {
            setUser(parsedUser);
            
            // Check if the user is an admin
            if (parsedUser.sNumber === 'admin' || parsedUser.role === 'admin') {
              console.log("Restoring admin session");
              setIsAuthenticated(true);
              setIsAdmin(true);
            } 
            // Check if the user is a student (by S-number)
            else if (parsedUser.sNumber && parsedUser.sNumber.startsWith('s')) {
              console.log("Restoring student session");
              setIsAuthenticated(true);
              setIsAdmin(false);
            } 
            // Invalid user data
            else {
              console.log("Invalid stored user data - clearing");
              await clearAuthData();
            }
          } else {
            console.log("Invalid user data structure - clearing");
            await clearAuthData();
          }
        } else {
          console.log("No stored authentication found");
          setIsAuthenticated(false);
          setIsAdmin(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await clearAuthData();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Helper function to clear auth data
  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.log("AsyncStorage clear failed:", e);
    }
    
    // Also clear from localStorage on web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('user');
    }
    
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setShowAnimation(false);
  };

  // Enhanced storage function that works on both native and web
  const storeUserData = async (userData) => {
    const userDataString = JSON.stringify(userData);
    
    try {
      await AsyncStorage.setItem('user', userDataString);
    } catch (asyncError) {
      console.log("AsyncStorage failed, trying localStorage:", asyncError);
      // If AsyncStorage fails, try localStorage for web
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('user', userDataString);
      } else {
        throw asyncError;
      }
    }
  };

  // Animation control functions
  const triggerAnimation = () => {
    setShowAnimation(true);
  };

  const hideAnimation = () => {
    setShowAnimation(false);
  };

  // Login as admin
  const loginAsAdmin = async (email, password) => {
    try {
      console.log("Attempting admin login:", email);
      
      // Simple admin check - you can enhance this with Supabase later
      if (email === 'admin@example.com' && password === 'password') {
        const adminUser = {
          sNumber: 'admin',
          name: 'Admin User',
          role: 'admin',
          totalHours: '0',
          id: 'admin-user',
          loginTime: new Date().toISOString()
        };
        
        await storeUserData(adminUser);
        setUser(adminUser);
        setIsAuthenticated(true);
        setIsAdmin(true);
        
        // Trigger animation after successful login
        triggerAnimation();
        
        console.log("Admin login successful");
        return true;
      }
      
      Alert.alert('Login Failed', 'Invalid admin credentials.');
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      Alert.alert('Error', 'An unexpected error occurred during login.');
      return false;
    }
  };

  // Student login with Supabase
  const loginAsStudent = async (sNumber, password) => {
    try {
      console.log("Attempting student login with S-Number:", sNumber);
      
      if (!sNumber.startsWith('s')) {
        Alert.alert('Invalid S-Number', 'Please enter a valid S-Number starting with "s".');
        return false;
      }
      
      const result = await SupabaseService.loginStudent(sNumber, password);
      
      if (result.success) {
        const studentUser = {
          ...result.user,
          loginTime: new Date().toISOString()
        };
        
        console.log("Student user object created:", studentUser);
        
        await storeUserData(studentUser);
        setUser(studentUser);
        setIsAuthenticated(true);
        setIsAdmin(false);
        
        // Trigger animation after successful login
        triggerAnimation();
        
        console.log("Student login successful");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Student login error:', error);
      Alert.alert('Login Failed', error.message || 'An unexpected error occurred during login.');
      return false;
    }
  };

  // Student registration
  const registerStudent = async (sNumber, password, name) => {
    try {
      console.log("Attempting student registration:", sNumber);
      
      if (!sNumber.startsWith('s')) {
        Alert.alert('Invalid S-Number', 'Please enter a valid S-Number starting with "s".');
        return false;
      }
      
      const result = await SupabaseService.registerStudent(sNumber, password, name);
      
      if (result.success) {
        console.log("Student registration successful");
        Alert.alert('Success', 'Account created successfully! You can now log in.');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Student registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred during registration.');
      return false;
    }
  };

  // Change password
  const changePassword = async (oldPassword, newPassword) => {
    try {
      if (!user?.sNumber) {
        throw new Error('No user logged in');
      }
      
      const result = await SupabaseService.changePassword(user.sNumber, oldPassword, newPassword);
      
      if (result.success) {
        Alert.alert('Success', 'Password changed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
      return false;
    }
  };

  // Reset password (admin function)
  const resetPassword = async (sNumber, newPassword) => {
    try {
      if (!isAdmin) {
        throw new Error('Only admins can reset passwords');
      }
      
      const result = await SupabaseService.resetPassword(sNumber, newPassword);
      
      if (result.success) {
        Alert.alert('Success', 'Password reset successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to reset password');
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user");
      await clearAuthData();
      console.log("User logged out");
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setShowAnimation(false);
      return false;
    }
  };

  // Show loading component while checking authentication
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        user,
        loginAsAdmin,
        loginAsStudent,
        registerStudent,
        changePassword,
        resetPassword,
        logout,
        loading,
        showAnimation,
        triggerAnimation,
        hideAnimation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}