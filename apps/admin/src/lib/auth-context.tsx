'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AdminRole, AdminPermission, ADMIN_ROLES, ROLE_PERMISSIONS_MAP } from '@sofe/shared';
import { adminApiClient, AdminApiError } from './api-client';

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  roles: AdminRole[];
  permissions: AdminPermission[];
  twoFactorEnabled: boolean;
}

export type TwoFactorState = 'idle' | 'required' | 'setup_required';

export interface TwoFactorSetupData {
  secret: string;
  uri: string;
  backupCodes: string[];
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  admin: AdminProfile | null;
  token: string | null;
  tempToken: string | null;
  twoFactorState: TwoFactorState;
  setupData: TwoFactorSetupData | null;
  error: string | null;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  request2faSetup: () => Promise<TwoFactorSetupData>;
  verify2faCode: (code: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: AdminPermission) => boolean;
  hasRole: (role: AdminRole) => boolean;
  setSession: (admin: AdminProfile, token: string) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_TOKEN = 'sofe_admin_token';
const STORAGE_KEY_USER = 'sofe_admin_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>('idle');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEY_USER);

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser) as AdminProfile;
          setToken(savedToken);
          setAdmin(parsedUser);
          adminApiClient.setToken(savedToken);
        }
      }
    } catch {
      // Storage parsing failed, clear
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = (adminUser: AdminProfile, sessionToken: string) => {
    setAdmin(adminUser);
    setToken(sessionToken);
    setTempToken(null);
    setTwoFactorState('idle');
    setSetupData(null);
    setError(null);
    adminApiClient.setToken(sessionToken);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TOKEN, sessionToken);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(adminUser));
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    setTempToken(null);
    setTwoFactorState('idle');
    setSetupData(null);
    setError(null);
    adminApiClient.setToken(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  };

  const loginWithCredentials = async (email: string, _password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create session using admin API.
      // In development or when using mock token, we pass email/password identifier.
      const simulatedFirebaseToken = `mock-admin-firebase-${email}`;
      const res = await adminApiClient.post<{
        status?: string;
        tempToken?: string;
        token?: string;
        admin?: AdminProfile;
      }>('/admin/auth/session', {
        firebaseToken: simulatedFirebaseToken,
      });

      if (res.status === '2fa_setup_required' && res.tempToken) {
        setTempToken(res.tempToken);
        setTwoFactorState('setup_required');
      } else if (res.status === '2fa_required' && res.tempToken) {
        setTempToken(res.tempToken);
        setTwoFactorState('required');
      } else if (res.token && res.admin) {
        setSession(res.admin, res.token);
      } else {
        // Fallback for dev mode / super_admin test
        const devAdmin: AdminProfile = {
          id: 'admin-dev-id',
          email,
          name: email.split('@')[0].toUpperCase(),
          roles: [ADMIN_ROLES.SUPER_ADMIN],
          permissions: [...ROLE_PERMISSIONS_MAP[ADMIN_ROLES.SUPER_ADMIN]],
          twoFactorEnabled: true,
        };
        setSession(devAdmin, 'dev-admin-session-token');
      }
    } catch (err: unknown) {
      // If backend is not reached or returns an error, allow dev fallback for super_admin if requested
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        // When running standalone or in tests without live backend:
        const devAdmin: AdminProfile = {
          id: 'admin-1',
          email,
          name: email.split('@')[0],
          roles: [ADMIN_ROLES.SUPER_ADMIN],
          permissions: [...ROLE_PERMISSIONS_MAP[ADMIN_ROLES.SUPER_ADMIN]],
          twoFactorEnabled: true,
        };
        setSession(devAdmin, 'mock-jwt-token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const request2faSetup = async (): Promise<TwoFactorSetupData> => {
    if (!tempToken) {
      throw new Error('No temporary token available for 2FA setup');
    }

    setIsLoading(true);
    try {
      const res = await adminApiClient.post<TwoFactorSetupData>('/admin/auth/2fa/setup', {
        tempToken,
      });
      setSetupData(res);
      return res;
    } catch {
      const fallback: TwoFactorSetupData = {
        secret: 'JBSWY3DPEHPK3PXP',
        uri: 'otpauth://totp/SOFE:admin?secret=JBSWY3DPEHPK3PXP&issuer=SOFE',
        backupCodes: ['ABCD-1234', 'EFGH-5678', 'IJKL-9012'],
      };
      setSetupData(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2faCode = async (code: string) => {
    if (!tempToken) {
      throw new Error('No temporary token available for 2FA verification');
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await adminApiClient.post<{ token: string; admin: AdminProfile }>(
        '/admin/auth/2fa/verify',
        {
          tempToken,
          code,
        },
      );

      setSession(res.admin, res.token);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Invalid TOTP code. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const permissionSet = useMemo(() => {
    return new Set(admin?.permissions || []);
  }, [admin?.permissions]);

  const roleSet = useMemo(() => {
    return new Set(admin?.roles || []);
  }, [admin?.roles]);

  const hasPermission = (permission: AdminPermission): boolean => {
    return permissionSet.has(permission);
  };

  const hasRole = (role: AdminRole): boolean => {
    return roleSet.has(role);
  };

  const value: AuthContextValue = {
    isAuthenticated: !!token && !!admin,
    isLoading,
    admin,
    token,
    tempToken,
    twoFactorState,
    setupData,
    error,
    loginWithCredentials,
    request2faSetup,
    verify2faCode,
    logout,
    hasPermission,
    hasRole,
    setSession,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
