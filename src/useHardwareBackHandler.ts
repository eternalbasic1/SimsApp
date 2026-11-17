import {useEffect} from 'react';
import {BackHandler, Platform} from 'react-native';

/**
 * Android hardware back. On iOS, rely on WebView `allowsBackForwardNavigationGestures`.
 * Return true when the event is consumed; false to allow the default (usually leaving the app).
 */
export function useHardwareBackHandler(handler: () => boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handler,
    );
    return () => subscription.remove();
  }, [handler]);
}