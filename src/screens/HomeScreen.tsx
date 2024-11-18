import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Person = {
  numeroDocumento: string;
  municipio: string;
  isSynced: number;
  numeroAsignado: string;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [municipioData, setMunicipioData] = useState<{ [key: string]: number }>(
    {}
  );
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const fetchData = async () => {
    try {
      const storedPersons: Person[] = JSON.parse(
        (await AsyncStorage.getItem('persons')) || '[]'
      );

      // Filtrar los registros pendientes de sincronización
      const unsyncedPersons = storedPersons.filter(
        (person) => person.isSynced === 0
      );
      setPendingSyncCount(unsyncedPersons.length);

      const counts: { [key: string]: number } = {};
      storedPersons.forEach((person) => {
        const municipio = person.municipio || 'Sin especificar';
        counts[municipio] = (counts[municipio] || 0) + 1;
      });

      setMunicipioData(counts);
      setTotalRecords(storedPersons.length);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    }
  };

  const syncData = async () => {
    try {
      const storedPersons: Person[] = JSON.parse(
        (await AsyncStorage.getItem('persons')) || '[]'
      );

      const unsyncedPersons = storedPersons.filter(
        (person) => person.isSynced === 0
      );

      for (const person of unsyncedPersons) {
        const q = query(
          collection(db, 'persons'),
          where('numeroDocumento', '==', person.numeroDocumento)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(collection(db, 'persons'), person);
          person.isSynced = 1; // Marcar como sincronizado
        }
      }

      // Guardar los datos actualizados en AsyncStorage
      await AsyncStorage.setItem('persons', JSON.stringify(storedPersons));

      // Actualizar el estado de los pendientes
      setPendingSyncCount(0);
      Alert.alert('Éxito', 'Datos sincronizados correctamente.');
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
      Alert.alert('Error', 'No se pudo completar la sincronización.');
    }
  };

  const exportToExcel = async () => {
    try {
      const data = Object.entries(municipioData).map(([municipio, count]) => ({
        Municipio: municipio,
        Registros: count,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros por Municipio');

      const excelData = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

      const filePath = `${FileSystem.documentDirectory}RegistrosMunicipio.xlsx`;

      await FileSystem.writeAsStringAsync(filePath, excelData, {
        encoding: FileSystem.EncodingType.Base64,
      });

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

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = {
    labels: Object.keys(municipioData),
    datasets: [
      {
        data: Object.values(municipioData),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
          <Text style={styles.cardCount}>{totalRecords} / 200</Text>
        </View>

        {/* Gráfica de barras */}
        {Object.keys(municipioData).length > 0 ? (
          <BarChart
            data={chartData}
            width={Dimensions.get('window').width - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#F4F7FA',
              backgroundGradientTo: '#F4F7FA',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(44, 130, 201, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No hay datos para mostrar.</Text>
        )}

        {/* Botón para exportar a Excel */}
        <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
          <Text style={styles.exportButtonText}>Exportar a Excel</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  menuButton: {
    position: 'absolute',
    left: 10,
  },
  syncButton: {
    position: 'absolute',
    right: 10,
    top: 10,
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
    backgroundColor: '#3182CE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});