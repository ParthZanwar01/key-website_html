import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { Platform,Alert } from 'react-native';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA21pcqwgrlVArLcYOO79u7lnsWN_Hxybw",
  authDomain: "keyapp-9bf11.firebaseapp.com",
  projectId: "keyapp-9bf11",
  storageBucket: "keyapp-9bf11.firebasestorage.app",
  messagingSenderId: "976015063127",
  appId: "1:976015063127:web:c5b40212dfb5898abf4b12",
  measurementId: "G-JSP2P19GHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Create context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser(currentUser);
        console.log("Auth state changed - user:", currentUser.email);
        
        // Check if the user is an admin - IMPORTANT: check this first
        if (currentUser.email === 'admin@example.com') {
          console.log("This user is an ADMIN");
          setIsAuthenticated(true);
          setIsAdmin(true);
        }
        // Check if the user is a student (by email domain)
        else if (currentUser.email && currentUser.email.endsWith('@stu.cfisd.net')) {
          console.log("This user is a STUDENT");
          setIsAuthenticated(true);
          setIsAdmin(false);
        }
        // Not a valid user type, sign out
        else {
          console.log("Invalid user type - signing out");
          signOut(auth);
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } else {
        // User is signed out
        console.log("No user signed in");
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Using popup for web
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in result:", result.user.email);
      
      // Check if the user is an admin
      if (result.user.email === 'admin@example.com') {
        console.log("Google login - user is admin");
        return {
          success: true,
          user: result.user,
          isAdmin: true
        };
      }
      // Check if user email ends with @stu.cfisd.net
      else if (result.user.email && result.user.email.endsWith('@stu.cfisd.net')) {
        console.log("Google login - user is student");
        return {
          success: true,
          user: result.user,
          isAdmin: false
        };
      } else {
        // Not a student email, sign out
        console.log("Google login - invalid email domain");
        await signOut(auth);
        return {
          success: false,
          error: 'Please use your school email address (@stu.cfisd.net)'
        };
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in with Google'
      };
    } finally {
      setLoading(false);
    }
  };

 // Update the loginAsAdmin function in contexts/AuthContext.js
const loginAsAdmin = async (email, password) => {
  try {
    console.log("Attempting admin login:", email);
    
    if (email === 'admin@example.com') {
      try {
        // Add a timeout to the Firebase auth request
        const loginPromise = signInWithEmailAndPassword(auth, email, password);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login request timed out')), 15000)
        );
        
        // Race between the login attempt and the timeout
        await Promise.race([loginPromise, timeoutPromise]);
        console.log("Admin login successful");
        return true;
      } catch (signInError) {
        console.error("Sign-in error:", signInError);
        
        // Check for network-related errors
        if (signInError.code === 'auth/network-request-failed') {
          console.log("Network error detected. Checking internet connection...");
          // You can add more sophisticated network checking here
          
          // For now, inform the user about the network issue
          Alert.alert(
            'Network Error',
            'Could not connect to authentication servers. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
          return false;
        }
        
        // If user doesn't exist, create a new account
        if (signInError.code === 'auth/user-not-found' || 
            signInError.code === 'auth/invalid-credential') {
          try {
            console.log("Creating new admin account");
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Admin account created successfully");
            return true;
          } catch (createError) {
            console.error("Failed to create admin account:", createError);
            
            // Handle different creation errors
            if (createError.code === 'auth/network-request-failed') {
              Alert.alert(
                'Network Error',
                'Could not connect to authentication servers. Please check your internet connection and try again.',
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Account Creation Failed',
                'Could not create admin account: ' + createError.message,
                [{ text: 'OK' }]
              );
            }
            return false;
          }
        } else {
          console.error("Admin login failed:", signInError);
          Alert.alert(
            'Login Error',
            'Admin login failed: ' + signInError.message,
            [{ text: 'OK' }]
          );
          return false;
        }
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

  // Student login with email/password
  const loginAsStudent = async (email, password) => {
    try {
      console.log("Attempting student login:", email);
      
      if (email.endsWith('@stu.cfisd.net')) {
        try {
          // First try to log in with existing account
          console.log("Trying to sign in with existing account");
          await signInWithEmailAndPassword(auth, email, password);
          console.log("Student login successful");
          return true;
        } catch (signInError) {
          // If sign-in fails, try creating a new account
          console.log("Sign-in failed, trying to create user:", signInError.code);
          
          if (signInError.code === 'auth/user-not-found' || 
              signInError.code === 'auth/invalid-credential') {
            try {
              console.log("Creating new student account");
              await createUserWithEmailAndPassword(auth, email, password);
              console.log("Student account created successfully");
              return true;
            } catch (createError) {
              console.error("Failed to create student account:", createError);
              return false;
            }
          } else {
            console.error("Student login failed:", signInError);
            return false;
          }
        }
      } else {
        console.log("Not a student email");
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
      await signOut(auth);
      console.log("User signed out from Firebase");
      
      // The auth state listener will handle setting isAuthenticated and isAdmin to false
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
        signInWithGoogle,
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