import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth-context';
import { ADMIN_ROLES, ADMIN_PERMISSIONS, ROLE_PERMISSIONS_MAP } from '@sofe/shared';

function TestConsumer() {
  const { isAuthenticated, admin, hasPermission, hasRole, setSession, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="admin-name">{admin?.name || 'none'}</div>
      <div data-testid="perm-course-publish">
        {hasPermission(ADMIN_PERMISSIONS.COURSE_PUBLISH) ? 'yes' : 'no'}
      </div>
      <div data-testid="perm-order-refund">
        {hasPermission(ADMIN_PERMISSIONS.ORDER_REFUND) ? 'yes' : 'no'}
      </div>
      <div data-testid="role-super">{hasRole(ADMIN_ROLES.SUPER_ADMIN) ? 'yes' : 'no'}</div>
      <button
        onClick={() =>
          setSession(
            {
              id: 'a1',
              email: 'editor@sofe.edu',
              name: 'Editor John',
              roles: [ADMIN_ROLES.CONTENT_EDITOR],
              permissions: [...ROLE_PERMISSIONS_MAP[ADMIN_ROLES.CONTENT_EDITOR]],
              twoFactorEnabled: true,
            },
            'test-token',
          )
        }
      >
        Set Editor Session
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext and RBAC State Machine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes as unauthenticated and updates state on setSession and logout', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('admin-name')).toHaveTextContent('none');

    // Sign in as Content Editor
    act(() => {
      screen.getByText('Set Editor Session').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('admin-name')).toHaveTextContent('Editor John');

    // Check permissions: Content Editor has course:publish, but NOT order:refund
    expect(screen.getByTestId('perm-course-publish')).toHaveTextContent('yes');
    expect(screen.getByTestId('perm-order-refund')).toHaveTextContent('no');
    expect(screen.getByTestId('role-super')).toHaveTextContent('no');

    // Logout
    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('admin-name')).toHaveTextContent('none');
  });
});
