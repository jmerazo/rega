import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, DrawerActions, CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerParamList } from '../navigation/DrawerNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  DrawerNavigationProp<DrawerParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [municipioData, setMunicipioData] = useState<{ [key: string]: number }>({});
  const [totalRecords, setTotalRecords] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'persons'));
        const counts: { [key: string]: number } = {};
        querySnapshot.forEach((doc) => {
          const municipio = doc.data()?.municipio || 'Sin especificar';
          counts[municipio] = (counts[municipio] || 0) + 1;
        });
        setMunicipioData(counts);
        setTotalRecords(querySnapshot.size);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
        Alert.alert('Error', 'No se pudo cargar la información.');
      }
    };

    fetchData();
  }, []);

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
  
      // Ruta donde se guarda temporalmente el archivo
      const filePath = `${FileSystem.documentDirectory}RegistrosMunicipio.xlsx`;
  
      // Guardar el archivo temporalmente
      await FileSystem.writeAsStringAsync(filePath, excelData, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Compartir o guardar el archivo usando Sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Error', 'La opción para compartir no está disponible en este dispositivo.');
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <Icon name="menu" size={24} color="#004085" />
      </TouchableOpacity>

      <Text style={styles.title}>Bienvenido a REGA</Text>
      <Text style={styles.subtitle}>Resumen de datos registrados</Text>

      {/* Card de registros totales */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registros Totales</Text>
        <Text style={styles.cardCount}>{totalRecords}</Text>
      </View>

      {/* Gráfica de barras */}
      {Object.keys(municipioData).length > 0 ? (
        <BarChart
          data={chartData}
          width={Dimensions.get('window').width - 32} // Ancho ajustado
          height={220}
          yAxisLabel=""
          yAxisSuffix="" // Se agrega esta propiedad
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F0F4F8',
    flexGrow: 1,
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    left: 10,
    padding: 10,
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
    width: '90%',
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
    width: '90%',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
