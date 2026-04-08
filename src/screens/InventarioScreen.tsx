import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ProductoModal, { SaveAction } from '../components/ProductoModal';
import Toast from '../components/Toast';
import { CATEGORIAS, getCategoriaInfo } from '../constants/categorias';
import { getTotalAlertas } from '../database/alertas';
import { getAllProductos } from '../database/productos';
import { Producto, InventarioStackParamList } from '../types';

type Props = NativeStackScreenProps<InventarioStackParamList, 'InventarioList'>;

function getStockStatus(producto: Producto): 'ok' | 'bajo' | 'critico' {
  if (producto.stock <= 0) return 'critico';
  if (producto.stock <= producto.stock_minimo) return 'bajo';
  return 'ok';
}

const STOCK_BADGE = {
  ok: { bg: '#d4edda', text: '#155724', label: 'EN STOCK' },
  bajo: { bg: '#fff3cd', text: '#856404', label: 'BAJO' },
  critico: { bg: '#f8d7da', text: '#721c24', label: 'CRÍTICO' },
} as const;

export default function InventarioScreen({ navigation }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);

  // Modal producto (agregar/editar)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalProductoId, setModalProductoId] = useState<number | null>(null);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('#1d9e75');

  const TOAST_MESSAGES: Record<SaveAction, { message: string; color: string }> = {
    created: { message: 'Producto agregado ✓', color: '#1d9e75' },
    updated: { message: 'Producto actualizado ✓', color: '#1d9e75' },
    deleted: { message: 'Producto eliminado', color: '#e24b4a' },
  };

  const handleSaved = (action: SaveAction) => {
    recargarTodo();
    const t = TOAST_MESSAGES[action];
    setToastMessage(t.message);
    setToastColor(t.color);
    setToastVisible(true);
  };

  const cargarProductos = useCallback(() => {
    setProductos(getAllProductos(categoriaActiva, busqueda));
  }, [categoriaActiva, busqueda]);

  const recargarTodo = useCallback(() => {
    cargarProductos();
    setAlertCount(getTotalAlertas());
  }, [cargarProductos]);

  useFocusEffect(
    useCallback(() => {
      recargarTodo();
    }, [recargarTodo])
  );

  const abrirModal = (productoId: number | null) => {
    setModalProductoId(productoId);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <Text style={styles.logoIcon}>🐾</Text>
          <Text style={styles.logoText}>PetStock</Text>
        </View>
        <View style={styles.topbarRight}>
          <Pressable style={styles.topbarIcon} onPress={() => setSearchVisible(v => !v)}>
            <Text style={styles.topbarIconText}>🔍</Text>
          </Pressable>
          <Pressable style={styles.bellContainer} onPress={() => navigation.getParent()?.navigate('Alertas')}>
            <Text style={styles.topbarIconText}>🔔</Text>
            {alertCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{alertCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Título */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Inventario de Productos</Text>
      </View>

      {/* Búsqueda */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por SKU, nombre o marca..."
            placeholderTextColor="#aaa"
            value={busqueda}
            onChangeText={setBusqueda}
            autoFocus
          />
        </View>
      )}

      {/* Categorías */}
      <View style={styles.categoriasContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriasScroll}>
          {CATEGORIAS.map(cat => {
            const activo = categoriaActiva === cat.key;
            return (
              <Pressable
                key={cat.key}
                style={[
                  styles.chip,
                  { backgroundColor: activo ? cat.color : '#fff', borderColor: cat.color },
                ]}
                onPress={() => setCategoriaActiva(cat.key)}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text style={[styles.chipText, activo && styles.chipTextActivo]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista */}
      <FlatList
        data={productos}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>No hay productos</Text>
            <Text style={styles.emptySubtext}>Tocá + para agregar el primero</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStockStatus(item);
          const catInfo = getCategoriaInfo(item.categoria);
          const badge = STOCK_BADGE[status];
          return (
            <Pressable
              style={styles.card}
              onPress={() => abrirModal(item.id)}
            >
              <View style={[styles.cardImage, { backgroundColor: catInfo.color }]}>
                <Text style={styles.cardEmoji}>{catInfo.emoji}</Text>
                <View style={[styles.cardBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.cardBadgeText, { color: badge.text }]}>
                    {item.stock} - {badge.label}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardMarca} numberOfLines={1}>{item.marca}</Text>
                <Text style={styles.cardNombre} numberOfLines={2}>{item.nombre}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrecio}>${item.precio.toFixed(2)}</Text>
                  <Pressable
                    style={styles.cardEditBtn}
                    onPress={() => abrirModal(item.id)}
                  >
                    <Text style={styles.cardEditIcon}>✏️</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => abrirModal(null)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <ProductoModal
        productoId={modalProductoId}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={handleSaved}
      />

      <Toast
        message={toastMessage}
        color={toastColor}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },

  // Topbar
  topbar: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 20, fontWeight: '800', color: '#1a1f2e' },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  topbarIcon: { padding: 4 },
  topbarIconText: { fontSize: 20 },
  bellContainer: { padding: 4, position: 'relative' },
  bellBadge: { position: 'absolute', top: -2, right: -4, backgroundColor: '#e24b4a', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Título
  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#1a1f2e' },

  // Búsqueda
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1a1f2e', borderWidth: 1, borderColor: '#e8e8e8' },

  // Categorías
  categoriasContainer: { paddingBottom: 10 },
  categoriasScroll: { paddingHorizontal: 16, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, gap: 6, borderWidth: 1.5 },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActivo: { color: '#1a1f2e' },

  // Lista
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  card: { flex: 1, maxWidth: '48.5%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardImage: { height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardEmoji: { fontSize: 44 },
  cardBadge: { position: 'absolute', top: 8, right: 8, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  cardBadgeText: { fontSize: 9, fontWeight: '800' },
  cardBody: { padding: 12 },
  cardMarca: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardNombre: { fontSize: 14, fontWeight: '700', color: '#1a1f2e', marginTop: 3, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  cardPrecio: { fontSize: 16, fontWeight: '800', color: '#1d9e75' },
  cardEditBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f4f5f7', alignItems: 'center', justifyContent: 'center' },
  cardEditIcon: { fontSize: 14 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 4 },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1d9e75', alignItems: 'center', justifyContent: 'center', elevation: 6, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '400', lineHeight: 30 },
});
