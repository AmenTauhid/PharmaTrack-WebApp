import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  function login(email, password) {
    setAuthError(null);
    return signInWithEmailAndPassword(auth, email, password)
      .catch(error => {
        console.error("Login error:", error);
        setAuthError(error);
        throw error;
      });
  }

  function logout() {
    setAuthError(null);
    return signOut(auth)
      .catch(error => {
        console.error("Logout error:", error);
        setAuthError(error);
        throw error;
      });
  }

  // For debugging
  useEffect(() => {
    console.log("Auth Provider initialized");
    
    // Check if Firebase auth is available
    if (!auth) {
      console.error("Firebase auth is not initialized!");
      setLoading(false);
      return;
    }
    
    return () => {
      console.log("Auth Provider unsubscribed");
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth is not initialized");
      setLoading(false);
      return;
    }
    
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setAuthError(error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}