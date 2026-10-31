import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BooksListPage from './page';
import BookEditorPage from './[id]/page';
import { adminApiClient } from '../../lib/api-client';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams = { id: 'new' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useParams: () => mockParams,
  usePathname: () => '/books',
}));

// Mock Auth Context
jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      name: 'Super Admin',
      email: 'admin@sofe.org',
      roles: ['super_admin'],
      permissions: ['course:read', 'course:write', 'course:publish'],
    },
    hasPermission: () => true,
    hasRole: () => true,
    logout: jest.fn(),
  }),
}));

// Mock API Client
jest.mock('../../lib/api-client', () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Admin Books Management (CS10, CS11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBooks = [
    {
      id: 'book-1',
      title: 'Zero to One',
      slug: 'zero-to-one',
      author: 'Peter Thiel',
      coverUrl: 'https://images.example.com/zero.jpg',
      format: 'summary',
      categoryId: { _id: 'cat-1', name: 'Startups & Strategy', slug: 'startups' },
      isFree: true,
      status: 'published',
      publishedAt: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'book-2',
      title: 'Venture Deals',
      slug: 'venture-deals',
      author: 'Brad Feld',
      coverUrl: 'https://images.example.com/venture.jpg',
      format: 'pdf',
      categoryId: { _id: 'cat-2', name: 'Fundraising', slug: 'fundraising' },
      isFree: false,
      priceInr: 499,
      status: 'draft',
    },
  ];

  const mockCategories = [
    { _id: 'cat-1', name: 'Startups & Strategy', slug: 'startups' },
    { _id: 'cat-2', name: 'Fundraising', slug: 'fundraising' },
  ];

  describe('BooksListPage (/books - CS10)', () => {
    it('should render books table with format and pricing columns', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/categories'))
          return Promise.resolve({ data: mockCategories });
        return Promise.resolve({ data: mockBooks, meta: { total: 2 } });
      });

      render(<BooksListPage />);

      await waitFor(() => {
        expect(screen.getByText('Zero to One')).toBeInTheDocument();
        expect(screen.getByText('Venture Deals')).toBeInTheDocument();
        expect(screen.getByText('by Peter Thiel')).toBeInTheDocument();
        expect(screen.getAllByText('PDF').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Summary').length).toBeGreaterThan(0);
        expect(screen.getByText('₹499')).toBeInTheDocument();
      });
    });

    it('should filter books by search query', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/categories'))
          return Promise.resolve({ data: mockCategories });
        return Promise.resolve({ data: mockBooks, meta: { total: 2 } });
      });

      render(<BooksListPage />);

      await waitFor(() => {
        expect(screen.getByText('Zero to One')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search books by title or author...');
      fireEvent.change(searchInput, { target: { value: 'Thiel' } });

      await waitFor(() => {
        expect(adminApiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=Thiel'));
      });
    });

    it('should perform bulk action when rows are selected', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/categories'))
          return Promise.resolve({ data: mockCategories });
        return Promise.resolve({ data: mockBooks, meta: { total: 2 } });
      });
      (adminApiClient.post as jest.Mock).mockResolvedValue({ success: true, modifiedCount: 2 });

      render(<BooksListPage />);

      await waitFor(() => {
        expect(screen.getByText('Zero to One')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first book

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeInTheDocument();
      });

      const archiveBtn = screen.getByText('Archive');
      fireEvent.click(archiveBtn);

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith(
          '/admin/books/bulk',
          expect.objectContaining({ action: 'archive', ids: ['book-1'] }),
        );
      });
    });
  });

  describe('BookEditorPage (/books/[id] - CS11)', () => {
    it('should render book editor fields, format switch, and create book', async () => {
      mockParams = { id: 'new' };
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/taxonomy/categories'))
          return Promise.resolve({ data: mockCategories });
        return Promise.resolve({});
      });
      (adminApiClient.post as jest.Mock).mockResolvedValue({
        _id: 'new-book-id',
        id: 'new-book-id',
      });

      render(<BookEditorPage />);

      const titleInput = screen.getByPlaceholderText('e.g. Zero to One: Notes on Startups');
      const authorInput = screen.getByPlaceholderText('e.g. Peter Thiel with Blake Masters');
      const coverInput = screen.getByPlaceholderText('https://images.example.com/cover.jpg');

      fireEvent.change(titleInput, { target: { value: 'Blitzscaling' } });
      fireEvent.change(authorInput, { target: { value: 'Reid Hoffman' } });
      fireEvent.change(coverInput, { target: { value: 'https://images.example.com/blitz.jpg' } });

      const saveDraftBtn = screen.getByText('Save Draft');
      fireEvent.click(saveDraftBtn);

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith(
          '/admin/books',
          expect.objectContaining({
            title: 'Blitzscaling',
            slug: 'blitzscaling',
            author: 'Reid Hoffman',
            format: 'summary',
          }),
        );
      });
    });

    it('should switch format to PDF and require PDF file URL', async () => {
      mockParams = { id: 'new' };
      (adminApiClient.get as jest.Mock).mockResolvedValue({ data: mockCategories });

      render(<BookEditorPage />);

      const pdfButton = screen.getByText('Downloadable PDF');
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(screen.getByText('PDF File URL')).toBeInTheDocument();
      });
    });
  });
});
