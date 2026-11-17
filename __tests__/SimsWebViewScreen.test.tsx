import React from 'react';
import { Alert, BackHandler, Linking, Platform, Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import SimsWebViewScreen from '../src/SimsWebViewScreen';

const mockReload = jest.fn();
const mockGoBack = jest.fn();
const mockInjectJavaScript = jest.fn();
let hardwareBackHandler: (() => boolean) | undefined;

const hardwareBack = (): boolean => {
  if (!hardwareBackHandler) {
    throw new Error('hardware back was not registered');
  }
  return hardwareBackHandler();
};
jest.mock(
  'react-native-webview',
  () => {
    const ReactModule = require('react');
    const NativeView = require('react-native').View;
    return {
      WebView: ReactModule.forwardRef((props: object, ref: unknown) => {
        ReactModule.useImperativeHandle(ref, () => ({
          reload: mockReload,
          goBack: mockGoBack,
          injectJavaScript: mockInjectJavaScript,
        }));
        return ReactModule.createElement(NativeView, {
          ...props,
          testID: 'native-webview',
        });
      }),
    };
  },
  { virtual: true },
);

let tree: ReactTestRenderer.ReactTestRenderer;
const webview = () => tree.root.findByProps({ testID: 'native-webview' });
const texts = () =>
  tree.root.findAllByType(Text).map(node => node.props.children);

beforeEach(async () => {
  mockReload.mockClear();
  mockGoBack.mockClear();
  mockInjectJavaScript.mockClear();
  hardwareBackHandler = undefined;
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, handler) => {
    hardwareBackHandler = handler;
    return { remove: jest.fn() };
  });
  await act(async () => {
    tree = ReactTestRenderer.create(<SimsWebViewScreen />);
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
  jest.restoreAllMocks();
});

it('shows loading until the initial page finishes', async () => {
  expect(texts()).toContain('Loading SimsGPT…');
  await act(async () =>
    webview().props.onLoadEnd({
      nativeEvent: { url: 'https://simsgpt.6tst.com/chat' },
    }),
  );
  expect(texts()).not.toContain('Loading SimsGPT…');
});

it('keeps a load failure visible through load-end and retries the current document', async () => {
  await act(async () =>
    webview().props.onError({ nativeEvent: { description: 'offline' } }),
  );
  await act(async () => webview().props.onLoadEnd({ nativeEvent: {} }));
  expect(texts()).toContain('Unable to load SimsGPT');
  await act(async () =>
    tree.root.findByProps({ accessibilityRole: 'button' }).props.onPress(),
  );
  expect(texts()).not.toContain('Unable to load SimsGPT');
  expect(texts()).toContain('Loading SimsGPT…');
  expect(mockReload).toHaveBeenCalledTimes(1);
});

it('does not replace chat when an image or iframe returns an HTTP error', async () => {
  await act(async () => webview().props.onLoadEnd({ nativeEvent: {} }));
  await act(async () =>
    webview().props.onHttpError({
      nativeEvent: {
        url: 'https://simsgpt.6tst.com/logo.png',
        statusCode: 404,
      },
    }),
  );
  expect(texts()).not.toContain('Unable to load SimsGPT');
});

it('shows Retry for a failed main document after an authentication redirect', async () => {
  await act(async () =>
    webview().props.onLoadStart({
      nativeEvent: { url: 'https://login.microsoftonline.com/company' },
    }),
  );
  await act(async () =>
    webview().props.onHttpError({
      nativeEvent: {
        url: 'https://login.microsoftonline.com/company',
        statusCode: 503,
      },
    }),
  );
  expect(texts()).toContain('Unable to load SimsGPT');
});

it('allows company HTTPS redirects and blocks HTTP or executable URLs', async () => {
  await act(async () => {
    const decide = webview().props.onShouldStartLoadWithRequest;
    expect(
      decide({
        url: 'https://login.microsoftonline.com/organizations',
        navigationType: 'other',
        isTopFrame: true,
      }),
    ).toBe(true);
    expect(decide({ url: 'http://example.com', navigationType: 'click' })).toBe(
      false,
    );
    expect(
      decide({
        url: ['javascript', 'alert(1)'].join(':'),
        navigationType: 'click',
      }),
    ).toBe(false);
  });
});

it('loads an HTTPS new-window link in the current WebView session', async () => {
  await act(async () =>
    webview().props.onOpenWindow({
      nativeEvent: { targetUrl: 'https://example.com/report' },
    }),
  );
  expect(webview().props.source.uri).toBe('https://example.com/report');
  expect(texts()).toContain('Loading SimsGPT…');
});

it('ignores unsupported new-window schemes rather than launching another app', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await act(async () =>
    webview().props.onOpenWindow({
      nativeEvent: { targetUrl: 'msauth://callback' },
    }),
  );
  expect(webview().props.source.uri).toBe('https://simsgpt.6tst.com/chat');
  expect(openURL).not.toHaveBeenCalled();
});

it('opens mail links only after a user click and handles failure without losing chat', async () => {
  await act(async () => webview().props.onLoad());
  const openURL = jest
    .spyOn(Linking, 'openURL')
    .mockRejectedValue(new Error('No app'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await act(async () => {
    expect(
      webview().props.onShouldStartLoadWithRequest({
        url: 'mailto:help@example.com',
        navigationType: 'other',
      }),
    ).toBe(false);
  });
  expect(openURL).not.toHaveBeenCalled();
  await act(async () => {
    expect(
      webview().props.onShouldStartLoadWithRequest({
        url: 'mailto:help@example.com',
        navigationType: 'click',
      }),
    ).toBe(false);
  });
  expect(openURL).toHaveBeenCalledWith('mailto:help@example.com');
  expect(alert).toHaveBeenCalledTimes(1);
  expect(texts()).not.toContain('Unable to load SimsGPT');
});

it('reloads after iOS content-process termination', async () => {
  await act(async () => webview().props.onLoadEnd({ nativeEvent: {} }));
  await act(async () =>
    webview().props.onContentProcessDidTerminate({ nativeEvent: {} }),
  );
  expect(mockReload).toHaveBeenCalledTimes(1);
  expect(texts()).toContain('Loading SimsGPT…');
});

it('remounts the Android view at the latest HTTPS document after renderer loss', async () => {
  const before = webview();
  await act(async () =>
    webview().props.onNavigationStateChange({
      url: 'https://simsgpt.6tst.com/chat?conversation=12',
      canGoBack: true,
    }),
  );
  await act(async () =>
    webview().props.onRenderProcessGone({ nativeEvent: { didCrash: true } }),
  );
  expect(webview()).not.toBe(before);
  expect(webview().props.source.uri).toBe(
    'https://simsgpt.6tst.com/chat?conversation=12',
  );
  expect(texts()).toContain('Loading SimsGPT…');
});

it('tracks the finished redirect so a later popup can navigate back to the original URL', async () => {
  await act(async () =>
    webview().props.onLoadEnd({
      nativeEvent: { url: 'https://simsgpt.6tst.com/' },
    }),
  );
  expect(webview().props.source.uri).toBe('https://simsgpt.6tst.com/');
  await act(async () =>
    webview().props.onOpenWindow({
      nativeEvent: { targetUrl: 'https://simsgpt.6tst.com/chat' },
    }),
  );
  expect(webview().props.source.uri).toBe('https://simsgpt.6tst.com/chat');
});

it('reloads an HTTPS popup targeting the currently displayed source', async () => {
  await act(async () =>
    webview().props.onOpenWindow({
      nativeEvent: { targetUrl: 'https://simsgpt.6tst.com/chat' },
    }),
  );
  expect(mockReload).toHaveBeenCalledTimes(1);
});

it('ignores external popup destinations without a verified tap', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  openURL.mockClear();
  await act(async () =>
    webview().props.onOpenWindow({
      nativeEvent: { targetUrl: 'tel:12345' },
    }),
  );
  expect(openURL).not.toHaveBeenCalled();
});

it('dismisses the native error overlay on hardware back', async () => {
  await act(async () =>
    webview().props.onError({ nativeEvent: { description: 'offline' } }),
  );
  expect(texts()).toContain('Unable to load SimsGPT');
  let consumed = false;
  await act(async () => {
    consumed = hardwareBack();
  });
  expect(consumed).toBe(true);
  expect(texts()).not.toContain('Unable to load SimsGPT');
});

it('navigates the WebView back when it has native history', async () => {
  await act(async () =>
    webview().props.onLoadEnd({
      nativeEvent: { url: 'https://simsgpt.6tst.com/chat' },
    }),
  );
  await act(async () =>
    webview().props.onNavigationStateChange({
      url: 'https://simsgpt.6tst.com/dashboard',
      canGoBack: true,
    }),
  );
  let consumed = false;
  await act(async () => {
    consumed = hardwareBack();
  });
  expect(consumed).toBe(true);
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

it('falls back to in-page history for SPA screens without a native stack', async () => {
  await act(async () =>
    webview().props.onLoad({
      nativeEvent: { url: 'https://simsgpt.6tst.com/chat' },
    }),
  );
  await act(async () =>
    webview().props.onNavigationStateChange({
      url: 'https://simsgpt.6tst.com/chat?view=dashboard',
      canGoBack: false,
    }),
  );
  let consumed = false;
  await act(async () => {
    consumed = hardwareBack();
  });
  expect(consumed).toBe(true);
  expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);
});

it('retries the failed SIMS destination instead of reloading the previous page', async () => {
  const failedUrl = 'https://simsgpt.6tst.com/chat?conversation=123';
  await act(async () =>
    webview().props.onLoadEnd({
      nativeEvent: { url: 'https://simsgpt.6tst.com/chat' },
    }),
  );
  await act(async () =>
    webview().props.onLoadStart({ nativeEvent: { url: failedUrl } }),
  );
  await act(async () =>
    webview().props.onError({ nativeEvent: { url: failedUrl } }),
  );
  await act(async () =>
    tree.root.findByProps({ accessibilityRole: 'button' }).props.onPress(),
  );
  expect(webview().props.source.uri).toBe(failedUrl);
  expect(mockReload).not.toHaveBeenCalled();
});
