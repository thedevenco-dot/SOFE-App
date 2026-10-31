import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoursesListPage from './page';
import CourseEditorPage from './[id]/page';
import { adminApiClient } from '../../lib/api-client';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/courses',
  useParams: () => ({ id: 'c1' }),
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      id: 'admin-1',
      name: 'Super Admin',
      roles: ['super_admin'],
      permissions: ['course:read', 'course:write', 'course:publish'],
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

describe('Admin Courses Management Pages (CS1, CS2, CS3, CS6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CoursesListPage (CS1)', () => {
    const mockCourses = [
      {
        _id: 'c1',
        title: 'Pre-Seed Fundraising Masterclass',
        slug: 'pre-seed-fundraising',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        priceInr: 499900,
        status: 'published',
        version: 2,
        categoryId: { _id: 'cat-1', name: 'Fundraising', slug: 'fundraising' },
        stats: {
          enrolledCount: 140,
          ratingAvg: 4.8,
          ratingCount: 22,
          lessonCount: 8,
          durationSec: 4800,
        },
      },
    ];

    it('renders courses list with status, price, and version', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/courses')) {
          return Promise.resolve({ items: mockCourses, total: 1 });
        }
        if (url.includes('/admin/course-categories')) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      render(<CoursesListPage />);

      expect(screen.getByText('Courses (CS1)')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Pre-Seed Fundraising Masterclass')).toBeInTheDocument();
      });
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
      expect(screen.getByText('₹4,999')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    it('opens quick create modal, fills title & category, and navigates to editor', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/course-categories')) {
          return Promise.resolve([{ _id: 'cat-1', name: 'Fundraising', slug: 'fundraising' }]);
        }
        return Promise.resolve({ items: [], total: 0 });
      });
      (adminApiClient.post as jest.Mock).mockResolvedValueOnce({
        _id: 'c2',
        title: 'Customer Discovery',
      });

      render(<CoursesListPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Course/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /New Course/i }));

      expect(screen.getByRole('heading', { name: 'Create New Course' })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Course Title/i), {
        target: { value: 'Customer Discovery' },
      });

      const slugInput = screen.getByLabelText(/URL Slug/i);
      expect((slugInput as HTMLInputElement).value).toBe('customer-discovery');

      fireEvent.change(screen.getByLabelText(/Category/i), {
        target: { value: 'cat-1' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Continue to Editor/i }));

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/courses', {
          title: 'Customer Discovery',
          slug: 'customer-discovery',
          categoryId: 'cat-1',
          priceInr: 0,
        });
        expect(mockPush).toHaveBeenCalledWith('/courses/c2');
      });
    });

    it('handles duplicate course action', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/courses')) {
          return Promise.resolve({ items: mockCourses, total: 1 });
        }
        return Promise.resolve([]);
      });
      (adminApiClient.post as jest.Mock).mockResolvedValueOnce({ _id: 'c1-copy' });

      render(<CoursesListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pre-Seed Fundraising Masterclass')).toBeInTheDocument();
      });

      const duplicateBtn = screen.getByLabelText('Duplicate Pre-Seed Fundraising Masterclass');
      fireEvent.click(duplicateBtn);

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/courses/c1/duplicate');
        expect(mockPush).toHaveBeenCalledWith('/courses/c1-copy');
      });
    });
  });

  describe('CourseEditorPage (CS2, CS3, CS6, Publish Checklist)', () => {
    const mockFullCourse = {
      _id: 'c1',
      title: 'Pre-Seed Fundraising',
      slug: 'pre-seed-fundraising',
      subtitle: 'How to close early stage rounds',
      descriptionHtml: 'A'.repeat(120),
      thumbnailUrl: 'https://example.com/thumb.jpg',
      categoryId: { _id: 'cat-1', name: 'Fundraising' },
      instructorIds: [{ _id: 'inst-1', name: 'Paul Graham' }],
      level: 'beginner',
      language: 'en',
      tags: ['fundraising'],
      priceInr: 0,
      status: 'draft',
      version: 1,
      modules: [
        {
          _id: 'm1',
          title: 'Section 1: Foundations',
          order: 0,
          lessonIds: ['l1', 'l2', 'l3'],
          lessons: [
            {
              _id: 'l1',
              title: 'Intro to Venture',
              type: 'video',
              status: 'published',
              isFreePreview: true,
            },
            {
              _id: 'l2',
              title: 'Cap Tables',
              type: 'reading',
              status: 'published',
              isFreePreview: false,
            },
            {
              _id: 'l3',
              title: 'Pitch Deck Review',
              type: 'video',
              status: 'published',
              isFreePreview: false,
            },
          ],
        },
      ],
    };

    it('loads course details and switches tabs', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/courses/c1/publish-checklist')) {
          return Promise.resolve({
            canPublish: true,
            checks: [
              { key: 'title_slug', label: 'Title and Slug configured', passed: true },
              {
                key: 'curriculum',
                label: 'At least 1 module and 3 published lessons',
                passed: true,
              },
            ],
          });
        }
        if (url.includes('/admin/courses/c1')) {
          return Promise.resolve(mockFullCourse);
        }
        if (url.includes('/admin/course-categories')) {
          return Promise.resolve([{ _id: 'cat-1', name: 'Fundraising' }]);
        }
        if (url.includes('/admin/instructors')) {
          return Promise.resolve([{ _id: 'inst-1', name: 'Paul Graham' }]);
        }
        return Promise.resolve([]);
      });

      render(<CourseEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Pre-Seed Fundraising')).toBeInTheDocument();
      });

      // Switch to Curriculum tab
      fireEvent.click(screen.getByText('2. Curriculum (CS3)'));
      expect(screen.getByText('Section 1: Foundations')).toBeInTheDocument();
      expect(screen.getByText('Intro to Venture')).toBeInTheDocument();

      // Switch to Pricing tab
      fireEvent.click(screen.getByText('3. Pricing & Access (CS6)'));
      expect(screen.getByText(/Pricing & In-App Purchase Access/i)).toBeInTheDocument();

      // Switch to Publish Checklist tab
      fireEvent.click(screen.getByText('4. Publish Checklist'));
      await waitFor(() => {
        expect(screen.getByText('Publishing Quality Checklist')).toBeInTheDocument();
        expect(screen.getByText('Title and Slug configured')).toBeInTheDocument();
      });
    });

    it('saves course metadata on Details tab', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/courses/c1')) return Promise.resolve(mockFullCourse);
        if (url.includes('/admin/course-categories'))
          return Promise.resolve([{ _id: 'cat-1', name: 'Fundraising' }]);
        if (url.includes('/admin/instructors'))
          return Promise.resolve([{ _id: 'inst-1', name: 'Paul Graham' }]);
        return Promise.resolve([]);
      });
      (adminApiClient.put as jest.Mock).mockResolvedValueOnce({
        ...mockFullCourse,
        title: 'Pre-Seed Fundraising Advanced',
      });

      render(<CourseEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Pre-Seed Fundraising')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/Course Title/i);
      fireEvent.change(titleInput, { target: { value: 'Pre-Seed Fundraising Advanced' } });

      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(adminApiClient.put).toHaveBeenCalledWith(
          '/admin/courses/c1',
          expect.objectContaining({
            title: 'Pre-Seed Fundraising Advanced',
          }),
        );
      });
    });
  });
});
