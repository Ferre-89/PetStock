import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProveedorModal, { SaveAction } from '../components/ProveedorModal';
import Toast from '../components/Toast';
import { getCategoriaInfo } from '../constants/categorias';
import { getAllProductos } from '../database/productos';
import { getAllProveedores, getProductosByProveedor, asociarProducto, desasociarProducto } from '../database/proveedores';
import { Producto, ProductoProveedor, ProveedorConProductos } from '../types';

const TOAST_MESSAGES: Record<SaveAction, { message: string; color: string }> = {
  created: { message: 'Proveedor agregado ✓', color: '#1d9e75' },
  updated: { message: 'Proveedor actualizado ✓', color: '#1d9e75' },
  deleted: { message: 'Proveedor eliminado', color: '#e24b4a' },
};

export default function ProveedoresScreen() {
  const [proveedores, setProveedores] = useState<ProveedorConProductos[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  // Accordion
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedProductos, setExpandedProductos] = useState<ProductoProveedor[]>([]);

  // Selector inline
  const [selectorProvId, setSelectorProvId] = useState<number | null>(null);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<number | null>(null);
  const [precioCosto, setPrecioCosto] = useState('');

  // Modal ABM
  const [modalVisible, setModalVisible] = useState(false);
  const [modalProveedorId, setModalProveedorId] = useState<number | null>(null);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('#1d9e75');

  const cargar = useCallback(() => {
    setProveedores(getAllProveedores(busqueda));
  }, [busqueda]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const handleSaved = (action: SaveAction) => {
    cargar();
    if (expandedId) refreshExpanded(expandedId);
    const t = TOAST_MESSAGES[action];
    setToastMessage(t.message);
    setToastColor(t.color);
    setToastVisible(true);
  };

  const toggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setSelectorProvId(null);
    } else {
      setExpandedId(id);
      refreshExpanded(id);
      setSelectorProvId(null);
    }
  };

  const refreshExpanded = (id: number) => {
    setExpandedProductos(getProductosByProveedor(id));
  };

  const abrirSelector = (provId: number) => {
    const todos = getAllProductos();
    const prods = getProductosByProveedor(provId);
    const idsAsociados = new Set(prods.map(p => p.producto_id));
    setProductosDisponibles(todos.filter(p => !idsAsociados.has(p.id)));
    setSelectedProducto(null);
    setPrecioCosto('');
    setSelectorProvId(provId);
  };

  const confirmarAsociar = () => {
    if (!selectorProvId || !selectedProducto) return;
    asociarProducto(selectorProvId, selectedProducto, parseFloat(precioCosto) || 0);
    setSelectorProvId(null);
    refreshExpanded(selectorProvId);
    cargar();
  };

  const quitarProducto = (provId: number, prodId: number) => {
    desasociarProducto(provId, prodId);
    refreshExpanded(provId);
    cargar();
  };

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <Text style={styles.logoIcon}>📦</Text>
          <Text style={styles.logoText}>PetStock</Text>
        </View>
        <Pressable style={styles.topbarIcon} onPress={() => setSearchVisible(v => !v)}>
          <Text style={styles.topbarIconText}>🔍</Text>
        </Pressable>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Proveedores</Text>
      </View>

      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar proveedor..."
            placeholderTextColor="#aaa"
            value={busqueda}
            onChangeText={setBusqueda}
            autoFocus
          />
        </View>
      )}

      <FlatList
        data={proveedores}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚚</Text>
            <Text style={styles.emptyText}>Sin proveedores</Text>
            <Text style={styles.emptySubtext}>Tocá + para agregar el primero</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          return (
            <View style={styles.card}>
              {/* Header colapsable */}
              <Pressable style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>🏢</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNombre} numberOfLines={1}>{item.nombre}</Text>
                  {item.telefono ? <Text style={styles.cardTelefono}>{item.telefono}</Text> : null}
                  <Text style={styles.cardProductos}>
                    {item.cantidad_productos} {item.cantidad_productos === 1 ? 'producto' : 'productos'}
                  </Text>
                </View>
                <Pressable style={styles.cardEditBtn} onPress={() => { setModalProveedorId(item.id); setModalVisible(true); }}>
                  <Text style={styles.cardEditIcon}>✏️</Text>
                </Pressable>
                <Text style={styles.cardArrow}>{isExpanded ? '▲' : '▼'}</Text>
              </Pressable>

              {/* Contenido expandido */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {expandedProductos.length === 0 && selectorProvId !== item.id && (
                    <Text style={styles.expandedEmpty}>Sin productos asociados</Text>
                  )}

                  {expandedProductos.map(pp => (
                      <View key={pp.id} style={styles.prodRow}>
                        <Text style={styles.prodEmoji}>{getCategoriaInfo(pp.producto_categoria).emoji}</Text>
                        <View style={styles.prodInfo}>
                          <Text style={styles.prodNombre} numberOfLines={1}>{pp.producto_nombre}</Text>
                          <Text style={styles.prodCosto}>{'Costo: $'}{pp.precio_costo.toFixed(2)}</Text>
                        </View>
                        <Pressable style={styles.prodRemoveBtn} onPress={() => quitarProducto(item.id, pp.producto_id)}>
                          <Text style={styles.prodRemoveText}>✕</Text>
                        </Pressable>
                      </View>
                  ))}

                  {/* Selector inline */}
                  {selectorProvId === item.id ? (
                    <View style={styles.selectorContainer}>
                      <Text style={styles.selectorTitle}>Seleccionar producto</Text>
                      {productosDisponibles.length === 0 ? (
                        <Text style={styles.selectorEmpty}>No hay productos disponibles</Text>
                      ) : (
                        productosDisponibles.map(p => (
                          <Pressable
                            key={p.id}
                            style={[styles.selectorItem, selectedProducto === p.id && styles.selectorItemSelected]}
                            onPress={() => setSelectedProducto(p.id)}
                          >
                            <Text style={styles.selectorEmoji}>{getCategoriaInfo(p.categoria).emoji}</Text>
                            <Text style={[styles.selectorText, selectedProducto === p.id && { color: '#1d9e75' }]}>{p.nombre}</Text>
                          </Pressable>
                        ))
                      )}
                      {selectedProducto && (
                        <TextInput
                          style={styles.selectorInput}
                          value={precioCosto}
                          onChangeText={setPrecioCosto}
                          keyboardType="decimal-pad"
                          placeholder="Precio de costo ($)"
                        />
                      )}
                      <View style={styles.selectorActions}>
                        <Pressable style={styles.selectorCancelBtn} onPress={() => setSelectorProvId(null)}>
                          <Text style={styles.selectorCancelText}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.selectorConfirmBtn, !selectedProducto && { opacity: 0.5 }]}
                          onPress={confirmarAsociar}
                          disabled={!selectedProducto}
                        >
                          <Text style={styles.selectorConfirmText}>Asociar</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable style={styles.addProductBtn} onPress={() => abrirSelector(item.id)}>
                      <Text style={styles.addProductBtnText}>+ Agregar producto</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => { setModalProveedorId(null); setModalVisible(true); }}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <ProveedorModal
        proveedorId={modalProveedorId}
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

  topbar: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 20, fontWeight: '800', color: '#1a1f2e' },
  topbarIcon: { padding: 4 },
  topbarIconText: { fontSize: 20 },

  titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#1a1f2e' },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1a1f2e', borderWidth: 1, borderColor: '#e8e8e8' },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Card accordion
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e6f1fb', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardIconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: 16, fontWeight: '700', color: '#1a1f2e' },
  cardTelefono: { fontSize: 13, color: '#888', marginTop: 2 },
  cardProductos: { fontSize: 12, color: '#1d9e75', fontWeight: '600', marginTop: 2 },
  cardEditBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f4f5f7', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  cardEditIcon: { fontSize: 15 },
  cardArrow: { fontSize: 12, color: '#999', marginLeft: 10, width: 16, textAlign: 'center' },

  // Expanded content
  expandedContent: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  expandedEmpty: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 12 },

  // Producto row
  prodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f4f5f7' },
  prodEmoji: { fontSize: 18, marginRight: 10 },
  prodInfo: { flex: 1 },
  prodNombre: { fontSize: 14, fontWeight: '600', color: '#1a1f2e' },
  prodCosto: { fontSize: 12, color: '#1d9e75', fontWeight: '700', marginTop: 1 },
  prodRemoveBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f8d7da', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  prodRemoveText: { fontSize: 12, fontWeight: '700', color: '#e24b4a' },

  // Add product button
  addProductBtn: { marginTop: 10, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#1d9e75', borderStyle: 'dashed' },
  addProductBtnText: { fontSize: 13, fontWeight: '700', color: '#1d9e75' },

  // Inline selector
  selectorContainer: { marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12 },
  selectorTitle: { fontSize: 13, fontWeight: '700', color: '#1a1f2e', marginBottom: 8 },
  selectorEmpty: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 8 },
  selectorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4, backgroundColor: '#fff' },
  selectorItemSelected: { backgroundColor: '#e1f5ee', borderWidth: 1, borderColor: '#1d9e75' },
  selectorEmoji: { fontSize: 16, marginRight: 8 },
  selectorText: { fontSize: 13, fontWeight: '600', color: '#1a1f2e' },
  selectorInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1a1f2e', borderWidth: 1, borderColor: '#e0e0e0', marginTop: 8 },
  selectorActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  selectorCancelBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f4f5f7' },
  selectorCancelText: { fontSize: 13, fontWeight: '600', color: '#555' },
  selectorConfirmBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#1d9e75' },
  selectorConfirmText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 4 },

  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1d9e75', alignItems: 'center', justifyContent: 'center', elevation: 6, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '400', lineHeight: 30 },
});
