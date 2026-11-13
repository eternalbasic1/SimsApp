import { navigationDecision, isMainDocumentError } from '../src/navigation';

describe('navigationDecision', () => {
  it.each([
    ['https://simsgpt.6tst.com/chat', false, 'webview'],
    [
      'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize',
      false,
      'webview',
    ],
    ['https://company.example/sso/callback', false, 'webview'],
    ['https://simsgpt.6tst.com/?code=test-code', false, 'webview'],
    ['https://example.com/document', true, 'webview'],
    ['blob:https://simsgpt.6tst.com/abc-123', false, 'webview'],
    ['about:blank', false, 'webview'],
    ['mailto:help@example.com', true, 'external'],
    ['tel:+911234567890', true, 'external'],
    ['mailto:help@example.com', false, 'block'],
    ['tel:+911234567890', false, 'block'],
    ['http://simsgpt.6tst.com/chat', true, 'block'],
    [['javascript', 'alert(1)'].join(':'), true, 'block'],
    ['data:text/html,hello', true, 'block'],
    ['file:///private/example', true, 'block'],
    ['msauth://callback', false, 'block'],
    ['blob:http://example.com/file', false, 'block'],
    ['blob:null/123', false, 'block'],
    ['not a URL', true, 'block'],
    ['', false, 'block'],
  ])('handles %s (user action %s) as %s', (url, userAction, expected) => {
    expect(navigationDecision(url as string, userAction as boolean)).toBe(
      expected,
    );
  });
});

describe('main-document error filtering', () => {
  it('shows a main-page HTTP failure even if its fragment differs', () => {
    expect(
      isMainDocumentError(
        'https://example.com/chat',
        'https://example.com/chat#reply',
      ),
    ).toBe(true);
  });
  it('does not replace the page for a failed subresource', () => {
    expect(
      isMainDocumentError(
        'https://example.com/logo.png',
        'https://example.com/chat',
      ),
    ).toBe(false);
  });
  it('does not match different authentication redirect queries', () => {
    expect(
      isMainDocumentError(
        'https://example.com/?step=1',
        'https://example.com/?step=2',
      ),
    ).toBe(false);
  });
  it('does not treat missing URLs as a main-page failure', () => {
    expect(isMainDocumentError('', '')).toBe(false);
  });
});
