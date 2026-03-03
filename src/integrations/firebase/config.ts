import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCZAUf1UKR13g_WiuKYK-D3XK6nsvX_g00",
  authDomain: "skillmirror-61c26.firebaseapp.com",
  projectId: "skillmirror-61c26",
  storageBucket: "skillmirror-61c26.firebasestorage.app",
  messagingSenderId: "669535172138",
  appId: "1:669535172138:web:228111843484104847b553",
  measurementId: "G-H1RG39WTL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
