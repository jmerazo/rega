import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UsersScreen from '../screens/PersonsScreen';
import RegisterUserScreen from '../screens/RegisterPersonScreen';

export type PersonsStackParamList = {
  UsersList: undefined;
  RegisterUser: undefined;
};

const Stack = createStackNavigator<PersonsStackParamList>();

export default function UsersStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UsersList" component={UsersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RegisterUser" component={RegisterUserScreen} options={{ title: 'Registrar Usuario' }} />
    </Stack.Navigator>
  );
}