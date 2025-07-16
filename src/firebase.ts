// src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCaF3xMuKxhWK7f07db7fFnSK8O9oXCxu0",
    authDomain: "electronic-medical-recor-6ccac.firebaseapp.com",
    projectId: "electronic-medical-recor-6ccac",
    storageBucket: "electronic-medical-recor-6ccac.firebasestorage.app",
    messagingSenderId: "807667363679",
    appId: "1:807667363679:web:6738f67dd7f234d40a90ea",
    measurementId: "G-7FFEEX4FLC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const db = getFirestore(app);
export { db };