import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';

type RegisterUserScreenNavigationProp = StackNavigationProp<PersonsStackParamList, 'RegisterUser'>;

export default function RegisterUserScreen() {
  const navigation = useNavigation<RegisterUserScreenNavigationProp>();

  const [formData, setFormData] = useState({
    tipoDocumento: 'Cédula de ciudadanía',
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

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(true);

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se pudo obtener el permiso de ubicación.');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      handleChange('ubicacion', `${latitude}, ${longitude}`);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const docRef = doc(db, 'departments', '22'); // '22' es el ID del departamento Putumayo
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          handleChange('departamento', data.name || 'Putumayo');
          setMunicipios(data.localities || []);
        } else {
          Alert.alert('Error', 'No se encontró el departamento.');
        }
      } catch (error) {
        console.error('Error obteniendo el departamento:', error);
        Alert.alert('Error', 'No se pudo cargar el departamento.');
      } finally {
        setLoadingMunicipios(false);
      }
    };
    fetchLocation();
    fetchDepartment();
  }, []);

  const registerUser = async () => {
    try {
      await addDoc(collection(db, 'persons'), formData);
      Alert.alert('Éxito', 'Usuario registrado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error registrando el usuario: ', error);
      Alert.alert('Error', 'No se pudo registrar el usuario.');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {/* Tipo de Documento */}
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

      <Text style={styles.label}>Número de Documento</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de Documento"
        value={formData.numeroDocumento}
        onChangeText={(value) => handleChange('numeroDocumento', value)}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Nombres</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombres"
        value={formData.nombres}
        onChangeText={(value) => handleChange('nombres', value)}
      />

      <Text style={styles.label}>Apellidos</Text>
      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        value={formData.apellidos}
        onChangeText={(value) => handleChange('apellidos', value)}
      />

      <Text style={styles.label}>Celular</Text>
      <TextInput
        style={styles.input}
        placeholder="Celular"
        value={formData.celular}
        onChangeText={(value) => handleChange('celular', value)}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Correo Electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={formData.correo}
        onChangeText={(value) => handleChange('correo', value)}
        keyboardType="email-address"
      />

      {/* Ubicación */}
      <Text style={styles.label}>Ubicación (Lat, Lon)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ubicación"
        value={formData.ubicacion}
        editable={false}
      />

      <Text style={styles.label}>Vereda</Text>
      <TextInput
        style={styles.input}
        placeholder="Vereda"
        value={formData.vereda}
        onChangeText={(value) => handleChange('vereda', value)}
      />

      <Text style={styles.label}>Departamento</Text>
      <Picker
        selectedValue={formData.departamento}
        onValueChange={(value) => handleChange('departamento', value)}
        style={styles.picker}
        enabled={false}
      >
        <Picker.Item label={formData.departamento || 'Cargando...'} value={formData.departamento} />
      </Picker>

      <Text style={styles.label}>Municipio</Text>
      {loadingMunicipios ? (
        <Text>Cargando municipios...</Text>
      ) : (
        <Picker
          selectedValue={formData.municipio}
          onValueChange={(value) => handleChange('municipio', value)}
          style={styles.picker}
        >
          <Picker.Item label="Seleccione un municipio" value="" />
          {municipios.map((municipio, index) => (
            <Picker.Item key={index} label={municipio} value={municipio} />
          ))}
        </Picker>
      )}

      <Text style={styles.label}>Número asignado</Text>
      <TextInput
        style={styles.input}
        placeholder="Número Asignado"
        value={formData.numeroAsignado}
        onChangeText={(value) => handleChange('numeroAsignado', value)}
        keyboardType="numeric"
      />

      {/* Botón de registro */}
      <TouchableOpacity style={styles.button} onPress={registerUser}>
        <Text style={styles.buttonText}>Registrar Usuario</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
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