import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = 'orange_health_firebase_config_v2';

export const OFFICIAL_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: "AIzaSyCGaVvY0--wU9JkyD2mLuq1WN1nGkpbK7k",
  authDomain: "orange-health-requisition-app.firebaseapp.com",
  projectId: "orange-health-requisition-app",
  storageBucket: "orange-health-requisition-app.firebasestorage.app",
  messagingSenderId: "271424944788",
  appId: "1:271424944788:web:fa5eb3fc30869375595281"
};

// Clean up any legacy localStorage keys that may have held invalid placeholder keys
try {
  localStorage.removeItem('orange_health_firebase_config_v1');
  localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(OFFICIAL_FIREBASE_CONFIG));
} catch {
  // Ignore
}

export function getStoredFirebaseConfig(): FirebaseClientConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId === OFFICIAL_FIREBASE_CONFIG.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved firebase config:', e);
  }
  return OFFICIAL_FIREBASE_CONFIG;
}

export function saveRuntimeFirebaseConfig(config: FirebaseClientConfig): void {
  localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  window.location.reload();
}

export function clearStoredFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  localStorage.removeItem('orange_health_firebase_config_v1');
  window.location.reload();
}

// 1. Direct active config
export const activeFirebaseConfig: FirebaseClientConfig = OFFICIAL_FIREBASE_CONFIG;

export const isFirebaseConfigured = true;

function initApp(): FirebaseApp {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      return existingApps[0];
    }
    return initializeApp(activeFirebaseConfig);
  } catch (err) {
    console.warn('Firebase initializeApp notice:', err);
    return getApps()[0] || initializeApp(OFFICIAL_FIREBASE_CONFIG);
  }
}

export const app: FirebaseApp = initApp();
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db: Firestore = getFirestore(app);
