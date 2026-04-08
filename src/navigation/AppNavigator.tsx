import { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getTotalAlertas } from '../database/alertas';
import InventarioStack from './InventarioStack';
import AlertasScreen from '../screens/AlertasScreen';
import ExportarScreen from '../screens/ExportarScreen';
import ConfigScreen from '../screens/ConfigScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Inventario: 'cube-outline',
  Alertas: 'alert-circle-outline',
  Exportar: 'download-outline',
  Config: 'settings-outline',
};

export default function AppNavigator() {
  const [alertCount, setAlertCount] = useState(0);

  const refreshAlertCount = useCallback(() => {
    setAlertCount(getTotalAlertas());
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#1d9e75',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#1a1f2e',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
      screenListeners={{
        state: refreshAlertCount,
      }}
    >
      <Tab.Screen name="Inventario" component={InventarioStack} />
      <Tab.Screen
        name="Alertas"
        component={AlertasScreen}
        options={{
          tabBarBadge: alertCount > 0 ? alertCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#e24b4a',
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tab.Screen name="Exportar" component={ExportarScreen} />
      <Tab.Screen name="Config" component={ConfigScreen} />
    </Tab.Navigator>
  );
}
