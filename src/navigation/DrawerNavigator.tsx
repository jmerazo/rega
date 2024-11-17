import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from './BottomTabNavigator';
import Sidebar from '../components/Sidebar';
import AdminUsersScreen from '../screens/AdminUsersScreen';

export type DrawerParamList = {
  Tabs: undefined;
  AdminPanel: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator({ role }: { role: string | null }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Tabs" component={BottomTabNavigator} />
    </Drawer.Navigator>
  );
}