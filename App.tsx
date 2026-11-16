import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, StatusBar, StyleSheet, View} from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  openAppPermissionSettings,
  requestLaunchPermissions,
} from './src/appPermissions';
import SimsWebViewScreen from './src/SimsWebViewScreen';

export default function App() {
  const [permissionsReady, setPermissionsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      const issues = await requestLaunchPermissions();
      if (
        !cancelled &&
        issues.includes('microphone')
      ) {
        Alert.alert(
          'Microphone access blocked',
          'SIMS needs the microphone when the website records audio in chat. Enable Microphone for SIMS Gpt in Settings, then return to the app.',
          [
            {text: 'Not now', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => {
                void openAppPermissionSettings();
              },
            },
          ],
        );
      }
      if (!cancelled) {
        setPermissionsReady(true);
      }
    };

    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {permissionsReady ? (
          <SimsWebViewScreen />
        ) : (
          <View style={styles.bootstrap}>
            <ActivityIndicator size="large" color="#273b74" />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},
  bootstrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});