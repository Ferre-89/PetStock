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
import { deleteProveedor, getProveedorById, insertProveedor, updateProveedor } from '../database/proveedores';

export type SaveAction = 'created' | 'updated' | 'deleted';

interface Props {
  proveedorId: number | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (action: SaveAction) => void;
}

export default function ProveedorModal({ proveedorId, visible, onClose, onSaved }: Props) {
  const isEditing = proveedorId !== null;

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (proveedorId) {
      const p = getProveedorById(proveedorId);
      if (p) {
        setNombre(p.nombre);
        setTelefono(p.telefono);
        setEmail(p.email);
        setNotas(p.notas);
      }
    } else {
      setNombre('');
      setTelefono('');
      setEmail('');
      setNotas('');
    }
  }, [visible, proveedorId]);

  const guardar = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    try {
      const data = { nombre: nombre.trim(), telefono: telefono.trim(), email: email.trim(), notas: notas.trim() };
      if (proveedorId) {
        updateProveedor(proveedorId, data);
      } else {
        insertProveedor(data);
      }
      onClose();
      onSaved(proveedorId ? 'updated' : 'created');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  };

  const ejecutarEliminar = () => {
    if (!proveedorId) return;
    try {
      deleteProveedor(proveedorId);
      setConfirmDeleteVisible(false);
      onClose();
      onSaved('deleted');
    } catch (e: any) {
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
              <Text style={styles.title}>{isEditing ? 'Editar proveedor' : 'Nuevo proveedor'}</Text>

              <Text style={styles.label}>Nombre *</Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre del proveedor" />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="Ej: 099 123 456" keyboardType="phone-pad" />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.label}>Notas</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={notas} onChangeText={setNotas} placeholder="Notas adicionales..." multiline numberOfLines={3} textAlignVertical="top" />

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.confirmBtn} onPress={guardar}>
                  <Text style={styles.confirmText}>Guardar</Text>
                </Pressable>
              </View>

              {isEditing && (
                <Pressable style={styles.deleteBtn} onPress={() => setConfirmDeleteVisible(true)}>
                  <Text style={styles.deleteBtnText}>Eliminar proveedor</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={confirmDeleteVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <View style={styles.confirmIcon}>
              <Text style={styles.confirmIconText}>⚠️</Text>
            </View>
            <Text style={styles.confirmTitle}>Eliminar proveedor</Text>
            <Text style={styles.confirmMessage}>¿Estás seguro? Esta acción no se puede deshacer.</Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.confirmDeleteBtn} onPress={ejecutarEliminar}>
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, maxHeight: '85%', position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  closeBtnText: { fontSize: 18, color: '#999', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1f2e', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#f4f5f7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1f2e', borderWidth: 1, borderColor: '#e0e0e0' },
  inputMultiline: { minHeight: 80, paddingTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f4f5f7' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#555' },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#1d9e75' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  deleteBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f8d7da' },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#e24b4a' },
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
