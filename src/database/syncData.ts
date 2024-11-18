import { collection, getDocs } from 'firebase/firestore';
import { db as firestoreDb } from '../../firebaseConfig';
import { Database } from './database';

export const downloadDataToAsyncStorage = async () => {
  try {
    console.log('Fetching data from Firestore...');
    const [usersSnapshot, departmentsSnapshot, personsSnapshot] = await Promise.all([
      getDocs(collection(firestoreDb, 'users')),
      getDocs(collection(firestoreDb, 'departments')),
      getDocs(collection(firestoreDb, 'persons')),
    ]);

    console.log('Saving data to AsyncStorage...');
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const departments = departmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const persons = personsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Accede a getInstance directamente desde la clase
    const db = Database.getInstance();
    await db.saveData('users', users);
    await db.saveData('departments', departments);
    await db.saveData('persons', persons);

    console.log('Data saved to AsyncStorage successfully.');
  } catch (error) {
    console.error('Error downloading data from Firestore:', error);
    throw error;
  }
};