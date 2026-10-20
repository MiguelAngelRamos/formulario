import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme';

const App = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LoginScreen />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
