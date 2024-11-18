import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';

async function assignRoleWithRange(userId: string, role: string, users: any[]) {
  try {
    const userRef = doc(db, 'users', userId);

    let numberInit = null;
    let numberEnd = null;

    if (role === 'Registrador') {
      const assignedRanges = users
        .filter((user) => user.numberInit && user.numberEnd)
        .map((user) => ({
          start: user.numberInit,
          end: user.numberEnd,
          occupied: user.role === 'Registrador',
        }))
        .sort((a, b) => a.start - b.start);

      let found = false;
      for (const range of assignedRanges) {
        if (!range.occupied) {
          numberInit = range.start;
          numberEnd = range.end;
          found = true;
          break;
        }
      }

      if (!found) {
        const lastAssigned = assignedRanges[assignedRanges.length - 1];
        numberInit = lastAssigned ? lastAssigned.end + 1 : 1;
        numberEnd = numberInit + 199;
      }
    }

    await updateDoc(userRef, {
      role,
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

  const syncFirestoreWithLocal = async () => {
    try {
      const storedUsers = JSON.parse((await AsyncStorage.getItem('users')) || '[]');
      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
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

        // Actualizar local si hay cambios
        const isDifferent =
          JSON.stringify(storedUsers) !== JSON.stringify(userList);

        if (isDifferent) {
          await AsyncStorage.setItem('users', JSON.stringify(userList));
          setUsers(userList);
        }
      } else {
        // Cargar desde almacenamiento local
        setUsers(storedUsers);
      }
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
      Alert.alert('Error', 'No se pudieron sincronizar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sincronizar datos al cargar la vista
    syncFirestoreWithLocal();

    // Escuchar cambios en tiempo real en Firestore
    const unsubscribe = onSnapshot(collection(db, 'users'), async () => {
      await syncFirestoreWithLocal();
    });

    return () => unsubscribe();
  }, []);

  const handleAssignRole = async (userId: string, role: string) => {
    await assignRoleWithRange(userId, role, users);
    await syncFirestoreWithLocal();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <Icon name="person" size={24} color="#2B6CB0" style={styles.userIcon} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{`${item.name} ${item.lastname}`}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>
          {`Rol actual: ${item.role}`}
          {item.role === 'Registrador' && item.numberInit && item.numberEnd
            ? ` (Rango: ${item.numberInit}-${item.numberEnd})`
            : ''}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.assignButton, { backgroundColor: '#28A745' }]}
          onPress={() => handleAssignRole(item.id, 'Administrador')}
        >
          <Text style={styles.assignButtonText}>Administrador</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.assignButton, { backgroundColor: '#FFC107' }]}
          onPress={() => handleAssignRole(item.id, 'Usuario')}
        >
          <Text style={styles.assignButtonText}>Usuario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.assignButton, { backgroundColor: '#007BFF' }]}
          onPress={() => handleAssignRole(item.id, 'Registrador')}
        >
          <Text style={styles.assignButtonText}>Registrador</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#004085" />
        <Text style={styles.loaderText}>Cargando usuarios...</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
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
    backgroundColor: '#F7FAFC',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userIcon: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B6CB0',
  },
  userEmail: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  assignButton: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  loaderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#4A5568',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  emptyText: {
    fontSize: 16,
    color: '#4A5568',
  },
});