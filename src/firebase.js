// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD6ZeO5sn34gh9DaxESDyicJIl_Y-5ZlAA",
    authDomain: "whack25new.firebaseapp.com",
    projectId: "whack25new",
    storageBucket: "whack25new.firebasestorage.app",
    messagingSenderId: "560678652900",
    appId: "1:560678652900:web:3ac23bf7e404f5b27c15f1",
    measurementId: "G-E0XVJDFDFW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;

