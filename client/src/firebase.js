// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCCBrxXvOmGOoqg2ZcSilOv1pranZ8cxgw",
  authDomain: "viren-5a84d.firebaseapp.com",
  projectId: "viren-5a84d",
  storageBucket: "viren-5a84d.firebasestorage.app",
  messagingSenderId: "106630761605",
  appId: "1:106630761605:web:699affd7c6abace5722dec",
  measurementId: "G-9TQTDETGRL"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);