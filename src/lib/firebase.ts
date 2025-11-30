
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyCpcD80ckN8ce1IE-DakghSlnuygPU8wCg",
  authDomain: "scio-cesta.firebaseapp.com",
  projectId: "scio-cesta",
  storageBucket: "scio-cesta.appspot.com",
  messagingSenderId: "1078740082725",
  appId: "1:1078740082725:web:72f75a57e3c0ab98fa9fcc"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Initialize Auth with persistence
let auth;
if (Capacitor.isNativePlatform()) {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
  });
} else {
  auth = getAuth(app);
}

export { app, db, auth };
