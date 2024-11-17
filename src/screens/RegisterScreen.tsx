import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
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
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [loading, setLoading] = useState(false);

  const registerUser = async () => {
    if (!name || !lastname) {
      Alert.alert('Error', 'Por favor ingrese nombre y apellido.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userData = {
        uid,
        email,
        name,
        lastname,
      };

      await setDoc(doc(db, 'users', uid), userData);

      // Limpiar campos y detener el spinner
      setEmail('');
      setPassword('');
      setName('');
      setLastname('');
      setLoading(false);

      Alert.alert('Éxito', 'Usuario registrado exitosamente.');
      navigation.replace('Home');
    } catch (error) {
      setLoading(false);
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
        email
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
      <Text style={styles.appTitle}>Rega</Text>
      <Text style={styles.subtitle}>Registrarse</Text>

      <Text style={styles.label}>Nombres:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setName}
        value={name}
        placeholder="Nombre"
        placeholderTextColor="#A0AEC0"
      />
      <Text style={styles.label}>Apellidos:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setLastname}
        value={lastname}
        placeholder="Apellido"
        placeholderTextColor="#A0AEC0"
      />
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
          <Text style={styles.text}>Registrarse con:</Text>
          <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
            <Image source={require('../../assets/logos/google.png')} style={styles.googleIcon} />
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
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3182CE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4A5568',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  input: {
    width: '100%',
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
    width: '100%',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 8,
  },
  spinner: {
    marginBottom: 16,
  },
});