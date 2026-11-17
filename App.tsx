import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, View} from 'react-native';
import {initialWindowMetrics, SafeAreaProvider} from 'react-native-safe-area-context';
import {
  openAppPermissionSettings,
  requestLaunchPermissions,
} from './src/appPermissions';
import {AppShell, appShellStyles} from './src/appShell';
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
          'SimsGPT needs the microphone when the website records audio in chat. Enable Microphone for SimsGPT in Settings, then return to the app.',
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
      <AppShell>
        {permissionsReady ? (
          <SimsWebViewScreen />
        ) : (
          <View style={appShellStyles.bootstrap}>
            <ActivityIndicator size="large" color="#273b74" />
          </View>
        )}
      </AppShell>
    </SafeAreaProvider>
  );
}