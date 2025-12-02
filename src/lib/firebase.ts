
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from "firebase/auth";
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { getReactNativePersistence } from 'firebase/auth/react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCpcD80ckN8ce1IE-DakghSlnuygPU8wCg",
  authDomain: "scio-cesta.firebaseapp.com",
  projectId: "scio-cesta",
  storageBucket: "scio-cesta.appspot.com",
  messagingSenderId: "1078740082725",
  appId: "1:1078740082725:web:72f75a57e3c0ab98fa9fcc"
};

// Custom persistence layer using Capacitor Preferences
const capacitorPersistence = {
  type: 'LOCAL',
  async _get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async _set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },
  async _remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Initialize Auth with persistence
let auth;
if (Capacitor.isNativePlatform()) {
  auth = initializeAuth(app, {
    persistence: capacitorPersistence,
  });
} else {
  // Use browser local persistence for web
  auth = initializeAuth(app, {
      persistence: browserLocalPersistence
  });
}

export { app, db, auth };
