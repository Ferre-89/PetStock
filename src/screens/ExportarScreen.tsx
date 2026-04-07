import { StyleSheet, Text, View } from 'react-native';

export default function ExportarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Exportar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
});
