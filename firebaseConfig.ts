import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB4AQtTl8FLLKiwkCWtJofc_UhZEgb8ncw",
    authDomain: "rega-9575c.firebaseapp.com",
    projectId: "rega-9575c",
    storageBucket: "rega-9575c.firebasestorage.app",
    messagingSenderId: "704438880141",
    appId: "1:704438880141:web:5b0c8a61ddbdc524dfdfc4",
    measurementId: "G-2Q73N8Z4BS"
};

// Inicializa Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Inicializa los servicios que vas a utilizar
const auth = getAuth(app);
const db = getFirestore(app);

// Configura la persistencia de sesión como LOCAL
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error configurando persistencia:', error.message);
});

// Exporta los servicios para usarlos en otras partes de tu aplicación
export { auth, db };