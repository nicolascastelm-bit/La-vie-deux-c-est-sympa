// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtTcczi-30_hdn31djAr0vcF3Ztbl8U24",
  authDomain: "plaisir-malin-et-coquin.firebaseapp.com",
  projectId: "plaisir-malin-et-coquin",
  storageBucket: "plaisir-malin-et-coquin.firebasestorage.app",
  messagingSenderId: "1071445418608",
  appId: "1:1071445418608:web:3276d6ea7b6a7d17308ab5",
  measurementId: "G-L6CQ8KNLT6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
