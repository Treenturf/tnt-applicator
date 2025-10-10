// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCopI_jKbudD3CM_TTOujiNeG0t2n_fqNk3",
  authDomain: "tnt-app-cfced.firebaseapp.com",
  projectId: "tnt-app-cfced",
  storageBucket: "tnt-app-cfced.firebasestorage.app",
  messagingSenderId: "366696437511",
  appId: "1:366696437511:web:8fb32180f310212111d7a2",
  measurementId: "G-YSZF842SEZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics only in production
export let analytics: Analytics | undefined;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;