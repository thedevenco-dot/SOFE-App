'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, AlertCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { ADMIN_ROLES, AdminRole, ROLE_PERMISSIONS_MAP } from '@sofe/shared';

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    twoFactorState,
    setupData,
    error,
    loginWithCredentials,
    request2faSetup,
    verify2faCode,
    setSession,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState('admin@sofe.edu');
  const [password, setPassword] = useState('Password@1234');
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (twoFactorState === 'setup_required' && !setupData) {
      request2faSetup();
    }
  }, [twoFactorState, setupData, request2faSetup]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      await loginWithCredentials(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2faVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      await verify2faCode(totpCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (role: AdminRole = ADMIN_ROLES.SUPER_ADMIN) => {
    setSession(
      {
        id: 'admin-demo-1',
        email: `demo.${role}@sofe.edu`,
        name: `Demo ${role.replace('_', ' ').toUpperCase()}`,
        roles: [role],
        permissions: [...ROLE_PERMISSIONS_MAP[role]],
        twoFactorEnabled: true,
      },
      'demo-bearer-token',
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-navy)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-slate)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-orange)',
              color: 'var(--color-navy)',
              fontWeight: 800,
              fontSize: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            S
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--color-white)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            SOFE Admin Portal
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            {twoFactorState === 'idle'
              ? 'Sign in with your staff credentials'
              : twoFactorState === 'setup_required'
                ? 'Step 2: Setup Two-Factor Authentication'
                : 'Step 2: Enter 6-digit TOTP Security Code'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 107, 107, 0.15)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              color: 'var(--color-error)',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Email + Password Form */}
        {twoFactorState === 'idle' && (
          <form onSubmit={handleCredentialsSubmit}>
            <FormField label="Staff Email" required htmlFor="admin-email">
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sofe.edu"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(6, 30, 48, 0.6)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </FormField>

            <FormField label="Password" required htmlFor="admin-password">
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(6, 30, 48, 0.6)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Key size={18} />
              <span>Continue to 2FA</span>
            </Button>
          </form>
        )}

        {/* Step 2a: 2FA Setup Required */}
        {twoFactorState === 'setup_required' && (
          <form onSubmit={handle2faVerify}>
            <div
              style={{
                backgroundColor: 'rgba(6, 30, 48, 0.7)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--color-orange)', marginBottom: '8px' }}>
                First Time 2FA Enrollment:
              </div>
              <p style={{ color: 'var(--color-muted)', marginBottom: '10px', fontSize: '12px' }}>
                Add this key to Google Authenticator or 1Password:
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--color-slate)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  color: 'var(--color-white)',
                }}
              >
                <span>{setupData?.secret || 'LOADING...'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (setupData?.secret) {
                      navigator.clipboard.writeText(setupData.secret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                  }}
                >
                  {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <FormField label="6-Digit Verification Code" required htmlFor="totp-setup-input">
              <input
                id="totp-setup-input"
                type="text"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(6, 30, 48, 0.6)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-white)',
                  fontSize: '20px',
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  outline: 'none',
                  fontWeight: 700,
                }}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Shield size={18} />
              <span>Verify and Sign In</span>
            </Button>
          </form>
        )}

        {/* Step 2b: Standard 2FA Challenge */}
        {twoFactorState === 'required' && (
          <form onSubmit={handle2faVerify}>
            <FormField
              label="TOTP Security Code"
              required
              helperText="Enter the 6-digit code from your authenticator app"
              htmlFor="totp-verify-input"
            >
              <input
                id="totp-verify-input"
                type="text"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(6, 30, 48, 0.6)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-white)',
                  fontSize: '22px',
                  letterSpacing: '0.35em',
                  textAlign: 'center',
                  outline: 'none',
                  fontWeight: 700,
                }}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Shield size={18} />
              <span>Authenticate Session</span>
            </Button>
          </form>
        )}

        {/* Quick Demo Bypass for local testing & reviewer convenience */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border-subtle)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-muted)',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Instant Testing Access (Demo Roles)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickDemoLogin(ADMIN_ROLES.SUPER_ADMIN)}
            >
              Super Admin
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickDemoLogin(ADMIN_ROLES.CONTENT_EDITOR)}
            >
              Content Editor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickDemoLogin(ADMIN_ROLES.FINANCE)}
            >
              Finance
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickDemoLogin(ADMIN_ROLES.MODERATOR)}
            >
              Moderator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
