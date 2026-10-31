import { api, apiClient, ApiError } from './api-client';
import { tokenStorage } from './secure-store';
import { __clearMockStore } from '../test-utils/expo-secure-store-mock';

declare const global: {
  fetch: unknown;
};

describe('API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    __clearMockStore();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should include Authorization header when token exists', async () => {
    await tokenStorage.setAuthToken('my-secret-jwt');

    let capturedHeaders: Headers | undefined;
    global.fetch = jest.fn().mockImplementation(async (_url, options) => {
      capturedHeaders = options.headers as Headers;
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { user: 'founder' } }),
      };
    });

    const res = await api.get<{ user: string }>('/me');
    expect(res).toEqual({ user: 'founder' });
    expect(capturedHeaders?.get('Authorization')).toBe('Bearer my-secret-jwt');
  });

  it('should omit Authorization header when skipAuth is true', async () => {
    await tokenStorage.setAuthToken('my-secret-jwt');

    let capturedHeaders: Headers | undefined;
    global.fetch = jest.fn().mockImplementation(async (_url, options) => {
      capturedHeaders = options.headers as Headers;
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { status: 'ok' } }),
      };
    });

    await apiClient('/public-endpoint', { skipAuth: true });
    expect(capturedHeaders?.has('Authorization')).toBe(false);
  });

  it('should parse standard SOFE error envelopes and throw ApiError', async () => {
    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account is suspended',
          },
        }),
      };
    });

    await expect(api.get('/me')).rejects.toThrow(ApiError);
    await expect(api.get('/me')).rejects.toMatchObject({
      code: 'ACCOUNT_SUSPENDED',
      status: 403,
      message: 'Your account is suspended',
    });
  });
});
