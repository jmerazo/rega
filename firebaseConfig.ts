import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB4AQtTl8FLLKiwkCWtJofc_UhZEgb8ncw",
  authDomain: "rega-9575c.firebaseapp.com",
  projectId: "rega-9575c",
  storageBucket: "rega-9575c.firebasestorage.app",
  messagingSenderId: "704438880141",
  appId: "1:704438880141:web:5b0c8a61ddbdc524dfdfc4",
  measurementId: "G-2Q73N8Z4BS",
};

// Inicializa Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Inicializa Auth con soporte para AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Inicializa Firestore
const db = getFirestore(app);

// Exporta los servicios
export { auth, db };