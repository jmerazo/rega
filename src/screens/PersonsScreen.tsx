import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';
import Icon from 'react-native-vector-icons/FontAwesome';

type UsersScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Users'>,
  StackNavigationProp<PersonsStackParamList>
>;

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const navigation = useNavigation<UsersScreenNavigationProp>();
  

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      let unsubscribe: any;

      const fetchUsers = async () => {
        setLoading(true); // Iniciar indicador de carga
        try {
          // Obtener el usuario actual de Firebase Auth
          const currentUser = auth.currentUser;
          if (!currentUser) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual.');
            setLoading(false);
            return;
          }

          // Obtener rol del usuario desde AsyncStorage o Firestore
          const storedRole = await AsyncStorage.getItem('userRole');
          let userRole = storedRole;

          setRole(userRole);

          // Primero cargar datos locales
          await loadLocalData(currentUser.uid, userRole);

          // Verificar conexión a internet
          const netState = await NetInfo.fetch();

          if (netState.isConnected) {
            unsubscribe = await syncWithFirestore(currentUser.uid, userRole);
          } else {
            console.log('Sin conexión, utilizando datos locales únicamente.');
          }
        } catch (error) {
          console.error('Error cargando usuarios:', error);
          Alert.alert('Error', 'Ocurrió un error al cargar los datos.');
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchUsers();

      return () => {
        isActive = false;
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [])
  );  

  const syncWithFirestore = async (userId: string, role: string | null) => {
    try {
      let usersQuery;
  
      if (role === 'Administrador') {
        // Para el administrador, obtenemos todos los registros
        usersQuery = collection(db, 'persons');
      } else {
        // Para registradores, filtramos por el usuario actual
        usersQuery = query(
          collection(db, 'persons'),
          where('registradoPor', '==', userId)
        );
      }
  
      const unsubscribe = onSnapshot(usersQuery, async (snapshot) => {
        const firestoreUsers: any[] = [];
        snapshot.forEach((doc) => {
          firestoreUsers.push({ id: doc.id, ...doc.data() });
        });
  
        // Guardar en AsyncStorage y actualizar estado
        setUsers(firestoreUsers);
        await AsyncStorage.setItem('persons', JSON.stringify(firestoreUsers));
      });
  
      return unsubscribe;
    } catch (error) {
      console.error('Error sincronizando con Firestore:', error);
    }
  };
  
  const loadLocalData = async (userId: string, role: string | null) => {
    try {
      const localData = await AsyncStorage.getItem('persons'); // Obtener datos almacenados en AsyncStorage
      if (localData) {
        const parsedData = JSON.parse(localData);
  
        // Filtrar los datos locales solo si no es Administrador
        const filteredData =
          role === 'Administrador'
            ? parsedData // Administrador ve todos los datos
            : parsedData.filter((person: any) => person.registradoPor === userId);
  
        setUsers(filteredData);
      } else {
        console.warn('No se encontraron datos locales.');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error cargando datos locales:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos almacenados.');
    }
  };   

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('PersonDetail', { user: item })}
    >
      <View style={styles.userItemRow}>
        <View>
          <Text style={styles.userName}>{`${item.nombres} ${item.apellidos}`}</Text>
          <Text style={styles.userDetail}>{`Documento: ${item.tipoDocumento} ${item.numeroDocumento}`}</Text>
        </View>
        {/* Mostrar ícono si no está sincronizado */}
        {item.isSynced === 0 && (
          <Icon name="exclamation-circle" size={20} color="#E53E3E" style={styles.unsyncedIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#004085" />
        <Text style={styles.loaderText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { flexGrow: 1 }]}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No hay usuarios registrados.</Text>
          )}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('RegisterUser')}
        >
          <Text style={styles.addButtonText}>Registrar Usuario</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unsyncedIcon: {
    marginLeft: 10,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 100,
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B6CB0',
  },
  userDetail: {
    fontSize: 14,
    color: '#4A5568',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3182CE',
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#4A5568',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#4A5568',
    marginTop: 20,
  },
});