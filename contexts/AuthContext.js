import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
const AuthContext = createContext();

// Google Sheets API endpoint
const GOOGLE_SHEET_API_ENDPOINT = 'https://api.sheetbest.com/sheets/0b911400-5cc3-45c6-981e-dd6a551b3a5a';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enhanced authentication check that handles web refreshes better
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // For web, also check localStorage as fallback
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
        // On error, clear any potentially corrupted auth data
        await clearAuthData();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Helper function to clear auth data from both storage methods
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

  // Login as admin
  const loginAsAdmin = async (email, password) => {
    try {
      console.log("Attempting admin login:", email);
      
      if (email === 'admin@example.com') {
        try {
          // Simple check for admin credentials
          if (password === 'password') {
            const adminUser = {
              sNumber: 'admin',
              name: 'Admin User',
              role: 'admin',
              totalHours: '0',
              id: 'admin-user',
              loginTime: new Date().toISOString()
            };
            
            // Store user data using enhanced storage
            await storeUserData(adminUser);
            
            // Update state
            setUser(adminUser);
            setIsAuthenticated(true);
            setIsAdmin(true);
            
            console.log("Admin login successful");
            return true;
          } else {
            console.log("Admin password incorrect");
            return false;
          }
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      }
      
      Alert.alert('Invalid Email', 'Please use the admin@example.com email to log in.');
      return false;
    } catch (error) {
      console.error('Admin login process error:', error);
      Alert.alert('Error', 'An unexpected error occurred during login.');
      return false;
    }
  };

  // Student login with Google Sheets
  const loginAsStudent = async (sNumber, password) => {
    try {
      console.log("Attempting student login with S-Number:", sNumber);
      
      if (sNumber.startsWith('s')) {
        try {
          // Query the Google Sheet for all students
          const response = await axios.get(`${GOOGLE_SHEET_API_ENDPOINT}`);
          const allStudents = response.data;
          
          console.log("Retrieved students from sheet:", allStudents.length);
          
          // Look for the student by S-Number in the existing sheet
          const studentInSheet = allStudents.find(s => 
            s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
          );
          
          // If S-Number doesn't exist in sheet, reject login
          if (!studentInSheet) {
            console.log("Student S-Number not found in database");
            Alert.alert('Login Failed', 'Your S-Number was not found in our system. Please contact your administrator.');
            return false;
          }
          
          console.log("Found student in sheet:", studentInSheet);
          
          // Check if student has already set up an account (has a password)
          if (studentInSheet.password) {
            // Existing account - verify password
            if (studentInSheet.password === password) {
              // Password matches - login successful
              const studentUser = {
                sNumber: studentInSheet.sNumber,
                name: studentInSheet.name || sNumber,
                role: 'student',
                id: studentInSheet.id || Date.now().toString(),
                totalHours: studentInSheet.totalHours || '0',
                loginTime: new Date().toISOString()
              };
              
              console.log("Student user object created:", studentUser);
              
              // Store user data using enhanced storage
              await storeUserData(studentUser);
              
              // Update state
              setUser(studentUser);
              setIsAuthenticated(true);
              setIsAdmin(false);
              
              console.log("Student login successful");
              return true;
            } else {
              // Password doesn't match
              console.log("Student password incorrect");
              Alert.alert('Login Failed', 'Incorrect password. Please try again.');
              return false;
            }
          } else {
            // First time login - set up account with provided password
            try {
              console.log("Setting up first-time account for:", sNumber);
              
              // Find the row index of the student to update
              const rowIndex = allStudents.findIndex(s => 
                s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
              );
              
              if (rowIndex === -1) {
                throw new Error("Failed to locate student row");
              }
              
              console.log("Updating student at row index:", rowIndex);
              
              // Prepare the update data with ALL required headers
              const updateData = {
                sNumber: studentInSheet.sNumber,
                name: studentInSheet.name || sNumber,
                password: password,
                totalHours: '0',
                lastLogin: new Date().toISOString(),
                lastHourUpdate: new Date().toISOString(),
                accountCreated: new Date().toISOString(),
                id: studentInSheet.id || Date.now().toString()
              };
              
              console.log("Sending update data:", updateData);
              
              // Update the student entry
              const updateResponse = await axios.patch(`${GOOGLE_SHEET_API_ENDPOINT}/${rowIndex}`, updateData);
              
              console.log("Update response:", updateResponse.status, updateResponse.data);
              
              // Create user object
              const newStudentUser = {
                sNumber: studentInSheet.sNumber,
                name: studentInSheet.name || sNumber,
                role: 'student',
                id: updateData.id,
                totalHours: '0',
                loginTime: new Date().toISOString()
              };
              
              console.log("New student user object created:", newStudentUser);
              
              // Store user data using enhanced storage
              await storeUserData(newStudentUser);
              
              // Update state
              setUser(newStudentUser);
              setIsAuthenticated(true);
              setIsAdmin(false);
              
              console.log("First-time student login successful with hour initialization");
              return true;
            } catch (setupError) {
              console.error("Failed to set up student account:", setupError);
              console.error("Setup error details:", {
                message: setupError.message,
                response: setupError.response?.data,
                status: setupError.response?.status
              });
              Alert.alert('Account Setup Failed', 'Could not set up your account. Please try again later.');
              return false;
            }
          }
        } catch (error) {
          console.error("Google Sheets API error:", error);
          Alert.alert(
            'Connection Error',
            'Could not connect to the student database. Please check your internet connection and try again.'
          );
          return false;
        }
      } else {
        Alert.alert('Invalid S-Number', 'Please enter a valid S-Number starting with "s".');
        return false;
      }
    } catch (error) {
      console.error('Student login process error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user");
      
      // Clear stored user data from both storage methods
      await clearAuthData();
      
      console.log("User logged out");
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the state even if storage clearing fails
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      return false;
    }
  };

  // Show loading component while checking authentication
  if (loading) {
    // You can customize this loading component
    return null; // or return a loading spinner component
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        user,
        loginAsAdmin,
        loginAsStudent,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}