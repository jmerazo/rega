import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UsersScreen from '../screens/PersonsScreen';
import PersonDetailScreen from '../screens/PersonDetailScreen';
import RegisterUserScreen from '../screens/RegisterPersonScreen';

export type User = {
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

export type PersonsStackParamList = {
    UsersList: undefined;
    RegisterUser: undefined;
    PersonDetail: { user: User }; // Agrega esta línea
};
  
const Stack = createStackNavigator<PersonsStackParamList>();

export default function PersonsStackNavigator() {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="UsersList"
          component={UsersScreen}
          options={{ title: 'Usuarios' }}
        />
        <Stack.Screen
          name="RegisterUser"
          component={RegisterUserScreen}
          options={{ title: 'Registrar Usuario' }}
        />
        <Stack.Screen
          name="PersonDetail"
          component={PersonDetailScreen}
          options={{ title: 'Detalle del Usuario' }}
        />
      </Stack.Navigator>
    );
}