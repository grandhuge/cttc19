
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { auth, firestore, doc, onSnapshot, onAuthStateChanged, signOut } from '../services/firebaseService';
import { FullPageLoader } from '../components/common/LoadingSpinner';

interface AuthContextType {
  currentUser: any | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (currentUser) {
      setIsLoading(true);
      const userDocRef = doc(firestore, `users/${currentUser.uid}`);
      unsubscribe = onSnapshot(userDocRef, (doc: any) => {
        if (doc.exists()) {
          const profile = doc.data() as UserProfile;
          setUserProfile(profile);
        } else {
            // User exists in auth but not firestore, this is a new user
           setUserProfile(null);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
    return () => unsubscribe();
  }, [currentUser]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  }, []);

  const value = {
    currentUser,
    userProfile,
    isLoading,
    logout,
    setUserProfile
  };
  
  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
