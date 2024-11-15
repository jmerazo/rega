// UserDetailScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';

type PersonDetailScreenRouteProp = RouteProp<PersonsStackParamList, 'PersonDetail'>;

type Props = {
  route: PersonDetailScreenRouteProp;
};

export default function UserDetailScreen({ route }: Props) {
  const { user } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`${user.nombres} ${user.apellidos}`}</Text>
      <Text style={styles.detail}>{`Tipo de Documento: ${user.tipoDocumento}`}</Text>
      <Text style={styles.detail}>{`Número de Documento: ${user.numeroDocumento}`}</Text>
      <Text style={styles.detail}>{`Celular: ${user.celular}`}</Text>
      <Text style={styles.detail}>{`Correo: ${user.correo}`}</Text>
      <Text style={styles.detail}>{`Ubicación: ${user.ubicacion}`}</Text>
      <Text style={styles.detail}>{`Dirección: ${user.direccion}`}</Text>
      <Text style={styles.detail}>{`Vereda: ${user.vereda}`}</Text>
      <Text style={styles.detail}>{`Departamento: ${user.departamento}`}</Text>
      <Text style={styles.detail}>{`Municipio: ${user.municipio}`}</Text>
      <Text style={styles.detail}>{`Número Asignado: ${user.numeroAsignado}`}</Text>
      {/* Agrega más campos si es necesario */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2B6CB0',
  },
  detail: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4A5568',
  },
});
