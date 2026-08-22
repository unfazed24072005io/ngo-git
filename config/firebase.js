// config/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCSpFheSyB8ML2A8Ot7-9Zc2D55pAqBttE",
  authDomain: "ngo-app-54121.firebaseapp.com",
  projectId: "ngo-app-54121",
  storageBucket: "ngo-app-54121.firebasestorage.app",
  messagingSenderId: "860187159774",
  appId: "1:860187159774:android:6dfee16f67197e6c7da64f"
};

const app = initializeApp(firebaseConfig);

console.log('🔥 Initializing Firebase Auth...');

// ✅ Platform-specific persistence (NO await)
let authInstance;
if (Platform.OS === 'web') {
  // Web: Use browser local storage
  authInstance = getAuth(app);
  setPersistence(authInstance, browserLocalPersistence).catch((error) => {
    console.error('⚠️ Error setting persistence:', error);
  });
  console.log('✅ Firebase Auth initialized (Web)');
} else {
  // Native: Use AsyncStorage
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized (Native)');
}

export const getAuthInstance = () => {
  return authInstance;
};

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;