import React from 'react';

export type BadgeVariant =
  | 'draft'
  | 'review'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'failed'
  | 'orange'
  | 'navy'
  | 'slate';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  draft: {
    bg: '#1e293b',
    color: '#94a3b8',
    border: '#334155',
  },
  review: {
    bg: 'rgba(217, 144, 69, 0.15)',
    color: '#d99045',
    border: 'rgba(217, 144, 69, 0.35)',
  },
  scheduled: {
    bg: 'rgba(76, 155, 232, 0.15)',
    color: '#4c9be8',
    border: 'rgba(76, 155, 232, 0.35)',
  },
  published: {
    bg: 'rgba(61, 214, 140, 0.15)',
    color: '#3dd68c',
    border: 'rgba(61, 214, 140, 0.35)',
  },
  archived: {
    bg: '#0f172a',
    color: '#64748b',
    border: '#1e293b',
  },
  failed: {
    bg: 'rgba(255, 107, 107, 0.15)',
    color: '#ff6b6b',
    border: 'rgba(255, 107, 107, 0.35)',
  },
  orange: {
    bg: 'rgba(255, 132, 41, 0.15)',
    color: '#ff8429',
    border: 'rgba(255, 132, 41, 0.35)',
  },
  navy: {
    bg: '#061e30',
    color: '#ffffff',
    border: '#142d42',
  },
  slate: {
    bg: '#142d42',
    color: '#a9b8c6',
    border: '#234665',
  },
};

export function Badge({ children, variant = 'slate', style }: BadgeProps) {
  const current = VARIANT_STYLES[variant] || VARIANT_STYLES.slate;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
