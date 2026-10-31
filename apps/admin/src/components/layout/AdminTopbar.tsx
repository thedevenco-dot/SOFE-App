'use client';

import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { useAuth, AdminProfile } from '../../lib/auth-context';
import { ADMIN_ROLES, AdminRole, ROLE_PERMISSIONS_MAP } from '@sofe/shared';
import { Button } from '../ui/Button';

export function AdminTopbar() {
  const { admin, logout, setSession } = useAuth();

  const handleRoleSwitch = (newRole: AdminRole) => {
    if (!admin) return;
    const updatedAdmin: AdminProfile = {
      ...admin,
      roles: [newRole],
      permissions: [...ROLE_PERMISSIONS_MAP[newRole]],
    };
    setSession(updatedAdmin, 'dev-role-switch-token');
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--color-navy)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* AD3 Global Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--color-slate)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          width: '380px',
        }}
      >
        <Search size={16} color="var(--color-muted)" />
        <input
          type="text"
          placeholder="Global search (courses, articles, users, orders)..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-white)',
            fontSize: '13px',
            width: '100%',
          }}
        />
        <span
          style={{
            fontSize: '10px',
            padding: '2px 5px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--color-muted)',
            fontWeight: 600,
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Role Demo Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600 }}>
            Active Role:
          </span>
          <select
            value={admin?.roles[0] || ADMIN_ROLES.SUPER_ADMIN}
            onChange={(e) => handleRoleSwitch(e.target.value as AdminRole)}
            style={{
              backgroundColor: 'var(--color-slate)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-orange)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={ADMIN_ROLES.SUPER_ADMIN}>Super Admin (All)</option>
            <option value={ADMIN_ROLES.CONTENT_EDITOR}>Content Editor</option>
            <option value={ADMIN_ROLES.FINANCE}>Finance</option>
            <option value={ADMIN_ROLES.MODERATOR}>Moderator</option>
            <option value={ADMIN_ROLES.SALES_SUPPORT}>Sales & Support</option>
          </select>
        </div>

        {/* Notifications */}
        <button
          title="Notifications"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-muted)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={18} />
        </button>

        {/* User Summary & Sign out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: '1px solid var(--color-border)',
            paddingLeft: '16px',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-white)' }}>
              {admin?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{admin?.email}</div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            title="Sign out of Admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-muted)',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
