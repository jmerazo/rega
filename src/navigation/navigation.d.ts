import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Register: undefined;
  PasswordReset: undefined;
  Login: undefined;
  Panel: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type PasswordResetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PasswordReset'>;
type AdminUsersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Panel'>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Register'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;
type PasswordResetScreenRouteProp = RouteProp<RootStackParamList, 'PasswordReset'>;
type AdminUsersScreenRouteProp = RouteProp<RootStackParamList, 'Panel'>;

export {
  RootStackParamList,
  HomeScreenNavigationProp,
  RegisterScreenNavigationProp,
  LoginScreenNavigationProp,
  HomeScreenRouteProp,
  RegisterScreenRouteProp,
  LoginScreenRouteProp,
  AdminUsersScreenRouteProp,
  PasswordResetScreenNavigationProp,
  PasswordResetScreenRouteProp
};
