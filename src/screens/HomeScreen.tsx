import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoleContext } from '../utils/RoleContext';
import { useFocusEffect } from '@react-navigation/native';


type Person = {
  nombres: string,
  apellidos: string,
  numeroDocumento: string;
  tipoDocumento: string,
  departamento: string,
  vereda: string,
  ubicacion: string,
  celular: string,
  correo: string,
  municipio: string;
  isSynced: number;
  numeroAsignado: string;
  registradoPor: string;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [municipioData, setMunicipioData] = useState<{ [key: string]: number }>(
    {}
  );
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false); // Estado para controlar el cargue del rol
  const userRole = useContext(RoleContext);
  const [isConnected, setIsConnected] = useState(true);

  const fetchCurrentUserId = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      await AsyncStorage.setItem('currentUserId', currentUser.uid);
      setCurrentUserId(currentUser.uid); // Solo se actualiza aquí
      return currentUser.uid;
    } catch (error) {
      console.error('Error al obtener el usuario actual:', error);
      return null;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [currentUserId, userRole])
  );  

  const fetchData = async () => {
    try {
      const storedPersons: Person[] = JSON.parse(
        (await AsyncStorage.getItem('persons')) || '[]'
      );
  
      let filteredPersons: Person[] = [];
  
      // Filtrar registros según el rol y el usuario actual
      if (userRole === 'Registrador' && currentUserId) {
        filteredPersons = storedPersons.filter(
          (person) => person.registradoPor === currentUserId
        );
      } else if (userRole === 'Administrador') {
        filteredPersons = storedPersons; // Administrador ve todos los registros
      }
  
      // Contar registros no sincronizados
      const unsyncedPersons = filteredPersons.filter(
        (person) => person.isSynced === 0
      );
      setPendingSyncCount(unsyncedPersons.length);
  
      // Calcular datos por municipio
      const counts: { [key: string]: number } = {};
      filteredPersons.forEach((person) => {
        const municipio = person.municipio || 'Sin especificar';
        counts[municipio] = (counts[municipio] || 0) + 1;
      });
  
      setMunicipioData(counts);
      setTotalRecords(filteredPersons.length); // Actualizar registros totales
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (initialized) return; // Evita dobles inicializaciones

      const storedUserId = await AsyncStorage.getItem('currentUserId');
      if (!storedUserId) {
        await fetchCurrentUserId(); // Solo se obtiene una vez
      } else {
        setCurrentUserId(storedUserId);
      }

      setIsRoleLoaded(true); // Marca que el rol está cargado
      setInitialized(true); // Marca que ya se inicializó
    };
    initialize();
  }, []);

  useEffect(() => {
    if (isRoleLoaded && userRole) {
      // Solo ejecuta la consulta de datos si el rol ya está cargado
      fetchData();
    }
  }, [isRoleLoaded, userRole, currentUserId]);

  if (!isRoleLoaded) {
    // Muestra un indicador de carga mientras se espera el rol
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#004085" />
      </SafeAreaView>
    );
  }

  const syncData = async () => {
    try {
      // Verificar conexión a Internet
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        Alert.alert('Sin conexión', 'No tienes conexión a Internet.');
        return; // Detener el proceso de sincronización
      }
  
      // Obtén los datos almacenados localmente
      let storedPersons: Person[] = JSON.parse(
        (await AsyncStorage.getItem('persons')) || '[]'
      );
  
      // Sincronizar datos locales no sincronizados con Firestore
      const unsyncedPersons = storedPersons.filter(
        (person) => person.isSynced === 0
      );
  
      for (const person of unsyncedPersons) {
        const q = query(
          collection(db, 'persons'),
          where('numeroDocumento', '==', person.numeroDocumento)
        );
        const existingRecord = await getDocs(q);
  
        if (existingRecord.empty) {
          // Subir el registro con isSynced = 1
          await addDoc(collection(db, 'persons'), {
            ...person,
            isSynced: 1,
          });
        } else {
          // Opcionalmente, actualizar el documento existente
          // await updateDoc(existingRecord.docs[0].ref, { isSynced: 1 });
        }
  
        // Marcar como sincronizado en storedPersons
        person.isSynced = 1;
      }
  
      // Descargar nuevos datos desde Firestore
      const personsCollection = collection(db, 'persons');
      const querySnapshot = await getDocs(personsCollection);
      const firestorePersons: Person[] = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        firestorePersons.push({
          ...data,
          isSynced: 1, // Aseguramos que los datos descargados tienen isSynced = 1
        } as Person); // Casting a tipo Person si es necesario
      });
  
      // Combinar datos locales y de Firestore
      const personMap = new Map();
  
      // Añadir datos locales al mapa
      for (const person of storedPersons) {
        personMap.set(person.numeroDocumento, person);
      }
  
      // Añadir o actualizar datos de Firestore al mapa
      for (const person of firestorePersons) {
        personMap.set(person.numeroDocumento, person);
      }
  
      // Convertir el mapa a un array y guardar en AsyncStorage
      storedPersons = Array.from(personMap.values());
      await AsyncStorage.setItem('persons', JSON.stringify(storedPersons));
  
      // Actualizar el conteo de pendientes
      const pendingCount = storedPersons.filter(
        (person) => person.isSynced === 0
      ).length;
      setPendingSyncCount(pendingCount);
  
      Alert.alert('Éxito', 'Sincronización completada correctamente.');
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
      Alert.alert('Error', 'No se pudo completar la sincronización.');
    }
  };      

  const exportToExcel = async () => {
    try {
      // Obtener toda la tabla de `persons` desde AsyncStorage
      const storedPersons: Person[] = JSON.parse(
        (await AsyncStorage.getItem('persons')) || '[]'
      );
  
      if (storedPersons.length === 0) {
        Alert.alert('Advertencia', 'No hay datos para exportar.');
        return;
      }
  
      // Crear el formato para el Excel
      const data = storedPersons.map((person) => ({
        tipoDocumento: person.tipoDocumento,
        Documento: person.numeroDocumento,
        Nombres: person.nombres,
        Apellidos: person.apellidos,
        Celular: person.celular,
        Correo: person.correo,
        Vereda: person.vereda,
        Ubicación: person.ubicacion,
        Departamento: person.departamento || 'Sin especificar',
        Municipio: person.municipio || 'Sin especificar',
        NumeroAsignado: person.numeroAsignado,
        RegistradoPor: person.registradoPor,
        Sincronizado: person.isSynced === 1 ? 'Sí' : 'No',
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Personas');
  
      // Convertir el workbook a formato base64 para guardar el archivo
      const excelData = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  
      const filePath = `${FileSystem.documentDirectory}TablaPersons.xlsx`;
  
      // Guardar el archivo en el sistema de archivos
      await FileSystem.writeAsStringAsync(filePath, excelData, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Compartir el archivo o notificar al usuario
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert(
          'Error',
          'La opción para compartir no está disponible en este dispositivo.'
        );
      }
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo.');
    }
  };

  const chartData = {
    labels: Object.keys(municipioData),
    datasets: [
      {
        data: Object.values(municipioData),
      },
    ],
  };

  const maxDataValue = Math.max(...Object.values(municipioData));
  const segments = maxDataValue > 5 ? 5 : maxDataValue; // Limita a 5 divisiones

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 80 }]}>
        {/* Botón de sincronización en la esquina superior derecha */}
        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncData}
          activeOpacity={0.7}
        >
          <Icon name="sync" size={24} color="#004085" />
          {pendingSyncCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingSyncCount}</Text>
            </View>
          )}
        </TouchableOpacity>
  
        {/* Botón del menú */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          activeOpacity={0.7}
        >
          <Icon name="menu" size={24} color="#004085" />
        </TouchableOpacity>
  
        <Text style={styles.title}>Bienvenido a REGA</Text>
        <Text style={styles.subtitle}>Resumen de datos registrados</Text>
  
        {/* Card de registros totales */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registros Totales</Text>
          {userRole === 'Administrador' ? (
            <Text style={styles.cardCount}>{totalRecords}</Text>
          ) : (
            <Text style={styles.cardCount}>{totalRecords} / 200</Text>
          )}
        </View>
  
        {/* Gráfica de barras */}
        {Object.keys(municipioData).length > 0 ? (
          <BarChart
            data={chartData}
            width={Math.max(Dimensions.get('window').width - 50, Object.keys(municipioData).length * 30)}
            height={300}
            yAxisLabel="" // Etiqueta del eje Y (vacío si no se usa)
            yAxisSuffix="" // Sufijo del eje Y (vacío si no se usa)
            fromZero={true} // Comienza desde 0
            segments={segments} // Número de divisiones en el eje Y
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#F4F7FA',
              backgroundGradientTo: '#F4F7FA',
              decimalPlaces: 0, // Sin decimales
              color: (opacity = 1) => `rgba(44, 130, 201, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            style={styles.chart}
            verticalLabelRotation={-90} // Rota las etiquetas del eje X
          />
        ) : (
          <Text style={styles.noDataText}>No hay datos para mostrar.</Text>
        )}
      </ScrollView>
  
      {/* Botón para exportar a Excel */}
      <TouchableOpacity
        style={styles.exportButton}
        onPress={exportToExcel}
        activeOpacity={0.7}
      >
        <Icon name="file-download" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );  
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  container: {
  flexGrow: 1,
  padding: 16,
  paddingBottom: 80, // Añade espacio inferior para el botón
},
  menuButton: {
    position: 'absolute',
    left: 10,
    paddingBottom: 80
  },
  syncButton: {
    position: 'absolute',
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2B6CB0',
  },
  chart: {
    marginVertical: 20,
    width: '100%',
  },
  noDataText: {
    fontSize: 16,
    color: '#4A5568',
    marginTop: 16,
    textAlign: 'center',
  },
  exportButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3182CE',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});