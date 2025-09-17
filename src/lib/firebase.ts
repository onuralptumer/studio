
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAlXrZEk4CcCOeYKHiSEF1SBrKlcL4vEyY",
    authDomain: "studio-6709895403-e0278.firebaseapp.com",
    projectId: "studio-6709895403-e0278",
    storageBucket: "studio-6709895403-e0278.appspot.com",
    messagingSenderId: "560846416562",
    appId: "1:560846416562:web:7f5411bc40bde29fd8f7ab"
  };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
