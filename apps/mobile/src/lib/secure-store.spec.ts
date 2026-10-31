import { tokenStorage } from './secure-store';
import { __clearMockStore } from '../test-utils/expo-secure-store-mock';

describe('tokenStorage (SecureStore wrapper)', () => {
  beforeEach(() => {
    __clearMockStore();
  });

  it('should store, retrieve, and clear an auth token', async () => {
    expect(await tokenStorage.getAuthToken()).toBeNull();

    await tokenStorage.setAuthToken('test-learner-jwt-token');
    expect(await tokenStorage.getAuthToken()).toBe('test-learner-jwt-token');

    await tokenStorage.clearAuthToken();
    expect(await tokenStorage.getAuthToken()).toBeNull();
  });

  it('should store, retrieve, and clear refresh tokens', async () => {
    expect(await tokenStorage.getRefreshToken()).toBeNull();

    await tokenStorage.setRefreshToken('test-refresh-token-456');
    expect(await tokenStorage.getRefreshToken()).toBe('test-refresh-token-456');

    await tokenStorage.clearAllAuth();
    expect(await tokenStorage.getAuthToken()).toBeNull();
    expect(await tokenStorage.getRefreshToken()).toBeNull();
  });
});
