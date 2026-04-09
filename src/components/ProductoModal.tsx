import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CATEGORIAS } from '../constants/categorias';
import { deleteProducto, getProductoById, insertProducto, updateProducto } from '../database/productos';
import { asociarProducto, desasociarProducto, getAllProveedores, getProveedoresByProducto, type ProveedorDeProducto } from '../database/proveedores';
import { Categoria, ProveedorConProductos } from '../types';

const CATEGORIAS_SELECCIONABLES = CATEGORIAS.filter(c => c.key !== 'todos');

function aplicarMascaraFecha(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function validarFecha(texto: string): string | null {
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, aaaa] = match;
  const dia = parseInt(dd);
  const mes = parseInt(mm);
  const anio = parseInt(aaaa);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || anio < 2024) return null;
  const date = new Date(anio, mes - 1, dia);
  if (date.getFullYear() !== anio || date.getMonth() !== mes - 1 || date.getDate() !== dia) return null;
  return `${aaaa}-${mm}-${dd}`;
}

function isoToDisplay(iso: string): string {
  const [aaaa, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${aaaa}`;
}

export type SaveAction = 'created' | 'updated' | 'deleted';

interface Props {
  productoId: number | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (action: SaveAction) => void;
}

export default function ProductoModal({ productoId, visible, onClose, onSaved }: Props) {
  const isEditing = productoId !== null;

  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('comida');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [fechaTexto, setFechaTexto] = useState('');
  const [fechaIso, setFechaIso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Proveedores (solo modo edición)
  const [proveedores, setProveedores] = useState<ProveedorDeProducto[]>([]);
  const [provSelectorVisible, setProvSelectorVisible] = useState(false);
  const [provDisponibles, setProvDisponibles] = useState<ProveedorConProductos[]>([]);
  const [provSelected, setProvSelected] = useState<number | null>(null);
  const [provPrecio, setProvPrecio] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (productoId) {
      cargarDatos(productoId);
    } else {
      resetForm();
    }
  }, [visible, productoId]);

  const resetForm = () => {
    setNombre('');
    setMarca('');
    setCategoria('comida');
    setPrecio('');
    setStock('');
    setStockMinimo('');
    setFechaTexto('');
    setFechaIso(null);
    setProveedores([]);
  };

  const cargarDatos = (id: number) => {
    const p = getProductoById(id);
    if (!p) return;
    setNombre(p.nombre);
    setMarca(p.marca);
    setCategoria(p.categoria as Categoria);
    setPrecio(p.precio.toString());
    setStock(p.stock.toString());
    setStockMinimo(p.stock_minimo.toString());
    if (p.fecha_vencimiento) {
      setFechaTexto(isoToDisplay(p.fecha_vencimiento));
      setFechaIso(p.fecha_vencimiento);
    } else {
      setFechaTexto('');
      setFechaIso(null);
    }
    setProveedores(getProveedoresByProducto(id));
  };

  const manejarCambioFecha = (texto: string) => {
    const masked = aplicarMascaraFecha(texto);
    setFechaTexto(masked);
    setFechaIso(masked.length === 10 ? validarFecha(masked) : null);
  };

  const guardar = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    const data = {
      nombre: nombre.trim(),
      marca: marca.trim(),
      categoria,
      precio: parseFloat(precio) || 0,
      stock: parseInt(stock) || 0,
      stock_minimo: parseInt(stockMinimo) || 0,
      fecha_vencimiento: categoria === 'comida' ? fechaIso : null,
    };

    try {
      if (productoId) {
        updateProducto(productoId, data);
      } else {
        insertProducto(data);
      }
      onClose();
      onSaved(productoId ? 'updated' : 'created');
    } catch (e: any) {
      console.error('Error guardando producto:', e);
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  };

  // --- Proveedores ---
  const abrirProvSelector = () => {
    const todos = getAllProveedores();
    const idsAsociados = new Set(proveedores.map(p => p.proveedor_id));
    setProvDisponibles(todos.filter(p => !idsAsociados.has(p.id)));
    setProvSelected(null);
    setProvPrecio('');
    setProvSelectorVisible(true);
  };

  const confirmarAsociarProv = () => {
    if (!productoId || !provSelected) return;
    asociarProducto(provSelected, productoId, parseFloat(provPrecio) || 0);
    setProvSelectorVisible(false);
    setProveedores(getProveedoresByProducto(productoId));
  };

  const quitarProveedor = (provId: number) => {
    if (!productoId) return;
    desasociarProducto(provId, productoId);
    setProveedores(getProveedoresByProducto(productoId));
  };

  const ejecutarEliminar = () => {
    if (!productoId) return;
    try {
      deleteProducto(productoId);
      setConfirmDeleteVisible(false);
      onClose();
      onSaved('deleted');
    } catch (e: any) {
      console.error('Error eliminando producto:', e);
      Alert.alert('Error', e?.message ?? 'No se pudo eliminar');
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.content} onPress={() => {}}>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</Text>

              <Text style={styles.label}>Nombre *</Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Royal Canin Mini Adult" />

              <Text style={styles.label}>Marca</Text>
              <TextInput style={styles.input} value={marca} onChangeText={setMarca} placeholder="Ej: Royal Canin" />

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoriasRow}>
                {CATEGORIAS_SELECCIONABLES.map(cat => (
                  <Pressable
                    key={cat.key}
                    style={[
                      styles.categoriaChip,
                      { backgroundColor: categoria === cat.key ? cat.color : '#fff', borderColor: cat.color },
                    ]}
                    onPress={() => setCategoria(cat.key as Categoria)}
                  >
                    <Text style={styles.categoriaChipEmoji}>{cat.emoji}</Text>
                    <Text style={[
                      styles.categoriaChipLabel,
                      categoria === cat.key && styles.categoriaChipLabelActiva,
                    ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Precio ($)</Text>
                  <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" placeholder="0.00" />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>{isEditing ? 'Stock' : 'Stock inicial'}</Text>
                  <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Stock mínimo</Text>
                  <TextInput style={styles.input} value={stockMinimo} onChangeText={setStockMinimo} keyboardType="number-pad" placeholder="0" />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Vencimiento</Text>
                  {categoria === 'comida' ? (
                    <TextInput
                      style={[
                        styles.input,
                        fechaIso && styles.inputFechaValida,
                        fechaTexto.length === 10 && !fechaIso && styles.inputFechaError,
                      ]}
                      value={fechaTexto}
                      onChangeText={manejarCambioFecha}
                      placeholder="DD/MM/AAAA"
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  ) : (
                    <View style={[styles.input, styles.inputDisabled]}>
                      <Text style={styles.inputDisabledText}>N/A</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmBtn, guardando && { opacity: 0.6 }]}
                  onPress={guardar}
                  disabled={guardando}
                >
                  <Text style={styles.confirmText}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
              </View>

              {/* Sección proveedores (solo edición) */}
              {isEditing && (
                <>
                  <Text style={[styles.label, { marginTop: 20, fontSize: 15, fontWeight: '700', color: '#1a1f2e' }]}>Proveedores</Text>
                  {proveedores.length > 0 ? (
                    <View style={styles.provList}>
                      {proveedores.map(pv => (
                        <View key={pv.proveedor_id} style={styles.provChip}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.provChipNombre}>{pv.proveedor_nombre}</Text>
                            <Text style={styles.provChipPrecio}>${pv.precio_costo.toFixed(2)}</Text>
                          </View>
                          <Pressable onPress={() => quitarProveedor(pv.proveedor_id)} style={styles.provChipRemove}>
                            <Text style={styles.provChipRemoveText}>✕</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>Sin proveedores asociados</Text>
                  )}
                  <Pressable style={styles.provAddBtn} onPress={abrirProvSelector}>
                    <Text style={styles.provAddBtnText}>+ Agregar proveedor</Text>
                  </Pressable>
                </>
              )}

              {isEditing && (
                <Pressable style={styles.deleteBtn} onPress={() => setConfirmDeleteVisible(true)}>
                  <Text style={styles.deleteBtnText}>Eliminar producto</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal selector proveedor */}
      <Modal visible={provSelectorVisible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setProvSelectorVisible(false)}>
          <Pressable style={styles.provSelectorContent} onPress={() => {}}>
            <Text style={styles.title}>Agregar proveedor</Text>
            {provDisponibles.length === 0 ? (
              <Text style={{ fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 20 }}>No hay proveedores disponibles</Text>
            ) : (
              <ScrollView style={{ maxHeight: 200, marginTop: 8 }}>
                {provDisponibles.map(p => (
                  <Pressable
                    key={p.id}
                    style={[styles.provSelectorItem, provSelected === p.id && styles.provSelectorItemSelected]}
                    onPress={() => setProvSelected(p.id)}
                  >
                    <Text style={[styles.provSelectorText, provSelected === p.id && { color: '#1d9e75' }]}>{p.nombre}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {provSelected && (
              <>
                <Text style={styles.label}>Precio de costo ($)</Text>
                <TextInput style={styles.input} value={provPrecio} onChangeText={setProvPrecio} keyboardType="decimal-pad" placeholder="0.00" />
              </>
            )}
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={() => setProvSelectorVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.confirmBtn, !provSelected && { opacity: 0.5 }]} onPress={confirmarAsociarProv} disabled={!provSelected}>
                <Text style={styles.confirmText}>Asociar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal confirmación eliminar */}
      <Modal visible={confirmDeleteVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <View style={styles.confirmIcon}>
              <Text style={styles.confirmIconText}>⚠️</Text>
            </View>
            <Text style={styles.confirmTitle}>Eliminar producto</Text>
            <Text style={styles.confirmMessage}>¿Estás seguro? Esta acción no se puede deshacer.</Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmDeleteBtn, eliminando && { opacity: 0.6 }]}
                onPress={ejecutarEliminar}
                disabled={eliminando}
              >
                <Text style={styles.confirmDeleteText}>{eliminando ? 'Eliminando...' : 'Eliminar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Modal principal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, maxHeight: '85%', position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  closeBtnText: { fontSize: 18, color: '#999', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1f2e', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#f4f5f7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1f2e', borderWidth: 1, borderColor: '#e0e0e0' },
  inputFechaValida: { borderColor: '#1d9e75' },
  inputFechaError: { borderColor: '#e24b4a' },
  inputDisabled: { justifyContent: 'center' },
  inputDisabledText: { fontSize: 15, color: '#bbb' },
  categoriasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoriaChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1.5 },
  categoriaChipEmoji: { fontSize: 14, marginRight: 4 },
  categoriaChipLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  categoriaChipLabelActiva: { color: '#1a1f2e' },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f4f5f7' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#555' },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#1d9e75' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Proveedores
  provList: { gap: 6, marginBottom: 8 },
  provChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f7', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  provChipNombre: { fontSize: 13, fontWeight: '600', color: '#1a1f2e' },
  provChipPrecio: { fontSize: 12, color: '#1d9e75', fontWeight: '700' },
  provChipRemove: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f8d7da', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  provChipRemoveText: { fontSize: 12, fontWeight: '700', color: '#e24b4a' },
  provAddBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#1d9e75', borderStyle: 'dashed' },
  provAddBtnText: { fontSize: 13, fontWeight: '700', color: '#1d9e75' },
  provSelectorContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, maxHeight: '80%' },
  provSelectorItem: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4, backgroundColor: '#f4f5f7' },
  provSelectorItemSelected: { backgroundColor: '#e1f5ee', borderWidth: 1.5, borderColor: '#1d9e75' },
  provSelectorText: { fontSize: 14, fontWeight: '600', color: '#1a1f2e' },

  deleteBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f8d7da' },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#e24b4a' },

  // Modal confirmación
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  confirmContent: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center' },
  confirmIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f8d7da', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmIconText: { fontSize: 28 },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#1a1f2e', marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 10, width: '100%' },
  confirmCancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f4f5f7' },
  confirmCancelText: { fontSize: 15, fontWeight: '600', color: '#555' },
  confirmDeleteBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#e24b4a' },
  confirmDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
