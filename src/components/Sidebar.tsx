// Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Sidebar(props: DrawerContentComponentProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || null); // Obtén el rol del usuario
        } else {
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
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
    <DrawerContentScrollView {...props}>
      <View style={styles.container}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profilePlaceholderText}>
              {user?.displayName ? user.displayName[0] : 'U'}
            </Text>
          </View>
        )}
        <Text style={styles.userName}>{user?.displayName || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Correo no disponible'}</Text>
        <Text style={styles.userRole}>Rol: {role || 'Sin asignar'}</Text>

        {/* Botón para navegar al Panel de Administración */}
        {role === 'Administrador' && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => props.navigation.navigate('AdminPanel')}
          >
            <Text style={styles.adminButtonText}>Panel de Administración</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 20,
  },
  adminButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#DB4437',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});