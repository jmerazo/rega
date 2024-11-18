import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';

type PersonDetailScreenRouteProp = RouteProp<PersonsStackParamList, 'PersonDetail'>;

type Props = {
  route: PersonDetailScreenRouteProp;
};

export default function UserDetailScreen({ route }: Props) {
  const { user } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Icon name="person" size={50} color="#3182CE" />
        <Text style={styles.title}>{`${user.nombres} ${user.apellidos}`}</Text>
      </View>

      <View style={styles.detailContainer}>
        <DetailItem label="Tipo de Documento" value={user.tipoDocumento} icon="assignment-ind" />
        <DetailItem label="Número de Documento" value={user.numeroDocumento} icon="fingerprint" />
        <DetailItem label="Celular" value={user.celular} icon="phone" />
        <DetailItem label="Correo" value={user.correo} icon="email" />
        <DetailItem label="Ubicación" value={user.ubicacion} icon="location-on" />
        <DetailItem label="Vereda" value={user.vereda} icon="place" />
        <DetailItem label="Departamento" value={user.departamento} icon="map" />
        <DetailItem label="Municipio" value={user.municipio} icon="location-city" />
        <DetailItem label="Número Asignado" value={user.numeroAsignado} icon="format-list-numbered" />
        <DetailItem
          label="Sincronizado"
          value={user.isSynced ? 'Sí' : 'No'}
          icon={user.isSynced ? 'check-circle' : 'error'}
          iconColor={user.isSynced ? '#28A745' : '#DC3545'}
        />
      </View>
    </ScrollView>
  );
}

type DetailItemProps = {
  label: string;
  value: string | number;
  icon: string;
  iconColor?: string;
};

const DetailItem = ({ label, value, icon, iconColor = '#4A5568' }: DetailItemProps) => (
  <View style={styles.detailItem}>
    <Icon name={icon} size={24} color={iconColor} style={styles.icon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F7FAFC',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginTop: 8,
    textAlign: 'center',
  },
  detailContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A5568',
  },
  detailValue: {
    fontSize: 16,
    color: '#2D3748',
  },
});