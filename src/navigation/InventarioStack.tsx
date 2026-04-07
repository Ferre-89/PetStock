import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventarioStackParamList } from '../types';
import InventarioScreen from '../screens/InventarioScreen';

const Stack = createNativeStackNavigator<InventarioStackParamList>();

export default function InventarioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InventarioList" component={InventarioScreen} />
    </Stack.Navigator>
  );
}
