import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps, DrawerItem } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer'; // Importa DrawerNavigationProp
import { DrawerParamList } from '../navigation/navigation'; // Ajusta la ruta según tu estructura

export default function Sidebar(props: DrawerContentComponentProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [lastname, setLastname] = useState<string | null>(null);

  type SidebarNavigationProp = DrawerNavigationProp<DrawerParamList>;

  const navigation = useNavigation<SidebarNavigationProp>();

  // Función para navegar a la pantalla de registros pendientes
  const navigateToUnsyncedPersons = () => {
    navigation.navigate('UnsyncedPersons');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || null);
          setName(userData.name || null);
          setLastname(userData.lastname || null);
        } else {
          setRole(null);
          setName(null);
          setLastname(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setName(null);
        setLastname(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    auth.signOut().catch((error) => {
      console.error(error);
    });
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.profileSection}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profilePlaceholderText}>
                {user?.displayName ? user.displayName[0] : 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{name || 'Nombre no disponible'} {lastname || ''}</Text>
          <Text style={styles.userEmail}>{user?.email || 'Correo no disponible'}</Text>
          <Text style={styles.userRole}>Rol: {role || 'Sin asignar'}</Text>
        </View>

        <DrawerItem
          label="No sincronizados"
          onPress={navigateToUnsyncedPersons}
          icon={({ color, size }) => (
            <Icon name="sync-problem" color={color} size={size} />
          )}
        />

        <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#DB4437" />
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  profilePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 20,
  },
  userRole: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  logoutIcon: {
    alignSelf: 'center',
    marginTop: 20,
  },
});
