import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, DrawerActions, CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerParamList } from '../navigation/DrawerNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  DrawerNavigationProp<DrawerParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <Icon name="menu" size={24} color="#004085" />
      </TouchableOpacity>

      <Text style={styles.title}>Bienvenido a la pantalla Home</Text>
      <Text style={styles.subtitle}>Aquí es donde comienza la experiencia</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  menuButton: {
    position: 'absolute',
    top: 40,  // Incrementa el margen superior para evitar el desbordamiento con la barra de estado
    left: 10, // Incrementa el margen izquierdo para asegurar que esté dentro del borde de la pantalla
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
  },
  errorText: {
    color: '#DB4437',
    fontSize: 16,
    textAlign: 'center',
  },
});