import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UsersListScreen from '../screens/AdminUsersScreen';

export type AdminUsersStackParamList = {
  UsersList: undefined;
};

const Stack = createStackNavigator<AdminUsersStackParamList>();

export default function AdminUsersStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="UsersList"
        component={UsersListScreen}
        options={{ title: 'Gestión de Usuarios' }} // Título predeterminado
      />
    </Stack.Navigator>
  );
}
