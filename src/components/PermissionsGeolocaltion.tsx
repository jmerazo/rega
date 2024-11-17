import { PermissionsAndroid, Platform } from 'react-native';

export default async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permiso de ubicación',
        message: 'La aplicación necesita acceso a tu ubicación para continuar',
        buttonNeutral: 'Pregúntame luego',
        buttonNegative: 'Cancelar',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}
