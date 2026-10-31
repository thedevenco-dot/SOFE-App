'use client';

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  TrendingUp,
  BookOpen,
  Users,
  AlertTriangle,
  CreditCard,
  Calendar,
  Layers,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { useAuth } from '../../lib/auth-context';
import { ADMIN_ROLES, AdminRole } from '@sofe/shared';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';

interface CourseRecord {
  id: string;
  title: string;
  category: string;
  status: BadgeVariant;
  enrolled: number;
  pricePaise: number;
  updatedAt: string;
}

const SAMPLE_COURSES: CourseRecord[] = [
  {
    id: 'c-1',
    title: 'Pre-Seed Capital Raising & Term Sheets',
    category: 'Fundraising',
    status: 'published',
    enrolled: 420,
    pricePaise: 499900,
    updatedAt: '2026-10-28',
  },
  {
    id: 'c-2',
    title: 'Customer Discovery for Early Stage Founders',
    category: 'Validation',
    status: 'published',
    enrolled: 615,
    pricePaise: 299900,
    updatedAt: '2026-10-27',
  },
  {
    id: 'c-3',
    title: 'B2B Sales Playbook & Cold Email Strategy',
    category: 'Growth',
    status: 'review',
    enrolled: 0,
    pricePaise: 399900,
    updatedAt: '2026-10-29',
  },
  {
    id: 'c-4',
    title: 'Unit Economics & Financial Modeling for Startups',
    category: 'Finance',
    status: 'draft',
    enrolled: 0,
    pricePaise: 599900,
    updatedAt: '2026-10-26',
  },
  {
    id: 'c-5',
    title: 'Founder Brand & Building in Public on X',
    category: 'Marketing',
    status: 'scheduled',
    enrolled: 0,
    pricePaise: 199900,
    updatedAt: '2026-10-25',
  },
];

export default function DashboardPage() {
  const { admin } = useAuth();
  const primaryRole: AdminRole = admin?.roles[0] || ADMIN_ROLES.SUPER_ADMIN;

  const columns = useMemo<ColumnDef<CourseRecord>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Course Title',
        cell: ({ row }) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-white)' }}>{row.original.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
              ID: {row.original.id}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span style={{ color: 'var(--color-muted)' }}>{row.original.category}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.status}>{row.original.status.toUpperCase()}</Badge>
        ),
      },
      {
        accessorKey: 'pricePaise',
        header: 'Price',
        cell: ({ row }) => (
          <span style={{ fontWeight: 600 }}>
            {row.original.pricePaise === 0
              ? 'FREE'
              : `₹${(row.original.pricePaise / 100).toLocaleString('en-IN')}`}
          </span>
        ),
      },
      {
        accessorKey: 'enrolled',
        header: 'Enrolled',
        cell: ({ row }) => (
          <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
            {row.original.enrolled.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => (
          <span style={{ color: 'var(--color-muted)', fontSize: '12px' }}>
            {row.original.updatedAt}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--color-white)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Operational Overview
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Welcome back, {admin?.name}. Role context:{' '}
              <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
                {primaryRole.replace('_', ' ').toUpperCase()}
              </span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-slate)',
                border: '1px solid var(--color-border-subtle)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--color-white)',
              }}
            >
              <Calendar size={14} color="var(--color-orange)" />
              <span>Oct 1 – Oct 30, 2026</span>
            </div>
            <Button size="sm" variant="primary">
              <Layers size={14} />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        {/* Role-Adaptive Metric Cards (AD2) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Card 1: Revenue (Super Admin or Finance) */}
          {(primaryRole === ADMIN_ROLES.SUPER_ADMIN || primaryRole === ADMIN_ROLES.FINANCE) && (
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Revenue (30d)
                </span>
                <CreditCard size={18} color="var(--color-orange)" />
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--color-white)',
                  marginTop: '10px',
                }}
              >
                ₹18,45,200
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-success)',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <TrendingUp size={12} />
                <span>+24.6% vs last month</span>
              </div>
            </div>
          )}

          {/* Card 2: Published Content (Super Admin or Content Editor) */}
          {(primaryRole === ADMIN_ROLES.SUPER_ADMIN ||
            primaryRole === ADMIN_ROLES.CONTENT_EDITOR) && (
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Published Courses
                </span>
                <BookOpen size={18} color="var(--color-orange)" />
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--color-white)',
                  marginTop: '10px',
                }}
              >
                18 Courses
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
                4 drafts waiting for review
              </div>
            </div>
          )}

          {/* Card 3: Active Learners (Super Admin, Moderator, Sales Support) */}
          {(primaryRole === ADMIN_ROLES.SUPER_ADMIN ||
            primaryRole === ADMIN_ROLES.MODERATOR ||
            primaryRole === ADMIN_ROLES.SALES_SUPPORT) && (
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Active Learners
                </span>
                <Users size={18} color="var(--color-orange)" />
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--color-white)',
                  marginTop: '10px',
                }}
              >
                4,892
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px' }}>
                +112 onboarded today
              </div>
            </div>
          )}

          {/* Card 4: Moderation Flags / Support */}
          {(primaryRole === ADMIN_ROLES.SUPER_ADMIN || primaryRole === ADMIN_ROLES.MODERATOR) && (
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Reports & Flags
                </span>
                <AlertTriangle size={18} color="var(--color-gold)" />
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--color-white)',
                  marginTop: '10px',
                }}
              >
                2 Open
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
                Average resolution: 2.1 hours
              </div>
            </div>
          )}
        </div>

        {/* Reusable DataTable Component Demo */}
        <section
          style={{
            backgroundColor: 'var(--color-slate)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
              Curriculum & Course Catalog (DataTable Demo)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              Integrated server-ready table with sortable columns, search filter, and status tokens.
            </p>
          </div>

          <DataTable
            columns={columns}
            data={SAMPLE_COURSES}
            searchKey="title"
            searchPlaceholder="Filter by course name..."
            pageSize={5}
          />
        </section>

        {/* Reusable FormField Component Demo */}
        <section
          style={{
            backgroundColor: 'var(--color-slate)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
              Admin FormField Component Demo
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              Accessible form fields with error and helper state styling matching SOFE theme rules.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            <FormField
              label="Course Public Slug"
              required
              helperText="Auto-generated URL identifier for the course detail page"
            >
              <input
                type="text"
                defaultValue="pre-seed-capital-raising"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(6, 30, 48, 0.6)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-white)',
                  fontSize: '13px',
                }}
              />
            </FormField>

            <FormField
              label="GST Identification Number"
              error="Invalid GSTIN format. Expected 15 characters (e.g. 29AAAAA0000A1Z5)"
            >
              <input
                type="text"
                defaultValue="INVALID-GST-NUMBER"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(6, 30, 48, 0.6)',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-white)',
                  fontSize: '13px',
                }}
              />
            </FormField>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
