import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFPWDQ_BRBstoguLOuLLp4YokQOnicDB0",
  authDomain: "mycomputerstudiobd.firebaseapp.com",
  projectId: "mycomputerstudiobd",
  storageBucket: "mycomputerstudiobd.firebasestorage.app",
  messagingSenderId: "1060914631662",
  appId: "1:1060914631662:web:2ca1fb96c32b07f18b34ff",
  measurementId: "G-3NZR6K0789",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let analytics = null;

isSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});
