import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Función para asignar rol y rango
async function assignRoleWithRange(userId: string, role: string, users: any[]) {
  try {
    const userRef = doc(db, 'users', userId);

    let numberInit = null;
    let numberEnd = null;

    if (role === 'Registrador') {
      // Obtener el último rango asignado
      const lastAssigned = users
        .filter((user) => user.role === 'Registrador' && user.numberEnd)
        .sort((a, b) => b.numberEnd - a.numberEnd)[0];

      numberInit = lastAssigned ? lastAssigned.numberEnd + 1 : 1;
      numberEnd = numberInit + 199; // Rango fijo de 200
    }

    // Actualizar el rol y rango en el documento del usuario
    await updateDoc(userRef, {
      role: role,
      numberInit: numberInit || null,
      numberEnd: numberEnd || null,
      currentNumber: numberInit || null,
    });

    Alert.alert(
      'Éxito',
      `Rol '${role}' asignado al usuario ${
        numberInit ? `con rango ${numberInit}-${numberEnd}` : ''
      }`
    );
  } catch (error) {
    console.error('Error al asignar rol:', error);
    Alert.alert('Error', 'No se pudo asignar el rol');
  }
}

export default function UsersListScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar usuarios desde Firebase
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'Nombre no disponible',
        lastname: doc.data().lastname || '',
        email: doc.data().email || 'Correo no disponible',
        role: doc.data().role || 'No asignado',
        numberInit: doc.data().numberInit || null,
        numberEnd: doc.data().numberEnd || null,
        ...doc.data(),
      }));
      setUsers(userList);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async (userId: string, role: string) => {
    await assignRoleWithRange(userId, role, users);
    // Recargar usuarios después de asignar el rol
    await fetchUsers();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <Text style={styles.userName}>
        {item.name} {item.lastname}
      </Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <Text style={styles.userRole}>
        Rol actual: {item.role}
        {item.role === 'Registrador' && item.numberInit && item.numberEnd
          ? ` (Rango: ${item.numberInit}-${item.numberEnd})`
          : ''}
      </Text>
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
      <TouchableOpacity
        style={styles.assignButton}
        onPress={() => handleAssignRole(item.id, 'Registrador')}
      >
        <Text style={styles.assignButtonText}>Asignar Registrador</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando usuarios...</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No se encontraron usuarios.</Text>
      </View>
    );
  }

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
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
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
