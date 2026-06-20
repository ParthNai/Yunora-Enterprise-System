// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);