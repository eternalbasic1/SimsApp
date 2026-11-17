import React, {type PropsWithChildren} from 'react';
import {Platform, StatusBar, StyleSheet, View} from 'react-native';

/**
 * Full-bleed native shell for the hosted WebView. The website mirrors mobile
 * browser layout; avoid SafeAreaView padding here or both Android (edge-to-edge)
 * and iOS draw white bands around the page.
 */
export function AppShell({children}: PropsWithChildren) {
  return (
    <View style={appShellStyles.root}>
      <AppStatusBar />
      {children}
    </View>
  );
}

export function AppStatusBar() {
  return (
    <StatusBar
      barStyle="dark-content"
      translucent={Platform.OS === 'android'}
      backgroundColor={Platform.OS === 'android' ? 'transparent' : undefined}
    />
  );
}

export const appShellStyles = StyleSheet.create({
  root: {flex: 1},
  bootstrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});