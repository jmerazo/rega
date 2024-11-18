import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { auth } from '../../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { PasswordResetScreenNavigationProp } from '../navigation/navigation';

type Props = {
  navigation: PasswordResetScreenNavigationProp;
};

export default function PasswordResetScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Correo enviado',
        'Se ha enviado un enlace para restablecer tu contraseña. Revisa tu correo electrónico.'
      );
      navigation.goBack(); // Vuelve a la pantalla de inicio de sesión
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.resetContainer}>
          <Text style={styles.title}>Recuperar Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#A0AEC0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
            <Text style={styles.buttonText}>Enviar correo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resetContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  button: {
    backgroundColor: '#3182CE',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#4299E1',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});