import { useCallback, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getCategoriaInfo } from '../constants/categorias';
import { getAlertasStockBajo, getAlertasVencimiento } from '../database/alertas';
import { AlertaStock, AlertaVencimiento } from '../types';

type AlertaItem =
  | { type: 'stock'; data: AlertaStock }
  | { type: 'vencimiento'; data: AlertaVencimiento };

export default function AlertasScreen() {
  const navigation = useNavigation<any>();
  const [stockBajo, setStockBajo] = useState<AlertaStock[]>([]);
  const [vencimientos, setVencimientos] = useState<AlertaVencimiento[]>([]);

  useFocusEffect(
    useCallback(() => {
      setStockBajo(getAlertasStockBajo());
      setVencimientos(getAlertasVencimiento());
    }, [])
  );

  const irAInventario = () => {
    navigation.navigate('Inventario');
  };

  const sections: { title: string; icon: string; data: AlertaItem[] }[] = [];

  if (stockBajo.length > 0) {
    sections.push({
      title: `Stock bajo (${stockBajo.length})`,
      icon: '📉',
      data: stockBajo.map(d => ({ type: 'stock' as const, data: d })),
    });
  }
  if (vencimientos.length > 0) {
    sections.push({
      title: `Próximos a vencer (${vencimientos.length})`,
      icon: '⏰',
      data: vencimientos.map(d => ({ type: 'vencimiento' as const, data: d })),
    });
  }

  const isEmpty = stockBajo.length === 0 && vencimientos.length === 0;

  return (
    <View style={styles.container}>
      {/* Topbar blanca */}
      <View style={styles.topbar}>
        <Text style={styles.logoIcon}>🔔</Text>
        <Text style={styles.logoText}>PetStock</Text>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Alertas</Text>
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyText}>Todo en orden</Text>
          <Text style={styles.emptySubtext}>No hay alertas de stock ni vencimientos próximos</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.type}-${item.data.producto_id}-${index}`}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const catInfo = getCategoriaInfo(item.data.categoria);

            if (item.type === 'stock') {
              const d = item.data;
              const esCritico = d.stock <= 0;
              return (
                <Pressable
                  style={[styles.card, { borderLeftColor: esCritico ? '#e24b4a' : '#f0a500' }]}
                  onPress={() => irAInventario()}
                >
                  <View style={[styles.cardEmoji, { backgroundColor: catInfo.color }]}>
                    <Text style={styles.cardEmojiText}>{catInfo.emoji}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardNombre} numberOfLines={1}>{d.producto_nombre}</Text>
                    <Text style={styles.cardVariante}>{d.producto_marca}</Text>
                    <View style={styles.stockInfoRow}>
                      <Text style={[styles.stockActual, esCritico && { color: '#e24b4a' }]}>
                        Stock: {d.stock}
                      </Text>
                      <Text style={styles.stockMinLabel}> / mín: {d.stock_minimo}</Text>
                    </View>
                  </View>
                  <View style={[styles.badge, { backgroundColor: esCritico ? '#f8d7da' : '#fff3cd' }]}>
                    <Text style={[styles.badgeText, { color: esCritico ? '#721c24' : '#856404' }]}>
                      {esCritico ? 'Sin stock' : 'Bajo'}
                    </Text>
                  </View>
                </Pressable>
              );
            }

            const d = item.data;
            const esVencido = d.dias_restantes <= 0;
            return (
              <Pressable
                style={[styles.card, { borderLeftColor: esVencido ? '#e24b4a' : '#f0a500' }]}
                onPress={() => irAInventario()}
              >
                <View style={[styles.cardEmoji, { backgroundColor: catInfo.color }]}>
                  <Text style={styles.cardEmojiText}>{catInfo.emoji}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNombre} numberOfLines={1}>{d.producto_nombre}</Text>
                  <Text style={styles.cardVariante}>{d.producto_marca} ({d.stock} uds)</Text>
                  <Text style={[styles.vencText, esVencido && { color: '#e24b4a' }]}>
                    {esVencido
                      ? `Vencido (${d.fecha_vencimiento})`
                      : `Vence: ${d.fecha_vencimiento} (${d.dias_restantes} días)`
                    }
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: esVencido ? '#f8d7da' : '#fff3cd' }]}>
                  <Text style={[styles.badgeText, { color: esVencido ? '#721c24' : '#856404' }]}>
                    {esVencido ? 'Vencido' : `${d.dias_restantes}d`}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  topbar: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoIcon: {
    fontSize: 22,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1f2e',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1f2e',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d9e75',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardEmoji: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardEmojiText: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  cardVariante: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  stockInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  stockActual: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f0a500',
  },
  stockMinLabel: {
    fontSize: 12,
    color: '#999',
  },
  vencText: {
    fontSize: 12,
    color: '#f0a500',
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
