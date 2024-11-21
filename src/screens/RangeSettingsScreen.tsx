import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RangeSettingsScreen() {
  const [generalRange, setGeneralRange] = useState<number>(200);

  useEffect(() => {
    const loadRange = async () => {
      const storedRange = await AsyncStorage.getItem('generalRange');
      if (storedRange) {
        setGeneralRange(Number(storedRange));
      }
    };
    loadRange();
  }, []);

  const saveRange = async () => {
    if (generalRange < 1) {
      Alert.alert('Error', 'El rango debe ser mayor a 0.');
      return;
    }

    await AsyncStorage.setItem('generalRange', generalRange.toString());
    Alert.alert('Éxito', 'Rango general guardado correctamente.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rango General para Registradores:</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={generalRange.toString()}
        onChangeText={(value) => setGeneralRange(Number(value))}
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveRange}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#3182CE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
