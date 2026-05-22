import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
const firebaseConfig ={
  apiKey: "AIzaSyBAl22jHpW3e7zuxbx2YlwpcgadaD9gWuQ",
  authDomain: "stargaze-7f6bf.firebaseapp.com",
  projectId: "stargaze-7f6bf",
  storageBucket: "stargaze-7f6bf.firebasestorage.app",
  messagingSenderId: "489155776593",
  appId: "1:489155776593:web:f1fa8a1e7605d406f62870"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);