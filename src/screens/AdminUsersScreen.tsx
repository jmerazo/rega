import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  collection,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  DocumentData,
  query,
  where 
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: string;
  numberInit: number | null;
  numberEnd: number | null;
  [key: string]: any;
}

interface Range {
  start: number;
  end: number;
}

async function assignRoleWithRange(
  userId: string,
  role: string,
  users: User[],
  numberInit?: number,
  numberEnd?: number
) {
  try {
    const userRef = doc(db, 'users', userId);

    if (role === 'Registrador' && numberInit != null && numberEnd != null) {
      await updateDoc(userRef, {
        role,
        numberInit,
        numberEnd,
        currentNumber: numberInit || null,
      });
    } else {
      await updateDoc(userRef, {
        role,
        numberInit: null,
        numberEnd: null,
        currentNumber: null,
      });
    }

    Alert.alert(
      'Éxito',
      `Rol '${role}' asignado al usuario ${
        numberInit != null ? `con rango ${numberInit}-${numberEnd}` : ''
      }`
    );
  } catch (error) {
    console.error('Error al asignar rol:', error);
    Alert.alert('Error', 'No se pudo asignar el rol');
  }
}

export default function UsersListScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'global' | 'specific'>('global');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [globalRange, setGlobalRange] = useState<Range | null>(null);

  const syncFirestoreWithLocal = async () => {
    try {
      const storedUsers = JSON.parse((await AsyncStorage.getItem('users')) || '[]') as User[];
      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList: User[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Nombre no disponible',
          lastname: doc.data().lastname || '',
          email: doc.data().email || 'Correo no disponible',
          role: doc.data().role || 'No asignado',
          numberInit: doc.data().numberInit || null,
          numberEnd: doc.data().numberEnd || null,
          ...doc.data(),
        }));

        const isDifferent = JSON.stringify(storedUsers) !== JSON.stringify(userList);

        if (isDifferent) {
          await AsyncStorage.setItem('users', JSON.stringify(userList));
          setUsers(userList);
        } else {
          setUsers(userList);
        }
      } else {
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
    syncFirestoreWithLocal();

    const unsubscribe = onSnapshot(collection(db, 'users'), async () => {
      await syncFirestoreWithLocal();
    });

    return () => unsubscribe();
  }, []);

  const handleAssignRole = async (userId: string, role: string) => {
    if (role === 'Registrador') {
      setSelectedUserId(userId);
      setIsModalVisible(true);
    } else {
      await assignRoleWithRange(userId, role, users);
      await syncFirestoreWithLocal();
    }
  };

  const generateRanges = (): Range[] => {
    const ranges: Range[] = [];
    for (let start = 1; start <= 2000; start += 100) {
      const end = start + 99;
      ranges.push({ start, end });
    }
    return ranges;
  };

  useEffect(() => {
    const fetchGlobalRange = async () => {
      try {
        // Crea una consulta para obtener documentos donde isSelected === 1
        const q = query(collection(db, 'config'), where('isSelected', '==', 1));
        const querySnapshot = await getDocs(q);
    
        // Mapea los documentos obtenidos a un arreglo de rangos
        const selectedRanges = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          range: doc.data().range,
          start: doc.data().start,
          end: doc.data().end
        }));
    
        console.log('Rangos seleccionados:', selectedRanges);

        // Asigna el primer rango global al estado
        if (selectedRanges.length > 0) {
          setGlobalRange({
            start: selectedRanges[0].start || 0,
            end: selectedRanges[0].end || 0,
          });
        } else {
          setGlobalRange(null); // Si no hay rangos seleccionados
        }
    
        // Devuelve los rangos seleccionados
        return selectedRanges;
      } catch (error) {
        console.error('Error al obtener los rangos seleccionados:', error);
        setGlobalRange(null); // Manejo de error
        return [];
      }
    };
    fetchGlobalRange();
  }, []);

  const fetchOccupiedRanges = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
  
      // Obtener solo usuarios con role = "Registrador" y rangos asignados
      const occupiedRanges = usersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          role: doc.data().role, // Incluye el rol
          numberInit: doc.data().numberInit,
          numberEnd: doc.data().numberEnd,
        }))
        .filter(
          (user) =>
            user.role === 'Registrador' && // Filtra solo "Registrador"
            user.numberInit != null &&
            user.numberEnd != null
        )
        .sort((a, b) => a.numberEnd - b.numberEnd); // Ordenar por número final
  
      return occupiedRanges;
    } catch (error) {
      console.error('Error al obtener los rangos ocupados:', error);
      return [];
    }
  };  

  const calculateAndAssignGlobalRange = async (userId: string) => {
    try {
      // Validar que `globalRange` esté definido
      if (!globalRange) {
        Alert.alert('Error', 'No se encontró un rango global definido.');
        return;
      }
  
      // Obtener los rangos ocupados desde users (solo de "Registrador")
      const occupiedRanges = await fetchOccupiedRanges();
  
      console.log('Occupied ranges:', occupiedRanges);
  
      // Calcular el inicio del siguiente rango disponible
      const lastAssignedEnd = occupiedRanges.length > 0
        ? occupiedRanges[occupiedRanges.length - 1].numberEnd
        : globalRange.start - 1; // Si no hay rangos ocupados, empieza desde globalRange.start

      console.log('lastAssignedEnd ', lastAssignedEnd)
  
      const newNumberInit = lastAssignedEnd + 1;
      const rangeSize = globalRange.end - globalRange.start + 1; // Tamaño del rango global
      const newNumberEnd = newNumberInit + rangeSize - 1;
      console.log('newNumberInit ', newNumberInit)
      console.log('rangeSize ', rangeSize)
      console.log('newNumberEnd ', newNumberEnd)
      console.log('globalRange.end ', globalRange.end)
  
      // Validar si el nuevo rango excede el límite global
      if (newNumberInit <  lastAssignedEnd) {
        Alert.alert('Error', 'No hay suficientes números disponibles en el rango global.');
        return;
      }

  
      // Asignar el rango al usuario en Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        numberInit: newNumberInit,
        numberEnd: newNumberEnd,
        role: 'Registrador', // Cambiar el rol si es necesario
      });
  
      Alert.alert(
        'Éxito',
        `Se asignó el rango ${newNumberInit}-${newNumberEnd} al usuario.`
      );
  
      console.log(`Rango asignado al usuario ${userId}: ${newNumberInit}-${newNumberEnd}`);
    } catch (error) {
      console.error('Error al asignar el rango global:', error);
      Alert.alert('Error', 'No se pudo asignar el rango global.');
    }
  };    

  const ranges = generateRanges();

  const handleConfirmAssignRange = async () => {
    if (selectedOption === 'global') {
      if (!selectedUserId) {
        Alert.alert('Error', 'Seleccione un usuario para asignar el rango.');
        return;
      }
  
      await calculateAndAssignGlobalRange(selectedUserId);
      setIsModalVisible(false); // Cierra el modal después de asignar el rango
    } else if (selectedOption === 'specific' && selectedRange) {
      const { start, end } = selectedRange;
  
      if (selectedUserId) {
        try {
          await assignRoleWithRange(selectedUserId, 'Registrador', users, start, end);
          await syncFirestoreWithLocal();
          setIsModalVisible(false);
        } catch (error) {
          console.error('Error al asignar el rango específico:', error);
          Alert.alert('Error', 'No se pudo asignar el rango.');
        }
      }
    } else {
      Alert.alert('Error', 'Seleccione un rango válido.');
    }
  };  

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <Icon name="person" size={24} color="#2B6CB0" style={styles.userIcon} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{`${item.name} ${item.lastname}`}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>
          {`Rol actual: ${item.role}`}
          {item.role === 'Registrador' && item.numberInit != null && item.numberEnd != null
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
    <>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      {isModalVisible && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Asignar rango de números</Text>
              <Text>Seleccione el tipo de rango a asignar:</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => setSelectedOption('global')}
                >
                  <View style={styles.optionRow}>
                    <Text style={styles.optionText}>
                      Asignar rango global (
                      {globalRange
                        ? `${globalRange.start}-${globalRange.end}`
                        : 'No disponible'}
                      )
                    </Text>
                    {selectedOption === 'global' && (
                      <Icon name="check" size={20} color="#000" />
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => setSelectedOption('specific')}
                >
                  <View style={styles.optionRow}>
                    <Text style={styles.optionText}>Asignar rango específico</Text>
                    {selectedOption === 'specific' && (
                      <Icon name="check" size={20} color="#000" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {selectedOption === 'specific' && (
                <View>
                  <Text>Seleccione un rango:</Text>
                  <Picker
                    selectedValue={
                      selectedRange
                        ? `${selectedRange.start}-${selectedRange.end}`
                        : ''
                    }
                    onValueChange={(itemValue) => {
                      if (typeof itemValue === 'string') {
                        const [startStr, endStr] = itemValue.split('-');
                        const start = Number(startStr);
                        const end = Number(endStr);
                        setSelectedRange({ start, end });
                      }
                    }}
                  >
                    <Picker.Item label="Seleccione un rango" value="" />
                    {ranges.map((range) => (
                      <Picker.Item
                        key={`${range.start}-${range.end}`}
                        label={`${range.start}-${range.end}`}
                        value={`${range.start}-${range.end}`}
                      />
                    ))}
                  </Picker>
                </View>
              )}

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleConfirmAssignRange}
                >
                  <Text style={styles.modalButtonText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsContainer: {
    marginVertical: 12,
  },
  optionButton: {
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    backgroundColor: '#2B6CB0',
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});