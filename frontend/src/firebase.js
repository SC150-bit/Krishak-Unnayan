import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";

// Firebase configuration from your console screenshot
const firebaseConfig = {
  apiKey: "AIzaSyBd0T_KhiQPOnrOUqGDDFxxA_m-ajACW9U",
  authDomain: "krishak-unnayan.firebaseapp.com",
  projectId: "krishak-unnayan",
  storageBucket: "krishak-unnayan.firebasestorage.app",
  messagingSenderId: "203724707921",
  appId: "1:203724707921:web:c099e06ffabb1798358070",
  measurementId: "G-184HVP9VK7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Export Methods
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
};