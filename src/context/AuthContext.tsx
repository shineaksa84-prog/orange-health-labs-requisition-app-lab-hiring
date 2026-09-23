import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  isHiringManager: boolean;
  isTaSpecialist: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user profile with Firestore
  const syncUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const existing = snap.data() as UserProfile;
        setUser(existing);
        return existing;
      } else {
        // Default role: Hiring Manager (if regular member) or TA Specialist
        const isTaEmail = fbUser.email?.includes('ta@') || fbUser.email?.includes('recruiter') || fbUser.email?.includes('hr@');
        const defaultRole: UserRole = isTaEmail ? 'TA Specialist' : 'Hiring Manager';

        const newProfile: UserProfile = {
          id: fbUser.uid,
          googleId: fbUser.providerData[0]?.uid || fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Team Member',
          email: fbUser.email || '',
          avatarUrl: fbUser.photoURL || undefined,
          role: defaultRole,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile, { merge: true });
        setUser(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Sync user profile Firestore failed, using memory state:', err);
      const fallbackProfile: UserProfile = {
        id: fbUser.uid,
        googleId: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Team Member',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || undefined,
        role: 'Hiring Manager',
        createdAt: new Date().toISOString(),
      };
      setUser(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout to prevent infinite loading screen
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1500);

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser) => {
          if (!isMounted) return;
          clearTimeout(safetyTimeout);
          if (fbUser) {
            try {
              await syncUserProfile(fbUser);
            } catch (e) {
              console.warn('Failed to sync user profile:', e);
              if (isMounted) {
                setUser({
                  id: fbUser.uid,
                  googleId: fbUser.uid,
                  name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Team Member',
                  email: fbUser.email || '',
                  avatarUrl: fbUser.photoURL || undefined,
                  role: 'Hiring Manager',
                  createdAt: new Date().toISOString(),
                });
              }
            }
          } else {
            if (isMounted) {
              setUser(null);
            }
          }
          if (isMounted) {
            setLoading(false);
          }
        },
        (error) => {
          console.warn('onAuthStateChanged error:', error);
          clearTimeout(safetyTimeout);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      );

      return () => {
        isMounted = false;
        clearTimeout(safetyTimeout);
        unsubscribe();
      };
    } catch (err) {
      console.warn('Failed to initialize onAuthStateChanged:', err);
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      try {
        setDoc(doc(db, 'users', user.id), { role: newRole }, { merge: true });
      } catch {
        // memory update is sufficient
      }
    }
  };

  const isHiringManager = user?.role === 'Hiring Manager';
  const isTaSpecialist = user?.role === 'TA Specialist' || user?.role === 'Admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout,
        switchRole,
        isAuthenticated: !!user,
        isHiringManager,
        isTaSpecialist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
