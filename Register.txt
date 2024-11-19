import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const syncDataToFirebase = async () => {
  try {
    // Obtener datos almacenados localmente
    const localPersons = JSON.parse(
      (await AsyncStorage.getItem('persons')) || '[]'
    );

    // Filtrar los datos no sincronizados
    const unsyncedPersons = localPersons.filter(
      (person: any) => person.isSynced === 0
    );

    for (const person of unsyncedPersons) {
      // Verificar si ya existe en Firebase antes de subir
      const q = query(
        collection(db, 'persons'),
        where('numeroDocumento', '==', person.numeroDocumento) // Validar por campo único
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        try {
          // Subir a Firebase
          await addDoc(collection(db, 'persons'), { ...person, isSynced: 1 });

          // Actualizar estado a sincronizado localmente solo si se subió correctamente
          person.isSynced = 1;
        } catch (uploadError) {
          console.error(`Error subiendo ${person.numeroDocumento}:`, uploadError);
        }
      } else {
        console.log(
          `El documento con ID ${person.numeroDocumento} ya existe en Firebase.`
        );
      }
    }

    // Guardar los datos actualizados con isSynced = 1 en AsyncStorage
    await AsyncStorage.setItem('persons', JSON.stringify(localPersons));

    console.log('Sincronización con Firebase completada.');
    Alert.alert('Sincronización exitosa', 'Los datos han sido sincronizados.');
  } catch (error) {
    console.error('Error sincronizando datos con Firebase:', error);
    Alert.alert('Error', 'No se pudo sincronizar con Firebase.');
  }
};

type RegisterUserScreenNavigationProp = StackNavigationProp<PersonsStackParamList, 'RegisterUser'>;

export default function RegisterUserScreen() {
  const navigation = useNavigation<RegisterUserScreenNavigationProp>();
  const [registrador, setRegistrador] = useState<any>(null);

  const [formData, setFormData] = useState({
    tipoDocumento: 'Cédula de ciudadanía',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    celular: '',
    correo: '',
    ubicacion: '',
    vereda: '',
    departamento: '',
    municipio: '',
    numeroAsignado: '',
  });

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };
  
  const fetchRegistrador = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const storedRegistrador = await AsyncStorage.getItem('registrador');
        if (storedRegistrador) {
          setRegistrador(JSON.parse(storedRegistrador));
        } else {
          const registradorRef = doc(db, 'users', user.uid);
          const registradorSnap = await getDoc(registradorRef);
          if (registradorSnap.exists()) {
            const registradorData = { id: user.uid, ...registradorSnap.data() };
            setRegistrador(registradorData);
            await AsyncStorage.setItem('registrador', JSON.stringify(registradorData));
          } else {
            Alert.alert('Error', 'No se encontró el usuario registrador.');
          }
        }
      }
    } catch (error) {
      console.error('Error obteniendo el registrador:', error);
    }
  };

  const fetchDepartment = async () => {
    try {
      setLoadingMunicipios(true); // Aseguramos que se vea el estado de carga solo al inicio.
      const storedDepartment = await AsyncStorage.getItem('department');
      if (storedDepartment) {
        const departmentData = JSON.parse(storedDepartment);
        handleChange('departamento', departmentData.name || 'Putumayo');
        setMunicipios(departmentData.localities || []);
      } else {
        const docRef = doc(db, 'departments', '22'); // ID del departamento
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const departmentData = docSnap.data();
          handleChange('departamento', departmentData.name || 'Putumayo');
          setMunicipios(departmentData.localities || []);
          await AsyncStorage.setItem('department', JSON.stringify(departmentData));
        } else {
          Alert.alert('Error', 'No se encontró el documento del departamento.');
        }
      }
    } catch (error) {
      console.error('Error obteniendo el departamento:', error);
      Alert.alert('Error', 'No se pudo cargar el departamento.');
    } finally {
      setLoadingMunicipios(false); // Se asegura que el estado de carga cambie después de completar.
    }
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
    const calculateNextNumber = async () => {
      if (!registrador) {
        console.warn('Registrador no definido, esperando datos...');
        return;
      }
  
      try {
        // Obtener los registros locales
        const localPersons = JSON.parse(
          (await AsyncStorage.getItem('persons')) || '[]'
        );
  
        // Filtrar solo los registros correspondientes al registrador actual
        const usedNumbers = localPersons
          .filter((person: any) => person.registradoPor === registrador.id)
          .map((person: any) => Number(person.numeroAsignado));
  
        // Calcular el siguiente número basado en los números usados
        const nextNumber =
          usedNumbers.length > 0
            ? Math.max(...usedNumbers) + 1
            : registrador.currentNumber;
  
        if (nextNumber <= registrador.numberEnd) {
          setNextNumber(nextNumber);
          handleChange('numeroAsignado', nextNumber.toString());
        } else {
          Alert.alert('Error', 'No hay números disponibles en el rango asignado.');
          setNextNumber(null);
        }
      } catch (error) {
        console.error('Error calculando el siguiente número:', error);
        Alert.alert('Error', 'No se pudo calcular el siguiente número.');
      }
    };
  
    calculateNextNumber();
  }, [registrador]);  

  // Cargar departamento y municipios desde Firestore o AsyncStorage
  useEffect(() => {
    const initializeData = async () => {
      await fetchRegistrador();
      await fetchLocation();
      await fetchDepartment();
  
      // Sincronizar datos no sincronizados
      await syncDataToFirebase();
    };
  
    initializeData();
  }, []);

  const registerUser = async () => {
    try {
      if (!nextNumber) {
        Alert.alert('Error', 'No se pudo asignar un número.');
        return;
      }
  
      const newFormData = {
        ...formData,
        registradoPor: registrador?.id,
        isSynced: 0, // Inicialmente no sincronizado
      };
  
      // Guardar localmente
      const localPersons = JSON.parse(
        (await AsyncStorage.getItem('persons')) || '[]'
      );
      localPersons.push(newFormData);
      await AsyncStorage.setItem('persons', JSON.stringify(localPersons));
  
      // Intentar sincronizar con Firebase
      await syncDataToFirebase();
  
      Alert.alert('Éxito', 'Usuario registrado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error registrando el usuario:', error);
      Alert.alert('Error', 'No se pudo registrar el usuario.');
    }
  };  

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
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
        style={styles.picker}
        enabled={false}
      >
        {formData.departamento ? (
          <Picker.Item label={formData.departamento} value={formData.departamento} />
        ) : (
          <Picker.Item label="Cargando departamento..." value="" />
        )}
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
        value={nextNumber?.toString() || 'Calculando...'}
        editable={false}
      />

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