// Import the core Firebase SDK modules from the official CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Your exact web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkDkK86iyNwWmdeY-GZHMVS8MwMZOBKIU",
  authDomain: "jkmms-79fb1.firebaseapp.com",
  projectId: "jkmms-79fb1",
  storageBucket: "jkmms-79fb1.firebasestorage.app",
  messagingSenderId: "701759230780",
  appId: "1:701759230780:web:5c2fc4a13d8bf11ab58439",
  measurementId: "G-P7N1FMX5D0"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export instances to be used by app.js
export const auth = getAuth(app);
export const db = getFirestore(app);