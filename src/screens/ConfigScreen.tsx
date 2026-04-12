import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { File, Paths } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import Toast from '../components/Toast';
import { getAllProductos } from '../database/productos';
import { getAllProveedores, getProductosByProveedor } from '../database/proveedores';

const STORAGE_KEY = 'petstock_nombre_negocio';

export default function ConfigScreen() {
  const insets = useSafeAreaInsets();
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [saved, setSaved] = useState(true);
  const [exportingInv, setExportingInv] = useState(false);
  const [exportingProv, setExportingProv] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('#1d9e75');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((val) => {
        if (val !== null) setNombreNegocio(val);
      });
    }, [])
  );

  const showToast = (message: string, color = '#1d9e75') => {
    setToastMessage(message);
    setToastColor(color);
    setToastVisible(true);
  };

  const guardarNombre = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, nombreNegocio.trim());
    setSaved(true);
    showToast('Nombre guardado ✓');
  };

  const exportarInventario = async () => {
    setExportingInv(true);
    try {
      const negocio = (await AsyncStorage.getItem(STORAGE_KEY)) || 'PetStock';
      const productos = getAllProductos();

      const header = [[negocio, '', '', '', '', '', ''], ['Inventario', '', '', '', '', '', ''], []];
      const columns = ['Nombre', 'Marca', 'Categoría', 'Precio', 'Stock', 'Stock mínimo', 'Fecha vencimiento'];
      const rows = productos.map((p) => [
        p.nombre,
        p.marca,
        p.categoria,
        p.precio,
        p.stock,
        p.stock_minimo,
        p.fecha_vencimiento || '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([...header, columns, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const file = new File(Paths.cache, 'inventario.xlsx');
      file.write(wbout, { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar inventario',
      });
      showToast('Inventario exportado ✓');
    } catch {
      showToast('Error al exportar', '#e24b4a');
    } finally {
      setExportingInv(false);
    }
  };

  const exportarProveedores = async () => {
    setExportingProv(true);
    try {
      const negocio = (await AsyncStorage.getItem(STORAGE_KEY)) || 'PetStock';
      const proveedores = getAllProveedores();

      const header = [[negocio, '', '', '', ''], ['Proveedores', '', '', '', ''], []];
      const columns = ['Proveedor', 'Teléfono', 'Email', 'Producto', 'Precio de costo'];
      const rows: (string | number)[][] = [];

      for (const prov of proveedores) {
        const productos = getProductosByProveedor(prov.id);
        if (productos.length === 0) {
          rows.push([prov.nombre, prov.telefono, prov.email, '', '']);
        } else {
          for (const prod of productos) {
            rows.push([prov.nombre, prov.telefono, prov.email, prod.producto_nombre, prod.precio_costo]);
          }
        }
      }

      const ws = XLSX.utils.aoa_to_sheet([...header, columns, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const file = new File(Paths.cache, 'proveedores.xlsx');
      file.write(wbout, { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar proveedores',
      });
      showToast('Proveedores exportados ✓');
    } catch {
      showToast('Error al exportar', '#e24b4a');
    } finally {
      setExportingProv(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topbarLeft}>
          <Text style={styles.logoIcon}>🐾</Text>
          <Text style={styles.logoText}>PetStock</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Título */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Configuración</Text>
        </View>

        {/* Sección Negocio */}
        <Text style={styles.sectionLabel}>NEGOCIO</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nombre del negocio</Text>
          <TextInput
            style={styles.input}
            value={nombreNegocio}
            onChangeText={(t) => { setNombreNegocio(t); setSaved(false); }}
            placeholder="Ej: Pet Shop Luna"
            placeholderTextColor="#aaa"
          />
          <Text style={styles.helpText}>Se usa como encabezado en los archivos exportados y en la topbar.</Text>
          <Pressable
            style={[styles.btnPrimary, saved && styles.btnDisabled]}
            onPress={guardarNombre}
            disabled={saved}
          >
            <Text style={styles.btnPrimaryText}>Guardar</Text>
          </Pressable>
        </View>

        {/* Sección Exportar */}
        <Text style={styles.sectionLabel}>EXPORTAR</Text>
        <View style={styles.card}>
          <Pressable style={styles.btnExport} onPress={exportarInventario} disabled={exportingInv}>
            {exportingInv ? (
              <ActivityIndicator color="#1d9e75" size="small" />
            ) : (
              <>
                <Text style={styles.btnExportIcon}>📊</Text>
                <Text style={styles.btnExportText}>Exportar inventario a Excel</Text>
              </>
            )}
          </Pressable>
          <View style={styles.separator} />
          <Pressable style={styles.btnExport} onPress={exportarProveedores} disabled={exportingProv}>
            {exportingProv ? (
              <ActivityIndicator color="#1d9e75" size="small" />
            ) : (
              <>
                <Text style={styles.btnExportIcon}>📋</Text>
                <Text style={styles.btnExportText}>Exportar proveedores a Excel</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Sección Acerca de */}
        <Text style={styles.sectionLabel}>ACERCA DE</Text>
        <View style={styles.card}>
          <Text style={styles.aboutName}>PetStock</Text>
          <Text style={styles.aboutVersion}>Versión 1.0.0</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} color={toastColor} onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },

  // Topbar
  topbar: { backgroundColor: '#fff', paddingBottom: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 20, fontWeight: '800', color: '#1a1f2e' },

  // Scroll
  scroll: { paddingHorizontal: 20 },

  // Título
  titleSection: { paddingTop: 16, paddingBottom: 4 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#1a1f2e' },

  // Secciones
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 1, marginTop: 20, marginBottom: 8 },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e8e8e8' },

  // Negocio
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: { backgroundColor: '#f4f5f7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1f2e', borderWidth: 1, borderColor: '#e8e8e8', marginBottom: 8 },
  helpText: { fontSize: 12, color: '#999', marginBottom: 12 },
  btnPrimary: { backgroundColor: '#1d9e75', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Exportar
  btnExport: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  btnExportIcon: { fontSize: 20 },
  btnExportText: { fontSize: 15, fontWeight: '600', color: '#1a1f2e' },
  separator: { height: 1, backgroundColor: '#f0f0f0' },

  // Acerca de
  aboutName: { fontSize: 18, fontWeight: '800', color: '#1a1f2e', marginBottom: 4 },
  aboutVersion: { fontSize: 14, color: '#888' },
});
