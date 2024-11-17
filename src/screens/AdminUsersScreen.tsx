import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
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

export default function UsersListScreen() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      await assignRole(userId, role);
      Alert.alert('Éxito', `Rol '${role}' asignado al usuario`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el rol');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <Text style={styles.userEmail}>{item.email}</Text>
      <Text style={styles.userRole}>Rol actual: {item.role || 'No asignado'}</Text>
      <TouchableOpacity
        style={styles.assignButton}
        onPress={() => handleAssignRole(item.id, 'Administrador')}
      >
        <Text style={styles.assignButtonText}>Asignar Administrador</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.assignButton}
        onPress={() => handleAssignRole(item.id, 'Usuario')}
      >
        <Text style={styles.assignButtonText}>Asignar Usuario</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={users}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  userItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  assignButton: {
    backgroundColor: '#007BFF',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  assignButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});
