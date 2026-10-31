'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  Video,
  FileText,
  Hash,
  UserCheck,
  HelpCircle,
  Calendar,
  Gift,
  Award,
  Quote,
  AlertTriangle,
  MessageSquare,
  Shield,
  CreditCard,
  Receipt,
  Tag,
  TrendingUp,
  BarChart3,
  Users,
  UserCog,
  Activity,
  Settings,
  LayoutDashboard,
  Layers,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { ADMIN_NAV_GROUPS, filterNavGroupsByPermissions } from '../../lib/navigation';
import { Badge } from '../ui/Badge';

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Video,
  FileText,
  Hash,
  UserCheck,
  HelpCircle,
  Calendar,
  Gift,
  Award,
  Quote,
  AlertTriangle,
  MessageSquare,
  Shield,
  CreditCard,
  Receipt,
  Tag,
  TrendingUp,
  BarChart3,
  Users,
  UserCog,
  Activity,
  Settings,
  LayoutDashboard,
  Layers,
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin } = useAuth();

  const userPermissions = admin?.permissions || [];
  const visibleGroups = filterNavGroupsByPermissions(ADMIN_NAV_GROUPS, userPermissions);

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--color-navy)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-navy)',
            fontWeight: 800,
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          S
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '16px',
              letterSpacing: '0.05em',
              color: 'var(--color-white)',
            }}
          >
            SOFE
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Admin Panel
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Core Dashboard Link (Always visible to all authenticated roles) */}
        <div>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              color:
                pathname === '/dashboard' || pathname === '/'
                  ? 'var(--color-orange)'
                  : 'var(--color-white)',
              backgroundColor:
                pathname === '/dashboard' || pathname === '/'
                  ? 'rgba(255, 132, 41, 0.12)'
                  : 'transparent',
              transition: 'background-color 0.15s ease',
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Dynamic Groups filtered by RBAC */}
        {visibleGroups.map((group) => (
          <div key={group.id} data-testid={`nav-group-${group.id}`}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '4px 12px 8px 12px',
              }}
            >
              {group.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {group.items.map((item) => {
                const IconComponent = ICON_MAP[item.iconName] || FileText;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    data-testid={`nav-item-${item.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--color-orange)' : 'var(--color-muted)',
                      backgroundColor: isActive ? 'rgba(255, 132, 41, 0.12)' : 'transparent',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--color-white)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--color-muted)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComponent size={16} />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && <Badge variant="orange">{item.badge}</Badge>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role & User Footer */}
      {admin && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'rgba(20, 45, 66, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-slate)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-orange)',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {admin.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-white)',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {admin.name}
              </div>
              <div style={{ marginTop: '2px' }}>
                <Badge variant="orange">{admin.roles[0]?.toUpperCase() || 'STAFF'}</Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
