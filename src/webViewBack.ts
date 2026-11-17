/** Injected on Android when the native stack has no entry but the SPA may still have history. */
export const WEB_HISTORY_BACK_SCRIPT = `(function () {
  var before = location.href;
  try {
    window.history.back();
  } catch (e) {}
  setTimeout(function () {
    var moved = location.href !== before;
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'simsHardwareBack', moved: moved, href: location.href })
      );
    }
  }, 150);
})();
true;`;

export type HardwareBackScreen = 'error' | 'initialLoading' | 'webview';

export type HardwareBackAction =
  | { type: 'dismissError' }
  | { type: 'exitApp' }
  | { type: 'webViewGoBack' }
  | { type: 'webHistoryBack' };

export function resolveHardwareBackAction(input: {
  screen: HardwareBackScreen;
  canGoBack: boolean;
  hasInAppNavigation: boolean;
}): HardwareBackAction {
  if (input.screen === 'error') {
    return { type: 'dismissError' };
  }
  if (input.screen === 'initialLoading') {
    return { type: 'exitApp' };
  }
  if (input.canGoBack) {
    return { type: 'webViewGoBack' };
  }
  if (input.hasInAppNavigation) {
    return { type: 'webHistoryBack' };
  }
  return { type: 'exitApp' };
}

export function parseHardwareBackMessage(data: string): { moved: boolean } | null {
  try {
    const payload = JSON.parse(data) as {
      type?: string;
      moved?: boolean;
    };
    if (payload.type !== 'simsHardwareBack') {
      return null;
    }
    return { moved: Boolean(payload.moved) };
  } catch {
    return null;
  }
}