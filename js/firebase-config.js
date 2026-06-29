import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyB_3HrakpNhy48ssf3-fp96KFF3J6qE0eA",
    authDomain: "derma360-160526.firebaseapp.com",
    projectId: "derma360-160526",
    storageBucket: "derma360-160526.firebasestorage.app",
    messagingSenderId: "867337930702",
    appId: "1:867337930702:web:cba6bca2e4ebb5233b0d9f",
    measurementId: "G-XQZFRQPD8J"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);