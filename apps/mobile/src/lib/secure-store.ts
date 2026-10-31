import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'sofe_auth_token';
const REFRESH_TOKEN_KEY = 'sofe_refresh_token';

// In-memory fallback for web or environments where SecureStore is unavailable
const memoryStorage = new Map<string, string>();

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStorage.set(key, value);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // storage disabled or unavailable
      }
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (memoryStorage.has(key)) return memoryStorage.get(key) ?? null;
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  }
  return await SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStorage.delete(key);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  setItem,
  getItem,
  deleteItem,
  removeItem: deleteItem,

  async setAuthToken(token: string): Promise<void> {
    await setItem(AUTH_TOKEN_KEY, token);
  },

  async getAuthToken(): Promise<string | null> {
    return getItem(AUTH_TOKEN_KEY);
  },

  async clearAuthToken(): Promise<void> {
    await deleteItem(AUTH_TOKEN_KEY);
  },

  async removeAuthToken(): Promise<void> {
    await deleteItem(AUTH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await setItem(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },

  async clearAllAuth(): Promise<void> {
    await deleteItem(AUTH_TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
  },
};
