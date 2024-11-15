import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';

type RegisterUserScreenNavigationProp = StackNavigationProp<PersonsStackParamList, 'RegisterUser'>;

export default function RegisterUserScreen() {
  const navigation = useNavigation<RegisterUserScreenNavigationProp>();

  const [formData, setFormData] = useState({
    tipoDocumento: 'Cédula de ciudadanía', // Valor predeterminado
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    celular: '',
    correo: '',
    ubicacion: '',
    direccion: '',
    vereda: '',
    departamento: '',
    municipio: '',
    numeroAsignado: '',
  });

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const registerUser = async () => {
    try {
      await addDoc(collection(db, 'persons'), formData); // Cambiado a 'persons'
      Alert.alert('Éxito', 'Usuario registrado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error registrando el usuario: ', error);
      Alert.alert('Error', 'No se pudo registrar el usuario');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Picker para tipoDocumento */}
      <Text style={styles.label}>Tipo de Documento</Text>
      <Picker
        selectedValue={formData.tipoDocumento}
        onValueChange={(value) => handleChange('tipoDocumento', value)}
        style={styles.picker}
      >
        <Picker.Item label="Tarjeta de identidad" value="Tarjeta de identidad" />
        <Picker.Item label="Cédula de ciudadanía" value="Cédula de ciudadanía" />
        <Picker.Item label="Registro civil" value="Registro civil" />
        <Picker.Item label="Pasaporte" value="Pasaporte" />
      </Picker>

      {/* Resto de los campos de entrada */}
      <TextInput
        style={styles.input}
        placeholder="Número de Documento"
        value={formData.numeroDocumento}
        onChangeText={(value) => handleChange('numeroDocumento', value)}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Nombres"
        value={formData.nombres}
        onChangeText={(value) => handleChange('nombres', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        value={formData.apellidos}
        onChangeText={(value) => handleChange('apellidos', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Celular"
        value={formData.celular}
        onChangeText={(value) => handleChange('celular', value)}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={formData.correo}
        onChangeText={(value) => handleChange('correo', value)}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Ubicación"
        value={formData.ubicacion}
        onChangeText={(value) => handleChange('ubicacion', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Dirección"
        value={formData.direccion}
        onChangeText={(value) => handleChange('direccion', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Vereda"
        value={formData.vereda}
        onChangeText={(value) => handleChange('vereda', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Departamento"
        value={formData.departamento}
        onChangeText={(value) => handleChange('departamento', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Municipio"
        value={formData.municipio}
        onChangeText={(value) => handleChange('municipio', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Número Asignado"
        value={formData.numeroAsignado}
        onChangeText={(value) => handleChange('numeroAsignado', value)}
        keyboardType="numeric"
      />
      
      <TouchableOpacity style={styles.button} onPress={registerUser}>
        <Text style={styles.buttonText}>Registrar Usuario</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F0F4F8',
  },
  label: {
    fontSize: 16,
    color: '#2B6CB0',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  button: {
    backgroundColor: '#3182CE',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});