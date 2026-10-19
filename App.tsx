import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LoginScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
