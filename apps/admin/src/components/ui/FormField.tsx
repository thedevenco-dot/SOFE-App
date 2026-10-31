import React from 'react';

export interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  helperText,
  required,
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: error ? 'var(--color-error)' : 'var(--color-white)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{label}</span>
        {required && (
          <span style={{ color: 'var(--color-orange)', fontWeight: 700 }} title="Required">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p
          role="alert"
          style={{
            fontSize: '12px',
            color: 'var(--color-error)',
            marginTop: '2px',
          }}
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-muted)',
            marginTop: '2px',
          }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
