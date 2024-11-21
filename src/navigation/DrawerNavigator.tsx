import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from './BottomTabNavigator';
import Sidebar from '../components/Sidebar';
import UnsyncedPersonsScreen from '../screens/UnsyncedPersonsScreen'; // Asegúrate de importar correctamente

export type DrawerParamList = {
  Tabs: undefined;
  AdminPanel: undefined;
  UnsyncedPersons: undefined; // Debe coincidir
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator({ role }: { role: string | null }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Tabs" component={BottomTabNavigator} />
      <Drawer.Screen name="UnsyncedPersons" component={UnsyncedPersonsScreen} />
    </Drawer.Navigator>
  );
}