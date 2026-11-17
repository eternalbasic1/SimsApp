import {
  parseHardwareBackMessage,
  resolveHardwareBackAction,
} from '../src/webViewBack';

describe('resolveHardwareBackAction', () => {
  it('dismisses the native error overlay before web history', () => {
    expect(
      resolveHardwareBackAction({
        screen: 'error',
        canGoBack: true,
        hasInAppNavigation: true,
      }),
    ).toEqual({ type: 'dismissError' });
  });

  it('exits during the first-load overlay', () => {
    expect(
      resolveHardwareBackAction({
        screen: 'initialLoading',
        canGoBack: false,
        hasInAppNavigation: false,
      }),
    ).toEqual({ type: 'exitApp' });
  });

  it('prefers native webview history when available', () => {
    expect(
      resolveHardwareBackAction({
        screen: 'webview',
        canGoBack: true,
        hasInAppNavigation: false,
      }),
    ).toEqual({ type: 'webViewGoBack' });
  });

  it('falls back to in-page history for SPA navigations', () => {
    expect(
      resolveHardwareBackAction({
        screen: 'webview',
        canGoBack: false,
        hasInAppNavigation: true,
      }),
    ).toEqual({ type: 'webHistoryBack' });
  });

  it('exits when there is nowhere to go back', () => {
    expect(
      resolveHardwareBackAction({
        screen: 'webview',
        canGoBack: false,
        hasInAppNavigation: false,
      }),
    ).toEqual({ type: 'exitApp' });
  });
});

describe('parseHardwareBackMessage', () => {
  it('reads SPA back results from the WebView', () => {
    expect(
      parseHardwareBackMessage(
        JSON.stringify({ type: 'simsHardwareBack', moved: true }),
      ),
    ).toEqual({ moved: true });
  });

  it('ignores unrelated messages', () => {
    expect(parseHardwareBackMessage('not-json')).toBeNull();
    expect(
      parseHardwareBackMessage(JSON.stringify({ type: 'other' })),
    ).toBeNull();
  });
});