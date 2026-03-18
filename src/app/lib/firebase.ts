// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBCGGV04oRuXjKdBMSRJgLj7xwHSHKM0U",
  authDomain: "agapay-9505c.firebaseapp.com",
  projectId: "agapay-9505c",
  storageBucket: "agapay-9505c.firebasestorage.app",
  messagingSenderId: "843643906560",
  appId: "1:843643906560:web:dee64d9d0ff7dbca5c86e5",
  measurementId: "G-4ZPLEE2167"
};

// Initialize Firebase app (this works on both server and client)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Lazy initialization: Only get Firestore instance on client-side
// This prevents SSR errors since Firestore requires browser APIs
let db: ReturnType<typeof getFirestore> | null = null;

export const getDb = () => {
  if (typeof window === 'undefined') {
    // Server-side - return null or throw an error
    console.warn('Firestore cannot be initialized on the server side');
    return null;
  }
  
  if (!db) {
    db = getFirestore(app);
  }
  
  return db;
};

// For backwards compatibility, you can still import 'db' but it will be null on server
// It's recommended to use getDb() function instead
export { app };
