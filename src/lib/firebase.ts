// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "sakajuntos-web",
  "appId": "1:509793458716:web:629e245318d026778c9dd9",
  "storageBucket": "sakajuntos-web.firebasestorage.app",
  "apiKey": "AIzaSyBieRP743PlztYXjvgBJkgeEjhpX0HNBPw",
  "authDomain": "sakajuntos-web.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "509793458716"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
