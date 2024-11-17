import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

async function assignRole(userId: string, role: string) {
  try {
    const userRef = doc(db, 'users', userId); // Documento del usuario
    await updateDoc(userRef, {
      role: role, // Actualizar el rol
    });
    console.log('Rol asignado con éxito');
  } catch (error) {
    console.error('Error al asignar rol:', error);
  }
}