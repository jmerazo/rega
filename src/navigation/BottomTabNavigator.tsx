// BottomTabNavigator.tsx
import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminUsersScreen from '../screens/AdminUsersScreen'
import HomeScreen from '../screens/HomeScreen';
import PersonsStackNavigator from './PersonsStackNavigator';
import AdminUsersStackNavigator from './AdminUsersStackNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RoleContext } from '../utils/RoleContext';

export type BottomTabParamList = {
  Home: undefined;
  Panel: undefined;
  Users: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const role = useContext(RoleContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Users') iconName = 'people';
          else if (route.name === 'Panel') iconName = 'settings';
          return <Icon name={iconName || ''} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#004085',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Users" component={PersonsStackNavigator} options={{ headerShown: false, title: 'Usuarios' }} />
      {/* Si la pantalla RegisterScreen es diferente a RegisterUserScreen */}
      {role === 'Administrador' && (
        <Tab.Screen name="Panel" component={AdminUsersStackNavigator} options={{ headerShown: false }} />
      )}
    </Tab.Navigator>
  );
}