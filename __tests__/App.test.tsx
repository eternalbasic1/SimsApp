import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import SimsWebViewScreen from '../src/SimsWebViewScreen';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, right: 0, bottom: 34, left: 0 },
    },
  };
});

jest.mock('../src/SimsWebViewScreen', () => () => null);

test('mounts the SIMS screen at the app entry point', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(tree.root.findAllByType(SimsWebViewScreen)).toHaveLength(1);
  await act(async () => tree.unmount());
});
