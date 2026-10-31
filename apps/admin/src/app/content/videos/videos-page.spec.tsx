import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StandaloneVideosPage from './page';
import { adminApiClient } from '../../../lib/api-client';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useParams: () => ({}),
  usePathname: () => '/content/videos',
}));

// Mock Auth Context
jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      name: 'Super Admin',
      email: 'admin@sofe.org',
      roles: ['super_admin'],
      permissions: ['media:read', 'media:write'],
    },
    hasPermission: () => true,
    hasRole: () => true,
    logout: jest.fn(),
  }),
}));

// Mock API Client
jest.mock('../../../lib/api-client', () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Admin Standalone Videos Management (CS12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVideos = [
    {
      id: 'vid-1',
      title: 'Finding Product-Market Fit',
      slug: 'finding-product-market-fit',
      description: 'Customer interviews and iteration loops.',
      thumbnailUrl: 'https://images.example.com/fit.jpg',
      mux: {
        assetId: 'mux-1',
        playbackId: 'mux-pb-1',
        status: 'ready',
      },
      durationSec: 720,
      topicIds: [{ _id: 'top-1', name: 'Product', slug: 'product' }],
      isFree: true,
      status: 'published',
      publishedAt: '2026-10-18T10:00:00.000Z',
    },
    {
      id: 'vid-2',
      title: 'Fundraising Term Sheet Masterclass',
      slug: 'fundraising-term-sheet',
      description: 'Liquidation preference and anti-dilution.',
      thumbnailUrl: 'https://images.example.com/terms.jpg',
      mux: {
        assetId: 'mux-2',
        playbackId: 'mux-pb-2',
        status: 'processing',
      },
      durationSec: 1200,
      topicIds: [{ _id: 'top-2', name: 'Fundraising', slug: 'fundraising' }],
      isFree: false,
      status: 'draft',
    },
  ];

  const mockTopics = [
    { _id: 'top-1', name: 'Product', slug: 'product' },
    { _id: 'top-2', name: 'Fundraising', slug: 'fundraising' },
  ];

  it('should render standalone videos table with Mux stream status and duration', async () => {
    (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
      return Promise.resolve({ data: mockVideos, meta: { total: 2 } });
    });

    render(<StandaloneVideosPage />);

    await waitFor(() => {
      expect(screen.getByText('Finding Product-Market Fit')).toBeInTheDocument();
      expect(screen.getByText('Fundraising Term Sheet Masterclass')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
      expect(screen.getByText('20:00')).toBeInTheDocument();
    });
  });

  it('should open Add Video modal and trigger Mux direct upload', async () => {
    (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
      return Promise.resolve({ data: mockVideos, meta: { total: 2 } });
    });
    (adminApiClient.post as jest.Mock).mockResolvedValue({
      data: { uploadUrl: 'https://mux.com/upload/direct', assetId: 'mux-asset-new' },
    });

    render(<StandaloneVideosPage />);

    await waitFor(() => {
      expect(screen.getByText('Finding Product-Market Fit')).toBeInTheDocument();
    });

    const addBtn = screen.getByText('Add Video');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Add Standalone Video')).toBeInTheDocument();
    });

    const uploadBtn = screen.getByText('Direct Upload to Mux');
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Mux Playback ID')).not.toHaveValue('');
    });
  });

  it('should open video playback preview modal when clicking play button', async () => {
    (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
      return Promise.resolve({ data: mockVideos, meta: { total: 2 } });
    });

    render(<StandaloneVideosPage />);

    await waitFor(() => {
      expect(screen.getByText('Finding Product-Market Fit')).toBeInTheDocument();
    });

    const playButtons = screen.getAllByTitle('Play Preview');
    fireEvent.click(playButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Mux Playback Stream Ready')).toBeInTheDocument();
      expect(screen.getByText(/Playback ID: mux-pb-1/)).toBeInTheDocument();
    });
  });
});
