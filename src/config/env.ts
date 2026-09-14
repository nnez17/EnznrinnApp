import Constants from 'expo-constants';

// Android emulator instead needs http://10.0.2.2:8080 via EXPO_PUBLIC_API_URL.
function resolveApiUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:8080`;
}

export const API_URL = resolveApiUrl();

export const hasApiConfig = Boolean(process.env.EXPO_PUBLIC_API_URL);
