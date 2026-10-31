import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArticlesListPage from './page';
import ArticleEditorPage from './[id]/page';
import { adminApiClient } from '../../lib/api-client';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => '/articles',
  useParams: () => ({ id: 'art-1' }),
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      id: 'admin-1',
      name: 'Super Admin',
      roles: ['super_admin'],
      permissions: ['article:read', 'article:write', 'article:publish'],
    },
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

jest.mock('../../lib/api-client', () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Admin Articles Management (CS13, CS14)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArticles = [
    {
      id: 'art-1',
      title: 'Guide to Angel Investing & Syndicates',
      slug: 'guide-to-angel-investing',
      excerpt: 'How angel networks structure SAFEs and carried interest.',
      coverUrl: 'https://images.example.com/cover1.jpg',
      primaryTopicId: { _id: 'top-1', name: 'Fundraising', slug: 'fundraising' },
      authorId: { _id: 'aut-1', name: 'Naveen Jain', title: 'Managing Partner' },
      status: 'published',
      featured: true,
      readTimeMin: 6,
      publishedAt: '2026-10-15T10:00:00.000Z',
      stats: { views: 420, bookmarks: 42 },
    },
    {
      id: 'art-2',
      title: 'Building a High-Performance MVP',
      slug: 'building-high-performance-mvp',
      excerpt: 'Engineering discipline and architecture choices for early founders.',
      coverUrl: '',
      primaryTopicId: { _id: 'top-2', name: 'Product', slug: 'product' },
      authorId: { _id: 'aut-2', name: 'Priya Sharma', title: 'CTO' },
      status: 'draft',
      featured: false,
      readTimeMin: 4,
      stats: { views: 15, bookmarks: 2 },
    },
  ];

  const mockTopics = [
    { _id: 'top-1', name: 'Fundraising', slug: 'fundraising' },
    { _id: 'top-2', name: 'Product', slug: 'product' },
  ];

  const mockAuthors = [
    { _id: 'aut-1', name: 'Naveen Jain', title: 'Managing Partner' },
    { _id: 'aut-2', name: 'Priya Sharma', title: 'CTO' },
  ];

  describe('ArticlesListPage (/articles - CS13)', () => {
    it('should render articles table with topic and author columns', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
        if (url.includes('/admin/taxonomy/authors')) return Promise.resolve({ data: mockAuthors });
        return Promise.resolve({ data: mockArticles, meta: { total: 2 } });
      });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText('Guide to Angel Investing & Syndicates')).toBeInTheDocument();
        expect(screen.getByText('Building a High-Performance MVP')).toBeInTheDocument();
        expect(screen.getAllByText('Fundraising').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Naveen Jain').length).toBeGreaterThan(0);
      });
    });

    it('should filter articles by search query', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
        if (url.includes('/admin/taxonomy/authors')) return Promise.resolve({ data: mockAuthors });
        return Promise.resolve({ data: mockArticles, meta: { total: 2 } });
      });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText('Guide to Angel Investing & Syndicates')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search articles by title or slug...');
      fireEvent.change(searchInput, { target: { value: 'Angel' } });

      await waitFor(() => {
        expect(adminApiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=Angel'));
      });
    });

    it('should perform bulk action when rows are selected', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
        if (url.includes('/admin/taxonomy/authors')) return Promise.resolve({ data: mockAuthors });
        return Promise.resolve({ data: mockArticles, meta: { total: 2 } });
      });

      (adminApiClient.post as jest.Mock).mockResolvedValue({ success: true });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText('Guide to Angel Investing & Syndicates')).toBeInTheDocument();
      });

      // Select first row checkbox
      const rowCheckbox = screen.getByLabelText('Select Guide to Angel Investing & Syndicates');
      fireEvent.click(rowCheckbox);

      // Verify bulk action banner appears
      expect(screen.getByText('1 article(s) selected')).toBeInTheDocument();

      // Click Bulk Feature
      const bulkFeatureBtn = screen.getByText('Bulk Feature');
      fireEvent.click(bulkFeatureBtn);

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/articles/bulk', {
          ids: ['art-1'],
          action: 'feature',
        });
      });
    });
  });

  describe('ArticleEditorPage (/articles/[id] - CS14)', () => {
    const mockDetail = {
      _id: 'art-1',
      id: 'art-1',
      title: 'Guide to Angel Investing & Syndicates',
      slug: 'guide-to-angel-investing',
      excerpt: 'How angel networks structure SAFEs.',
      bodyHtml:
        '<h2>Overview</h2><p>Angel investing has transformed early stage venture in India.</p>',
      coverUrl: 'https://images.example.com/cover1.jpg',
      primaryTopicId: { _id: 'top-1', name: 'Fundraising', slug: 'fundraising' },
      topicIds: ['top-2'],
      authorId: { _id: 'aut-1', name: 'Naveen Jain', title: 'Managing Partner' },
      readTimeMin: 5,
      status: 'draft',
      featured: false,
      version: 1,
      tags: ['seed', 'angels'],
    };

    it('should render article editor fields, live preview, and save draft', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
        if (url.includes('/admin/taxonomy/authors')) return Promise.resolve({ data: mockAuthors });
        if (url.includes('/admin/articles/art-1')) return Promise.resolve(mockDetail);
        return Promise.resolve(null);
      });

      (adminApiClient.put as jest.Mock).mockResolvedValue({
        ...mockDetail,
        title: 'Guide to Angel Investing & Syndicates (Updated)',
      });

      render(<ArticleEditorPage />);

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('Guide to Angel Investing & Syndicates'),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('How angel networks structure SAFEs.')).toBeInTheDocument();
      });

      // Edit title
      const titleInput = screen.getByDisplayValue('Guide to Angel Investing & Syndicates');
      fireEvent.change(titleInput, {
        target: { value: 'Guide to Angel Investing & Syndicates (Updated)' },
      });

      // Click Save Draft
      const saveBtn = screen.getByText('Save Draft');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminApiClient.put).toHaveBeenCalledWith(
          '/admin/articles/art-1',
          expect.objectContaining({
            title: 'Guide to Angel Investing & Syndicates (Updated)',
          }),
        );
      });
    });

    it('should open mobile phone reader preview modal', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
        if (url.includes('/admin/taxonomy/authors')) return Promise.resolve({ data: mockAuthors });
        if (url.includes('/admin/articles/art-1')) return Promise.resolve(mockDetail);
        return Promise.resolve(null);
      });

      render(<ArticleEditorPage />);

      await waitFor(() => {
        expect(screen.getByText('Mobile Preview')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Mobile Preview'));

      expect(screen.getByText('STARTUP WORLD')).toBeInTheDocument();
      expect(screen.getByText('Close Preview')).toBeInTheDocument();
    });

    it('should publish article and update status', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/topics')) return Promise.resolve({ data: mockTopics });
        if (url.includes('/admin/taxonomy/authors')) return Promise.resolve({ data: mockAuthors });
        if (url.includes('/admin/articles/art-1')) return Promise.resolve(mockDetail);
        return Promise.resolve(null);
      });

      (adminApiClient.put as jest.Mock).mockResolvedValue(mockDetail);
      (adminApiClient.post as jest.Mock).mockResolvedValue({
        ...mockDetail,
        status: 'published',
        publishedAt: '2026-10-31T12:00:00Z',
        version: 2,
      });

      render(<ArticleEditorPage />);

      await waitFor(() => {
        expect(screen.getByText('Publish Now')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Publish Now'));

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/articles/art-1/publish');
      });
    });
  });
});
