import { initializeApp, getApps } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyBOGZcjre7Y5tJUHyonVb998OBcbMhzkss",
  authDomain:        "gsdcp-52d3a.firebaseapp.com",
  projectId:         "gsdcp-52d3a",
  storageBucket:     "gsdcp-52d3a.firebasestorage.app",
  messagingSenderId: "384303481015",
  appId:             "1:384303481015:web:7b4ce545aa45d1fb7a0d32",
  measurementId:     "G-NHEJVRJBED",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();
