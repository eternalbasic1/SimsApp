import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SIMS_URL } from './config';
import { isMainDocumentError, navigationDecision } from './navigation';
import { useHardwareBackHandler } from './useHardwareBackHandler';
import {
  parseHardwareBackMessage,
  resolveHardwareBackAction,
  WEB_HISTORY_BACK_SCRIPT,
} from './webViewBack';

export default function SimsWebViewScreen() {
  const webView = useRef<WebView>(null);
  const currentDocument = useRef(SIMS_URL);
  const recoverableDocument = useRef(SIMS_URL);
  const canGoBack = useRef(false);
  const shellEntryUrl = useRef(SIMS_URL);
  const lastNavUrl = useRef(SIMS_URL);
  const hasInAppNavigation = useRef(false);
  const retryDocument = useRef<string | null>(null);
  const [uri, setUri] = useState(SIMS_URL);
  const [generation, setGeneration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const rememberDocument = (url: string) => {
    if (navigationDecision(url) === 'webview') {
      currentDocument.current = url;
      if (url.startsWith('https://')) {
        recoverableDocument.current = url;
      }
    }
  };

  const retry = () => {
    setFailed(false);
    setLoading(true);
    const target = retryDocument.current;
    retryDocument.current = null;
    if (target && target !== uri) {
      setUri(target);
    } else {
      webView.current?.reload();
    }
  };

  const showLoadFailure = (url: string) => {
    retryDocument.current =
      (url === SIMS_URL ||
        url.startsWith(SIMS_URL + '?') ||
        url.startsWith(SIMS_URL + '#') ||
        url.startsWith(SIMS_URL + '/')) &&
      !/[?&#](code|error|id_token)=/i.test(url)
        ? url
        : SIMS_URL;
    setLoading(false);
    setFailed(true);
  };

  const openExternal = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Unable to open link',
        'No available app could open this link.',
      );
    });
  };

  const noteNavigation = (url: string) => {
    if (url !== lastNavUrl.current) {
      if (url !== shellEntryUrl.current) {
        hasInAppNavigation.current = true;
      }
      lastNavUrl.current = url;
    }
    if (canGoBack.current) {
      hasInAppNavigation.current = true;
    }
  };

  const onHardwareBack = useCallback((): boolean => {
    const screen = failed
      ? 'error'
      : loading && !hasLoaded
        ? 'initialLoading'
        : 'webview';

    const action = resolveHardwareBackAction({
      screen,
      canGoBack: canGoBack.current,
      hasInAppNavigation: hasInAppNavigation.current,
    });

    switch (action.type) {
      case 'dismissError':
        setFailed(false);
        setLoading(false);
        if (canGoBack.current) {
          webView.current?.goBack();
        }
        return true;
      case 'webViewGoBack':
        webView.current?.goBack();
        return true;
      case 'webHistoryBack':
        webView.current?.injectJavaScript(WEB_HISTORY_BACK_SCRIPT);
        return true;
      case 'exitApp':
      default:
        return false;
    }
  }, [failed, hasLoaded, loading]);

  useHardwareBackHandler(onHardwareBack);

  return (
    <View style={styles.container}>
      <View style={styles.container} accessibilityElementsHidden={failed}>
        <WebView
          key={generation}
          ref={webView}
          source={{ uri }}
          style={styles.container}
          // Intercept every scheme here; an unmatched origin whitelist entry
          // otherwise makes WebView launch a system browser automatically.
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={request => {
            const decision = navigationDecision(
              request.url,
              request.navigationType === 'click',
            );
            if (decision === 'external') {
              openExternal(request.url);
            }
            if (decision === 'webview' && request.isTopFrame !== false) {
              rememberDocument(request.url);
            }
            if (decision !== 'webview' && request.isTopFrame !== false) {
              setLoading(false);
              if (!hasLoaded && decision === 'block') {
                showLoadFailure(SIMS_URL);
              }
            }
            return decision === 'webview';
          }}
          onOpenWindow={({ nativeEvent: { targetUrl } }) => {
            const decision = navigationDecision(targetUrl);
            if (decision === 'webview' && targetUrl.startsWith('https://')) {
              rememberDocument(targetUrl);
              setFailed(false);
              setLoading(true);
              if (targetUrl === uri) {
                webView.current?.reload();
              } else {
                setUri(targetUrl);
              }
            }
          }}
          onLoadStart={({ nativeEvent }) => {
            rememberDocument(nativeEvent.url);
            setLoading(true);
          }}
          onLoad={event => {
            setHasLoaded(true);
            const url = event?.nativeEvent?.url;
            if (url) {
              shellEntryUrl.current = url;
              lastNavUrl.current = url;
              hasInAppNavigation.current = false;
            }
          }}
          onMessage={({ nativeEvent }) => {
            const result = parseHardwareBackMessage(nativeEvent.data);
            if (!result) {
              return;
            }
            if (!result.moved) {
              hasInAppNavigation.current = false;
            }
          }}
          onLoadEnd={({ nativeEvent }) => {
            setLoading(false);
            // Keep the source aligned after completed redirects. Native WebView
            // ignores a source URL already displayed, preserving its session.
            if (
              !retryDocument.current &&
              nativeEvent.url?.startsWith('https://')
            ) {
              rememberDocument(nativeEvent.url);
              setUri(nativeEvent.url);
            }
          }}
          onError={({ nativeEvent }) =>
            showLoadFailure(nativeEvent.url || currentDocument.current)
          }
          onHttpError={({ nativeEvent }) => {
            if (isMainDocumentError(nativeEvent.url, currentDocument.current)) {
              showLoadFailure(nativeEvent.url);
            }
          }}
          onNavigationStateChange={state => {
            rememberDocument(state.url);
            canGoBack.current = state.canGoBack;
            noteNavigation(state.url);
          }}
          onContentProcessDidTerminate={retry}
          onRenderProcessGone={() => {
            setFailed(false);
            setLoading(true);
            setUri(recoverableDocument.current);
            setGeneration(value => value + 1);
          }}
          renderError={() => <View />}
          incognito={false}
          domStorageEnabled
          cacheEnabled
          mixedContentMode="never"
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType={
            Platform.OS === 'ios' ? 'grantIfSameHostElsePrompt' : undefined
          }
          webviewDebuggingEnabled={__DEV__}
        />
      </View>
      {loading && !failed && !hasLoaded && (
        <View
          pointerEvents="auto"
          style={styles.overlay}
          accessibilityLiveRegion="polite"
        >
          <ActivityIndicator size="large" color="#273b74" />
          <Text style={styles.message}>Loading SIMS…</Text>
        </View>
      )}
      {failed && (
        <View style={styles.overlay} accessibilityLiveRegion="assertive">
          <Text accessibilityRole="header" style={styles.title}>
            Unable to load SIMS
          </Text>
          <Text style={styles.message}>
            Check your internet connection and try again.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 22, fontWeight: '600', color: '#172647' },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#48556a',
  },
  retry: {
    marginTop: 24,
    minHeight: 48,
    paddingHorizontal: 32,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#273b74',
  },
  retryText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
