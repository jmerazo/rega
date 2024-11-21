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
import { collection, addDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { PersonsStackParamList } from '../navigation/PersonsStackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../database/database';

type RegisterUserScreenNavigationProp = StackNavigationProp<
  PersonsStackParamList,
  'RegisterUser'
>;

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
  const [loadingMunicipios, setLoadingMunicipios] = useState(true);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Sincronizar datos entre Firestore y AsyncStorage
  const syncFirestoreData = async () => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'persons'), async (snapshot) => {
        const firestorePersons = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Recuperar datos locales existentes
        const localPersonsData = await AsyncStorage.getItem('persons');
        const localPersons = localPersonsData ? JSON.parse(localPersonsData) : [];
  
        // Fusionar datos locales y Firestore
        const mergedPersons = [...localPersons, ...firestorePersons].reduce(
          (acc, person) => {
            if (!acc.find((p: Person) => p.numeroDocumento === person.numeroDocumento)) {
              acc.push(person);
            }
            return acc;
          },
          []
        );
  
        // Guardar datos fusionados
        await AsyncStorage.setItem('persons', JSON.stringify(mergedPersons));
      });
  
      return unsubscribe;
    } catch (error) {
      console.error('Error sincronizando datos:', error);
    }
  };
  
  // Obtener datos del registrador
  useEffect(() => {
    const fetchRegistrador = async () => {
      try {
        // Obtener el usuario actual
        const user = auth.currentUser;
  
        if (!user) {
        Alert.alert('Error', 'No se encontró una sesión activa.');
          return;
        }
   
        // Verificar el estado de conexión
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          console.log('Conexión a internet detectada. Cargando datos desde Firestore...');
          // Obtener detalles del usuario desde Firestore
          const registradorRef = doc(db, 'users', user.uid);
          const registradorSnap = await getDoc(registradorRef);
  
          if (registradorSnap.exists()) {
            const registradorData = { id: user.uid, ...registradorSnap.data() };
            setRegistrador(registradorData);
  
            // Almacenar los datos localmente
            await AsyncStorage.setItem('registrador', JSON.stringify(registradorData));
          } else {
           Alert.alert('Error', 'No se encontró el usuario registrador.');
          }
        } else {
         // Obtener datos locales de AsyncStorage
          const localRegistrador = await AsyncStorage.getItem('registrador');
          if (localRegistrador) {
            const registradorData = JSON.parse(localRegistrador);
            setRegistrador(registradorData);
         } else {
           Alert.alert('Error', 'No se encontraron datos locales del registrador.');
          }
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la información del registrador.');
      }
    };
  
    fetchRegistrador();
  }, []);

  // Calcular el siguiente número asignado
  const calculateNextNumber = async () => {
    if (!registrador) {
      console.warn('Registrador no disponible.');
      return;
    }
  
    try {
      const db = Database.getInstance();
  
      // Obtener registros locales de AsyncStorage
      const localPersons = await db.getData('persons');
  
      // Validar recuperación de datos
      if (!localPersons || !Array.isArray(localPersons)) {
        Alert.alert('Error', 'No se encontraron datos locales para calcular el siguiente número.');
        return;
      }
  
      // Filtrar por registrador actual
      const filteredPersons = localPersons.filter(
        (person: any) => person.registradoPor === registrador.id
      );
  
  
      // Obtener los números asignados
      const usedNumbers = filteredPersons.map((person: any) => Number(person.numeroAsignado));
    
      // Calcular el siguiente número
      const nextNumber =
        usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : registrador.currentNumber;
    
      if (nextNumber <= registrador.numberEnd) {
        setNextNumber(nextNumber);
        handleChange('numeroAsignado', nextNumber.toString());
      } else {
        Alert.alert('Error', 'No hay números disponibles en el rango asignado.');
        setNextNumber(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al calcular el siguiente número.');
    }
  };   

  // Cargar datos del departamento y municipios
  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const db = Database.getInstance();
    
        // Recuperar datos de AsyncStorage
        const storedDepartments = await db.getData('departments');
        if (storedDepartments) {
          // Busca el departamento específico (ID '22' en este caso)
          const department = storedDepartments.find((dept: any) => dept.id === '22');
          if (department) {
            handleChange('departamento', department.name || 'Putumayo');
            setMunicipios(department.localities || []);
          } else {
            Alert.alert('Error', 'Departamento no encontrado en datos sincronizados.');
          }
        } else {
          Alert.alert('Error', 'Datos de departamentos no disponibles offline.');
        }
      } catch (error) {
        console.error('Error obteniendo el departamento desde AsyncStorage:', error);
        Alert.alert('Error', 'No se pudo cargar el departamento.');
      } finally {
        setLoadingMunicipios(false);
      }
    };    

    fetchDepartment();
  }, []);

  // Obtener ubicación del usuario
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
    fetchLocation();
  }, []);

  type Person = {
    nombres: string;
    apellidos: string;
    numeroDocumento: string;
    tipoDocumento: string;
    departamento: string;
    vereda: string;
    ubicacion: string;
    celular: string;
    correo: string;
    municipio: string;
    isSynced: number;
    numeroAsignado: string;
    registradoPor: string;
  };  

  // Registrar un nuevo usuario
  const registerUser = async () => {
    try {
      if (!nextNumber) {
        Alert.alert('Error', 'No se pudo asignar un número.');
        return;
      }
  
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No se encontró una sesión activa.');
        return;
      }
  
      const newFormData: Person = {
        ...formData,
        registradoPor: user.uid,
        isSynced: 0,
      };
  
      // Recuperar datos locales existentes
      const localPersonsData = await AsyncStorage.getItem('persons');
      const localPersons: Person[] = localPersonsData
        ? JSON.parse(localPersonsData)
        : [];
  
      // Agregar nuevo registro sin sobrescribir
      const updatedPersons = [...localPersons, newFormData];
      await AsyncStorage.setItem('persons', JSON.stringify(updatedPersons));
  
      // Sincronizar si hay conexión
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        try {
          await addDoc(collection(db, 'persons'), {
            ...newFormData,
            isSynced: 1,
          });
  
          // Actualizar sincronización local
          const syncedPersons = updatedPersons.map((person) =>
            person.numeroDocumento === newFormData.numeroDocumento
              ? { ...newFormData, isSynced: 1 }
              : person
          );
          await AsyncStorage.setItem('persons', JSON.stringify(syncedPersons));
        } catch (syncError) {
          console.warn('No se pudo sincronizar con Firestore:', syncError);
        }
      }
  
      // Limpiar formulario y navegar
      setFormData({
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
      Alert.alert('Éxito', 'Usuario registrado correctamente.');
      navigation.navigate('UsersList');
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el usuario.');
    }
  };     

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
  
    const setupSync = async () => {
      unsubscribe = await syncFirestoreData();
      calculateNextNumber();
    };
  
    setupSync();
  
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [registrador]);  

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