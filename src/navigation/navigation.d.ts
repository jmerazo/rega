import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Register: undefined;
  Login: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Register'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

export {
  RootStackParamList,
  HomeScreenNavigationProp,
  RegisterScreenNavigationProp,
  LoginScreenNavigationProp,
  HomeScreenRouteProp,
  RegisterScreenRouteProp,
  LoginScreenRouteProp,
};
