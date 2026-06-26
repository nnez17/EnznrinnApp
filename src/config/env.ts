import Constants from 'expo-constants';

type FirebaseEnvConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as {
  firebase?: FirebaseEnvConfig;
};

const firebaseEnv = extra.firebase ?? {};

export const FIREBASE_CONFIG = {
  apiKey: firebaseEnv.apiKey ?? '',
  authDomain: firebaseEnv.authDomain ?? '',
  projectId: firebaseEnv.projectId ?? '',
  storageBucket: firebaseEnv.storageBucket ?? '',
  messagingSenderId: firebaseEnv.messagingSenderId ?? '',
  appId: firebaseEnv.appId ?? '',
};

export const hasFirebaseConfig = Boolean(
  FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.projectId &&
  FIREBASE_CONFIG.appId
);
