import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import DrawerNavigator from './DrawerNavigator'; 
import Sidebar from '../components/Sidebar';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PasswordResetScreen from '../screens/PasswordResetScreen';
import { RoleContext } from '../utils/RoleContext';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

/* function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="HomeDrawer" component={BottomTabNavigator} />
    </Drawer.Navigator>
  );
}
 */
export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
  
        // Obtén y almacena el rol del usuario
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role || null;
          setRole(userRole);
  
          // Almacena uid y rol en AsyncStorage
          await AsyncStorage.setItem('currentUserId', currentUser.uid);
          await AsyncStorage.setItem('userRole', userRole || '');
        } else {
          console.log('El usuario no tiene un rol asignado.');
          setRole(null);
          await AsyncStorage.removeItem('userRole'); // Limpia rol si no está definido
        }
      } else {
        setUser(null);
        setRole(null);
        await AsyncStorage.removeItem('currentUserId'); // Limpia uid si el usuario no está autenticado
        await AsyncStorage.removeItem('userRole'); // Limpia rol si el usuario no está autenticado
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) return null; // Muestra un indicador de carga mientras se obtienen los datos

  return (
    <RoleContext.Provider value={role}>
      <NavigationContainer>
        {user ? (
          // Utiliza el DrawerNavigator importado
          <DrawerNavigator role={role} />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </RoleContext.Provider>
  );
}
