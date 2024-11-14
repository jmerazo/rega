import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { RegisterScreenNavigationProp } from '../navigation/navigation';

type Props = {
  navigation: RegisterScreenNavigationProp;
};

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const registerUser = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userData = {
        uid,
        email,
        numeroInicio: 1,
        numeroFin: 1000,
      };
      await setDoc(doc(db, 'users', uid), userData);

      // Limpiar campos y detener el spinner
      setEmail('');
      setPassword('');
      setLoading(false);

      // Mostrar mensaje de éxito y navegar a Home
      Alert.alert('Éxito', 'Inicio de sesión con Google exitoso'); // Alerta de éxito para Google
      navigation.replace('Home');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Ha ocurrido un error inesperado.');
      }
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      const email = result.user.email || '';

      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        numeroInicio: 1,
        numeroFin: 1000,
      });

      setLoading(false);
      Alert.alert('Éxito', 'Inicio de sesión con Google exitoso');
      navigation.replace('Home');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Correo:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        placeholder="Correo electrónico"
        placeholderTextColor="#A0AEC0"
      />
      <Text style={styles.label}>Contraseña:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        placeholder="Contraseña"
        placeholderTextColor="#A0AEC0"
        secureTextEntry
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#3182CE" style={styles.spinner} />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={registerUser}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
            <Image source={require('../../assets/logos/google.png')} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Registrarse con Google</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
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
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#DB4437',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinner: {
    marginBottom: 16,
  },
});
