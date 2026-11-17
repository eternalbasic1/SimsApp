import {Linking, PermissionsAndroid, Platform} from 'react-native';
import {
  openAppPermissionSettings,
  requestLaunchPermissions,
} from '../src/appPermissions';

const mockCheckMultiple = jest.fn();
const mockRequestMultiple = jest.fn();

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      MICROPHONE: 'ios.permission.MICROPHONE',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
      PHOTO_LIBRARY_ADD_ONLY: 'ios.permission.PHOTO_LIBRARY_ADD_ONLY',
    },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    BLOCKED: 'blocked',
    DENIED: 'denied',
    GRANTED: 'granted',
    LIMITED: 'limited',
  },
  checkMultiple: (...args: unknown[]) => mockCheckMultiple(...args),
  requestMultiple: (...args: unknown[]) => mockRequestMultiple(...args),
  openSettings: jest.fn(),
}));

describe('requestLaunchPermissions', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('uses PermissionsAndroid on Android without RNPermissions', async () => {
    Platform.OS = 'android';
    jest
      .spyOn(PermissionsAndroid, 'check')
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED)
      .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

    await expect(requestLaunchPermissions()).resolves.toEqual([]);
    expect(PermissionsAndroid.request).toHaveBeenCalled();
    expect(mockCheckMultiple).not.toHaveBeenCalled();
  });

  test('reports blocked microphone after never ask again on Android', async () => {
    Platform.OS = 'android';
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
      .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

    await expect(requestLaunchPermissions()).resolves.toEqual(['microphone']);
  });

  test('reports blocked microphone on iOS without re-requesting', async () => {
    Platform.OS = 'ios';
    mockCheckMultiple.mockResolvedValue({
      'ios.permission.MICROPHONE': 'blocked',
      'ios.permission.CAMERA': 'granted',
      'ios.permission.PHOTO_LIBRARY': 'granted',
      'ios.permission.PHOTO_LIBRARY_ADD_ONLY': 'granted',
    });

    await expect(requestLaunchPermissions()).resolves.toEqual(['microphone']);
    expect(mockRequestMultiple).not.toHaveBeenCalled();
  });

  test('opens Android settings via Linking', async () => {
    Platform.OS = 'android';
    const openSettings = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue();
    await openAppPermissionSettings();
    expect(openSettings).toHaveBeenCalled();
  });
});