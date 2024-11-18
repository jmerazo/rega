import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import NetInfo from '@react-native-community/netinfo';
import { downloadDataToAsyncStorage } from './src/database/syncData';
import { Database } from './src/database/database';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing database...');
        const db = Database.getInstance();
        await db.initializeDatabase(); // Inicializa AsyncStorage si es necesario

        console.log('Checking network connection...');
        const netState = await NetInfo.fetch(); // Verifica el estado de la red

        if (netState.isConnected) {
          console.log('Connected to the internet. Synchronizing data...');
          await downloadDataToAsyncStorage(); // Sincroniza datos con Firestore
          console.log('Synchronization complete.');
        } else {
          console.log('No internet connection. Skipping synchronization.');
        }
      } catch (error) {
        console.error('Error initializing app or synchronizing data:', error);
      }
    };

    initializeApp();
  }, []); // Se ejecuta solo una vez al montar el componente

  return <AppNavigator />;
}