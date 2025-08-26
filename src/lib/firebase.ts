// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "sakajuntos-web",
  appId: "1:509793458716:web:629e245318d026778c9dd9",
  storageBucket: "sakajuntos-web.firebasestorage.app",
  apiKey: "AIzaSyBieRP743PlztYXjvgBJkgeEjhpX0HNBPw",
  authDomain: "sakajuntos-web.firebaseapp.com",
  messagingSenderId: "509793458716",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
