import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeTabs from './src/navigation/BottomTabNavigator'; // Navegación inferior para la pantalla principal

const Stack = createStackNavigator();

export default function App() {
  return <AppNavigator />;
}
