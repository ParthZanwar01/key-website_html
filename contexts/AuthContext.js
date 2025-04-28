import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { Platform } from 'react-native';

// Initialize Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
        
        // Check if the user is a student (by email domain)
        if (currentUser.email && currentUser.email.endsWith('@stu.cfisd.net')) {
          setIsAuthenticated(true);
          setIsAdmin(false);
        }
        // Check if the user is an admin
        else if (currentUser.email === 'admin@example.com') {
          setIsAuthenticated(true);
          setIsAdmin(true);
        }
        // Not a valid user type, sign out
        else {
          signOut(auth);
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } else {
        // User is signed out
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
      
      // Using popup for web, you'll need different implementations for native
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user email ends with @stu.cfisd.net
      if (result.user.email && !result.user.email.endsWith('@stu.cfisd.net')) {
        // Not a student email, sign out
        await signOut(auth);
        return {
          success: false,
          error: 'Please use your school email address (@stu.cfisd.net)'
        };
      }
      
      return {
        success: true,
        user: result.user
      };
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

  // Admin login with email/password
  const loginAsAdmin = async (email, password) => {
    if (email === 'admin@example.com') {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (error) {
        console.error('Admin login error:', error);
        return false;
      }
    }
    return false;
  };

  // Student login with email/password
  const loginAsStudent = async (email, password) => {
    if (email.endsWith('@stu.cfisd.net')) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (error) {
        console.error('Student login error:', error);
        return false;
      }
    }
    return false;
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
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