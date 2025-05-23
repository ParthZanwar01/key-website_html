import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
const AuthContext = createContext();

// Google Sheets API endpoint (replace with your actual Sheet ID and API endpoint)
const GOOGLE_SHEET_API_ENDPOINT = 'https://api.sheetbest.com/sheets/216a1c49-0ea0-48d4-be6d-d9245fd7896e';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get stored user data
        const userData = await AsyncStorage.getItem('user');
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Check if the user is an admin
          if (parsedUser.sNumber === 'admin') {
            console.log("This user is an ADMIN");
            setIsAuthenticated(true);
            setIsAdmin(true);
          } 
          // Check if the user is a student (by S-number)
          else if (parsedUser.sNumber && parsedUser.sNumber.startsWith('s')) {
            console.log("This user is a STUDENT");
            setIsAuthenticated(true);
            setIsAdmin(false);
          } 
          // Not a valid user type, sign out
          else {
            console.log("Invalid user type - signing out");
            await logout();
          }
        } else {
          console.log("No user signed in");
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login as admin
  const loginAsAdmin = async (email, password) => {
    try {
      console.log("Attempting admin login:", email);
      
      if (email === 'admin@example.com') {
        try {
          // Simple check for admin credentials
          // In a real app, you would verify against secure storage
          if (password === 'password') {
            const adminUser = {
              sNumber: 'admin',
              name: 'Admin User',
              role: 'admin'
            };
            
            // Store user data
            await AsyncStorage.setItem('user', JSON.stringify(adminUser));
            
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
          
          // Check if student has already set up an account (has a password)
          if (studentInSheet.password) {
            // Existing account - verify password
            if (studentInSheet.password === password) {
              // Password matches - login successful
              const studentUser = {
                sNumber: studentInSheet.sNumber,
                name: studentInSheet.name || sNumber,
                role: 'student',
                id: studentInSheet.id || Date.now().toString()
              };
              
              // Store user data
              await AsyncStorage.setItem('user', JSON.stringify(studentUser));
              
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
              // Find the row index of the student to update
              const rowIndex = allStudents.findIndex(s => 
                s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
              );
              
              if (rowIndex === -1) {
                throw new Error("Failed to locate student row");
              }
              
              // Update the student entry with the password
              await axios.patch(`${GOOGLE_SHEET_API_ENDPOINT}/${rowIndex}`, {
                password: password,
                lastLogin: new Date().toISOString()
              });
              
              // Create user object
              const newStudentUser = {
                sNumber: studentInSheet.sNumber,
                name: studentInSheet.name || sNumber,
                role: 'student',
                id: studentInSheet.id || Date.now().toString()
              };
              
              // Store user data
              await AsyncStorage.setItem('user', JSON.stringify(newStudentUser));
              
              // Update state
              setUser(newStudentUser);
              setIsAuthenticated(true);
              setIsAdmin(false);
              
              console.log("First-time student login successful");
              return true;
            } catch (setupError) {
              console.error("Failed to set up student account:", setupError);
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
      
      // Clear stored user data
      await AsyncStorage.removeItem('user');
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      console.log("User logged out");
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  if (loading) {
    // Return a loading state if needed
    return null; // or a loading component
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}