import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NotificationsAdminPage from './page';
import PushComposerPage from './composer/page';
import { adminApiClient } from '../../lib/api-client';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({}),
  usePathname: () => '/notifications',
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      name: 'Admin',
      email: 'admin@sofe.io',
      roles: ['super_admin'],
      permissions: ['push:send'],
    },
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

jest.mock('../../lib/api-client', () => ({
  adminApiClient: {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Admin Notifications & Push Composer Pages (Task T3.10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Campaigns List Page', () => {
    it('renders empty state when no campaigns exist', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      render(<NotificationsAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('No push campaigns yet')).toBeInTheDocument();
      });
      expect(screen.getByText('Push Notification Campaigns')).toBeInTheDocument();
    });

    it('renders campaigns table when data is returned', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValue({
        items: [
          {
            id: 'camp_1',
            title: '🔥 Streak Alert',
            body: 'Protect your streak today!',
            segment: { type: 'all' },
            status: 'sent',
            sentAt: '2026-11-04T12:00:00.000Z',
            stats: { sent: 150, opened: 45, targeted: 200 },
          },
        ],
        total: 1,
      });

      render(<NotificationsAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('🔥 Streak Alert')).toBeInTheDocument();
      });
      expect(screen.getByText('Protect your streak today!')).toBeInTheDocument();
      expect(screen.getByText('150 sent')).toBeInTheDocument();
    });
  });

  describe('CS29 Push Composer Page', () => {
    it('renders composer form and live iPhone preview', () => {
      render(<PushComposerPage />);

      expect(screen.getByText('Push Campaign Composer')).toBeInTheDocument();
      expect(screen.getByText('Live iOS Lock Screen Preview')).toBeInTheDocument();
      expect(screen.getByText('Send Test to Me')).toBeInTheDocument();
    });

    it('sends test push via adminApiClient.post', async () => {
      (adminApiClient.post as jest.Mock).mockResolvedValue({ success: true, sent: 1 });

      render(<PushComposerPage />);

      // Fill in title
      const titleInput = screen.getByPlaceholderText(/Don't break your 5-day streak/i);
      fireEvent.change(titleInput, { target: { value: 'Test Push Title' } });

      // Fill in token
      const tokenInput = screen.getByPlaceholderText(/ExponentPushToken/i);
      fireEvent.change(tokenInput, { target: { value: 'ExponentPushToken[mock123]' } });

      // Click Send Test
      const sendTestBtn = screen.getByRole('button', { name: /Send Test/i });
      fireEvent.click(sendTestBtn);

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/push/test', {
          token: 'ExponentPushToken[mock123]',
          title: 'Test Push Title',
          body: expect.any(String),
          deepLink: undefined,
        });
      });
    });

    it('creates and dispatches campaign immediately', async () => {
      (adminApiClient.post as jest.Mock)
        .mockResolvedValueOnce({ id: 'camp_new_1' }) // create
        .mockResolvedValueOnce({ id: 'camp_new_1', status: 'sent' }); // dispatch

      render(<PushComposerPage />);

      const titleInput = screen.getByPlaceholderText(/Don't break your 5-day streak/i);
      fireEvent.change(titleInput, { target: { value: 'Weekend Drill' } });

      const bodyInput = screen.getByPlaceholderText(/Complete today’s 3-minute/i);
      fireEvent.change(bodyInput, { target: { value: 'Boost your skills this weekend!' } });

      const dispatchBtn = screen.getByRole('button', { name: /Dispatch Push Now/i });
      fireEvent.click(dispatchBtn);

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/push/campaigns', {
          title: 'Weekend Drill',
          body: 'Boost your skills this weekend!',
          deepLink: undefined,
          segment: { type: 'all' },
          scheduledAt: undefined,
        });
        expect(adminApiClient.post).toHaveBeenCalledWith(
          '/admin/push/campaigns/camp_new_1/dispatch',
        );
        expect(mockPush).toHaveBeenCalledWith('/notifications');
      });
    });
  });
});
