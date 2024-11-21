import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

export default function UnsyncedPersonsScreen() {
  const [unsyncedPersons, setUnsyncedPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUnsyncedPersons = async () => {
    try {
      const storedPersons: Person[] = JSON.parse(
        (await AsyncStorage.getItem('persons')) || '[]'
      );
      const unsynced = storedPersons.filter((person) => person.isSynced === 0);
      setUnsyncedPersons(unsynced);
    } catch (error) {
      console.error('Error al obtener los registros no sincronizados:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUnsyncedPersons(); // O la función que carga tus datos
    }, [])
  );  

  const exportToExcel = async () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(unsyncedPersons);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'RegistrosPendientes');

      const excelBuffer = XLSX.write(workbook, {
        type: 'base64',
        bookType: 'xlsx',
      });

      const fileName = `RegistrosPendientes_${new Date().getTime()}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar a Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      Alert.alert('Error', 'No se pudo exportar a Excel.');
    }
  };

  const renderItem = ({ item }: { item: Person }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>
        {item.nombres} {item.apellidos}
      </Text>
      <Text style={styles.itemText}>
        Documento: {item.tipoDocumento} - {item.numeroDocumento}
      </Text>
      <Text style={styles.itemText}>Municipio: {item.municipio}</Text>
      {/* Puedes agregar más detalles si lo deseas */}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004085" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registros Pendientes</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
          <Icon name="file-download" size={24} color="#fff" />
          <Text style={styles.exportButtonText}>Exportar a Excel</Text>
        </TouchableOpacity>
      </View>
      {unsyncedPersons.length > 0 ? (
        <FlatList
          data={unsyncedPersons}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.noDataText}>
          No hay registros pendientes de sincronización.
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    top: 50
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemContainer: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b6cb0',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#718096',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2b6cb0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3182ce',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  exportButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 16,
  },
});