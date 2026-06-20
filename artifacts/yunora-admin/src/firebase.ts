import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAy9tbR-k_GsTMtZJyaoZtnueCVwWFT3Xo",
  authDomain: "educationapp-6ca39.firebaseapp.com",
  projectId: "educationapp-6ca39",
  storageBucket: "educationapp-6ca39.firebasestorage.app",
  messagingSenderId: "975794583507",
  appId: "1:975794583507:web:d1a945f6ba01d920e66126",
  measurementId: "G-QV4YZ0YNCC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const storage = getStorage(app);
