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
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';

type UsersScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Users'>,
  StackNavigationProp<PersonsStackParamList>
>;

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigation = useNavigation<UsersScreenNavigationProp>();

  useEffect(() => {
    const fetchRoleAndUsers = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No se pudo obtener el usuario actual.');
        setLoading(false);
        return;
      }

      // Obtener el rol del usuario logueado
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const role = userDocSnap.data()?.role || null;
        setUserRole(role);

        // Configurar la consulta según el rol
        let usersQuery;
        if (role === 'Registrador') {
          usersQuery = query(
            collection(db, 'persons'),
            where('registradoPor', '==', currentUser.uid)
          );
        } else if (role === 'Administrador') {
          usersQuery = collection(db, 'persons');
        } else {
          Alert.alert('Error', 'Rol desconocido.');
          setLoading(false);
          return;
        }

        // Escuchar los cambios en tiempo real
        const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
          const usersList: any[] = [];
          querySnapshot.forEach((doc) => {
            usersList.push({ id: doc.id, ...doc.data() });
          });
          setUsers(usersList);
          setLoading(false);
        });

        // Limpiar la suscripción al desmontar el componente
        return () => unsubscribe();
      } else {
        Alert.alert('Error', 'No se encontró información del usuario.');
        setLoading(false);
      }
    };

    fetchRoleAndUsers();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('PersonDetail', { user: item })}
    >
      <Text style={styles.userName}>{`${item.nombres} ${item.apellidos}`}</Text>
      <Text style={styles.userDetail}>{`Documento: ${item.tipoDocumento} ${item.numeroDocumento}`}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#004085" />
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#4A5568',
    marginTop: 20,
  },
});