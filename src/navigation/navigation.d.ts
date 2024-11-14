import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export { RootStackParamList, LoginScreenNavigationProp, RegisterScreenNavigationProp };
