import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLApngPNtH0L6BuE4pHFexjGOacTnhgUo",
  authDomain: "bread-delivery-5c331.firebaseapp.com",
  projectId: "bread-delivery-5c331",
  storageBucket: "bread-delivery-5c331.firebasestorage.app",
  messagingSenderId: "675807328732",
  appId: "1:675807328732:web:1e3de9e142594d7319b719"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
