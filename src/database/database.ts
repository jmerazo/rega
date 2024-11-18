import AsyncStorage from '@react-native-async-storage/async-storage';

class DatabaseConnection {
  private static instance: DatabaseConnection;

  private constructor() {}

  // Método estático para obtener la instancia
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  // Inicializa la base de datos
  public async initializeDatabase(): Promise<void> {
    console.log('Initializing AsyncStorage database...');
    // Agrega lógica de inicialización si es necesaria
  }

  // Guarda datos en AsyncStorage
  public async saveData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Data saved successfully for key: ${key}`);
    } catch (error) {
      console.error(`Error saving data for key: ${key}`, error);
    }
  }

  // Recupera datos de AsyncStorage
  public async getData(key: string): Promise<any | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error retrieving data for key: ${key}`, error);
      return null;
    }
  }
}

export const Database = DatabaseConnection;