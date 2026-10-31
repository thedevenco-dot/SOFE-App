import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-orange)',
          color: 'var(--color-navy)', // 7:1 contrast
          border: 'none',
          fontWeight: 600,
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-slate)',
          color: 'var(--color-white)',
          border: '1px solid var(--color-border-subtle)',
          fontWeight: 500,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-white)',
          border: '1px solid var(--color-border-subtle)',
          fontWeight: 500,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-muted)',
          border: 'none',
          fontWeight: 500,
        };
      case 'destructive':
        return {
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          color: 'var(--color-error)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          fontWeight: 600,
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '12px',
          borderRadius: 'var(--radius-sm)',
        };
      case 'md':
        return {
          padding: '10px 16px',
          fontSize: '14px',
          borderRadius: 'var(--radius-sm)',
        };
      case 'lg':
        return {
          padding: '14px 24px',
          fontSize: '16px',
          borderRadius: 'var(--radius-md)',
        };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.15s ease',
        opacity: disabled || isLoading ? 0.6 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
