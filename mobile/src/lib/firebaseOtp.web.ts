import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import type { OtpConfirmation } from "./firebaseOtp";

// React Native Firebase does not run under react-native-web, so the web build
// keeps using the Firebase JS SDK with an invisible reCAPTCHA. The login screen
// renders a hidden <div nativeID="recaptcha-container" /> anchor for this.
const firebaseConfig = {
  apiKey: "AIzaSyBOGZcjre7Y5tJUHyonVb998OBcbMhzkss",
  authDomain: "gsdcp-52d3a.firebaseapp.com",
  projectId: "gsdcp-52d3a",
  storageBucket: "gsdcp-52d3a.firebasestorage.app",
  messagingSenderId: "384303481015",
  appId: "1:384303481015:web:7b4ce545aa45d1fb7a0d32",
  measurementId: "G-NHEJVRJBED",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";
let verifier: RecaptchaVerifier | null = null;

export async function sendOtp(phoneE164: string): Promise<OtpConfirmation> {
  if (!verifier) {
    verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: "invisible",
    });
  }
  try {
    return await signInWithPhoneNumber(auth, phoneE164, verifier);
  } catch (error) {
    // Reset so a retry can mount a fresh reCAPTCHA challenge.
    verifier?.clear();
    verifier = null;
    throw error;
  }
}
