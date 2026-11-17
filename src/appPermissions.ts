import {Linking, PermissionsAndroid, Platform} from 'react-native';

export type LaunchPermissionIssue = 'microphone' | 'camera' | 'photos';

export const APP_PERMISSION_USAGE_REASON =
  'SimsGPT uses camera, microphone, and your photo library when you attach files or when the website requests media access during chat.';

type AndroidPermissionEntry = {
  permission: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS];
  issue: LaunchPermissionIssue;
};

const ANDROID_LAUNCH_PERMISSIONS: AndroidPermissionEntry[] = [
  {
    permission: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    issue: 'microphone',
  },
  {permission: PermissionsAndroid.PERMISSIONS.CAMERA, issue: 'camera'},
  {
    permission: PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    issue: 'photos',
  },
  {
    permission: PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
    issue: 'photos',
  },
  {
    permission: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    issue: 'photos',
  },
];

const ANDROID_RATIONALE = {
  title: 'Allow access for SimsGPT',
  message: APP_PERMISSION_USAGE_REASON,
  buttonPositive: 'Allow',
  buttonNegative: 'Deny',
};

function noteIssue(
  issues: LaunchPermissionIssue[],
  issue: LaunchPermissionIssue,
) {
  if (!issues.includes(issue)) {
    issues.push(issue);
  }
}

async function requestAndroidPermissions(): Promise<LaunchPermissionIssue[]> {
  const issues: LaunchPermissionIssue[] = [];

  for (const {permission, issue} of ANDROID_LAUNCH_PERMISSIONS) {
    try {
      const alreadyGranted = await PermissionsAndroid.check(permission);
      if (alreadyGranted) {
        continue;
      }
    } catch {
      continue;
    }

    const result = await PermissionsAndroid.request(
      permission,
      ANDROID_RATIONALE,
    );

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      continue;
    }
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      noteIssue(issues, issue);
    }
  }

  return issues;
}

async function requestIosPermissions(): Promise<LaunchPermissionIssue[]> {
  const {
    checkMultiple,
    PERMISSIONS,
    requestMultiple,
    RESULTS,
  } = require('react-native-permissions') as typeof import('react-native-permissions');

  const permissions = [
    PERMISSIONS.IOS.MICROPHONE,
    PERMISSIONS.IOS.CAMERA,
    PERMISSIONS.IOS.PHOTO_LIBRARY,
    PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY,
  ] as const;

  const issues: LaunchPermissionIssue[] = [];
  const checked = await checkMultiple([...permissions]);
  const toRequest: (typeof permissions)[number][] = [];

  const mapIssue = (permission: (typeof permissions)[number]): LaunchPermissionIssue | null => {
    if (permission === PERMISSIONS.IOS.MICROPHONE) {
      return 'microphone';
    }
    if (permission === PERMISSIONS.IOS.CAMERA) {
      return 'camera';
    }
    return 'photos';
  };

  for (const permission of permissions) {
    const status = checked[permission];
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      continue;
    }
    if (status === RESULTS.BLOCKED) {
      const mapped = mapIssue(permission);
      if (mapped) {
        noteIssue(issues, mapped);
      }
      continue;
    }
    if (status === RESULTS.DENIED) {
      toRequest.push(permission);
    }
  }

  if (toRequest.length > 0) {
    const requested = await requestMultiple(toRequest);
    for (const permission of toRequest) {
      const status = requested[permission];
      if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
        const mapped = mapIssue(permission);
        if (mapped) {
          noteIssue(issues, mapped);
        }
      }
    }
  }

  return issues;
}

/** Requests every applicable runtime permission once on cold start. */
export async function requestLaunchPermissions(): Promise<
  LaunchPermissionIssue[]
> {
  if (Platform.OS === 'android') {
    return requestAndroidPermissions();
  }
  if (Platform.OS === 'ios') {
    return requestIosPermissions();
  }
  return [];
}

export async function openAppPermissionSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await Linking.openSettings();
    return;
  }
  const {openSettings} =
    require('react-native-permissions') as typeof import('react-native-permissions');
  await openSettings();
}