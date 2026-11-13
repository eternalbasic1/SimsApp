export type NavigationDecision = 'webview' | 'external' | 'block';

// Keep HTTPS redirects in the same website session. Company auth hosts are
// deliberately not guessed: their real redirect chain must be tested on-device.
export function navigationDecision(
  url: string,
  userInitiated = false,
): NavigationDecision {
  if (url === 'about:blank') {
    return 'webview';
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return 'webview';
    }
    if (parsed.protocol === 'blob:') {
      return new URL(url.slice(5)).protocol === 'https:' ? 'webview' : 'block';
    }
    if (
      userInitiated &&
      (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:')
    ) {
      return 'external';
    }
  } catch {
    // Malformed navigation must not be handed to another application.
  }
  return 'block';
}

// Android can report HTTP failures for images/iframes too. Only the current
// main document should replace the entire app with a Retry screen.
export function isMainDocumentError(url: string, mainUrl: string): boolean {
  if (!url || !mainUrl) {
    return false;
  }
  return url.split('#')[0] === mainUrl.split('#')[0];
}
