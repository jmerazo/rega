import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
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

type User = {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  celular: string;
  correo: string;
  ubicacion: string;
  direccion: string;
  vereda: string;
  departamento: string;
  municipio: string;
  numeroAsignado: string;
};

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<UsersScreenNavigationProp>();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'persons'));
        const usersList: User[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as User);
        });
        setUsers(usersList);
      } catch (error) {
        console.error('Error obteniendo los usuarios: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('PersonDetail', { user: item })}
    >
      <Text style={styles.userName}>{`${item.nombres} ${item.apellidos}`}</Text>
      <Text style={styles.userDetail}>{`Documento: ${item.tipoDocumento} ${item.numeroDocumento}`}</Text>
      {/* Puedes agregar más detalles si lo deseas */}
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
        backgroundColor: '#fff', // Opcional, según el diseño
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
});