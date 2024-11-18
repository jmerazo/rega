import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PasswordResetScreen from '../screens/PasswordResetScreen'; // Pantalla de recuperación de contraseña

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordReset: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
    </Stack.Navigator>
  );
}