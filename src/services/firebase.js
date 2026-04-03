import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1TjMCnOlpm1uNdzdydPccrGHHJjX5pHQ",
  authDomain: "hybrid-tracker-bdd3f.firebaseapp.com",
  projectId: "hybrid-tracker-bdd3f",
  storageBucket: "hybrid-tracker-bdd3f.firebasestorage.app",
  messagingSenderId: "1058069807102",
  appId: "1:1058069807102:web:f3ccdfb9909c9b310a0aaf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
