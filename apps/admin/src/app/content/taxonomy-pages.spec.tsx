import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoriesPage from './categories/page';
import InstructorsPage from './instructors/page';
import TopicsPage from './topics/page';
import AuthorsPage from './authors/page';
import { adminApiClient } from '../../lib/api-client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/content/categories',
}));

// Mock useAuth
jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      id: 'admin-1',
      name: 'Super Admin',
      roles: ['super_admin'],
      permissions: [
        'course:read',
        'course:write',
        'topic:read',
        'topic:write',
        'author:read',
        'author:write',
      ],
    },
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

// Spy on adminApiClient
jest.mock('../../lib/api-client', () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Admin Taxonomy Content Studio Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CategoriesPage (CS8)', () => {
    const mockCategories = [
      {
        _id: 'cat-1',
        name: 'Fundraising',
        slug: 'fundraising',
        order: 1,
        iconUrl: 'https://example.com/icon.svg',
      },
    ];

    it('renders categories list from API', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockCategories);

      render(<CategoriesPage />);

      expect(screen.getByText('Course Categories (CS8)')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Fundraising')).toBeInTheDocument();
      });
      expect(screen.getByText('fundraising')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('opens create modal, auto-generates slug, and creates category', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce([]);
      (adminApiClient.post as jest.Mock).mockResolvedValueOnce({
        _id: 'cat-2',
        name: 'Product Growth',
      });

      render(<CategoriesPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Category/i }));

      expect(screen.getByRole('heading', { name: 'Create Category' })).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Category Name/i);
      fireEvent.change(nameInput, { target: { value: 'Product Growth' } });

      const slugInput = screen.getByLabelText(/Slug/i);
      expect((slugInput as HTMLInputElement).value).toBe('product-growth');

      fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/course-categories', {
          name: 'Product Growth',
          slug: 'product-growth',
          order: 1,
          iconUrl: undefined,
        });
      });
    });

    it('confirms and deletes category', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockCategories);
      (adminApiClient.delete as jest.Mock).mockResolvedValueOnce({ success: true });

      render(<CategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText('Fundraising')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByLabelText('Delete Fundraising');
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/Are you sure you want to delete category/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Delete Category' }));

      await waitFor(() => {
        expect(adminApiClient.delete).toHaveBeenCalledWith('/admin/course-categories/cat-1');
      });
    });
  });

  describe('InstructorsPage (CS9)', () => {
    const mockInstructors = [
      {
        _id: 'inst-1',
        name: 'Paul Graham',
        title: 'Partner at YC',
        bio: 'Founder of Y Combinator',
        avatarUrl: 'https://example.com/avatar.jpg',
        links: ['https://paulgraham.com'],
      },
    ];

    it('renders instructors list from API', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockInstructors);

      render(<InstructorsPage />);

      expect(screen.getByText('Instructors (CS9)')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Paul Graham')).toBeInTheDocument();
      });
      expect(screen.getByText('Partner at YC')).toBeInTheDocument();
      expect(screen.getByText('1 link')).toBeInTheDocument();
    });

    it('opens add instructor modal and posts new instructor', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce([]);
      (adminApiClient.post as jest.Mock).mockResolvedValueOnce({ _id: 'inst-2' });

      render(<InstructorsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Instructor/i }));

      expect(screen.getByRole('heading', { name: 'Add Instructor' })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'Sam Altman' },
      });
      fireEvent.change(screen.getByLabelText(/Title \/ Role/i), {
        target: { value: 'CEO of OpenAI' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Instructor/i }));

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/instructors', {
          name: 'Sam Altman',
          title: 'CEO of OpenAI',
          bio: undefined,
          avatarUrl: undefined,
          links: [],
        });
      });
    });

    it('confirms and deletes instructor', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockInstructors);
      (adminApiClient.delete as jest.Mock).mockResolvedValueOnce({ success: true });

      render(<InstructorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Paul Graham')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByLabelText('Delete Paul Graham');
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/Are you sure you want to delete instructor/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Delete Instructor' }));

      await waitFor(() => {
        expect(adminApiClient.delete).toHaveBeenCalledWith('/admin/instructors/inst-1');
      });
    });
  });

  describe('TopicsPage (CS15)', () => {
    const mockTopics = [
      {
        _id: 'top-1',
        name: 'Venture Capital',
        slug: 'venture-capital',
        order: 1,
        isTab: true,
        description: 'Venture investment insights',
      },
    ];

    it('renders topics list and tab status', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockTopics);

      render(<TopicsPage />);

      expect(screen.getByText('Startup World Topics (CS15)')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Venture Capital')).toBeInTheDocument();
      });
      expect(screen.getByText('venture-capital')).toBeInTheDocument();
      expect(screen.getByText('Tab Enabled')).toBeInTheDocument();
    });

    it('creates topic with tab toggled', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce([]);
      (adminApiClient.post as jest.Mock).mockResolvedValueOnce({ _id: 'top-2' });

      render(<TopicsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Topic/i }));

      fireEvent.change(screen.getByLabelText(/Topic Name/i), {
        target: { value: 'Product Market Fit' },
      });

      const checkbox = screen.getByLabelText(/Feature as top navigation tab/i);
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByRole('button', { name: /Create Topic/i }));

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/topics', {
          name: 'Product Market Fit',
          slug: 'product-market-fit',
          order: 1,
          isTab: true,
          description: undefined,
        });
      });
    });

    it('confirms and deletes topic', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockTopics);
      (adminApiClient.delete as jest.Mock).mockResolvedValueOnce({ success: true });

      render(<TopicsPage />);

      await waitFor(() => {
        expect(screen.getByText('Venture Capital')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByLabelText('Delete Venture Capital');
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/Are you sure you want to delete topic/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Delete Topic' }));

      await waitFor(() => {
        expect(adminApiClient.delete).toHaveBeenCalledWith('/admin/topics/top-1');
      });
    });
  });

  describe('AuthorsPage (CS16)', () => {
    const mockAuthors = [
      {
        _id: 'auth-1',
        name: 'Marc Andreessen',
        title: 'Partner at a16z',
        bio: 'Software is eating the world',
        avatarUrl: 'https://example.com/marc.jpg',
      },
    ];

    it('renders authors list from API', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockAuthors);

      render(<AuthorsPage />);

      expect(screen.getByText('Article Authors (CS16)')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Marc Andreessen')).toBeInTheDocument();
      });
      expect(screen.getByText('Partner at a16z')).toBeInTheDocument();
    });

    it('creates author through modal', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce([]);
      (adminApiClient.post as jest.Mock).mockResolvedValueOnce({ _id: 'auth-2' });

      render(<AuthorsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Author/i }));

      fireEvent.change(screen.getByLabelText(/Author Name/i), {
        target: { value: 'Ben Horowitz' },
      });
      fireEvent.change(screen.getByLabelText(/Title \/ Affiliation/i), {
        target: { value: 'Author of Hard Thing About Hard Things' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Author/i }));

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/authors', {
          name: 'Ben Horowitz',
          title: 'Author of Hard Thing About Hard Things',
          bio: undefined,
          avatarUrl: undefined,
        });
      });
    });

    it('confirms and deletes author', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValueOnce(mockAuthors);
      (adminApiClient.delete as jest.Mock).mockResolvedValueOnce({ success: true });

      render(<AuthorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Marc Andreessen')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByLabelText('Delete Marc Andreessen');
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/Are you sure you want to delete author/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Delete Author' }));

      await waitFor(() => {
        expect(adminApiClient.delete).toHaveBeenCalledWith('/admin/authors/auth-1');
      });
    });
  });
});
