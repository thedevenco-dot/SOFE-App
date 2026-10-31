import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LessonsListPage from './page';
import LessonEditorPage from './[id]/page';
import VideoStatusPage from '../media/videos/page';
import { adminApiClient } from '../../lib/api-client';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: mockBack,
  }),
  usePathname: () => '/lessons',
  useParams: () => ({ id: 'les-1' }),
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      id: 'admin-1',
      name: 'Super Admin',
      roles: ['super_admin'],
      permissions: ['lesson:read', 'lesson:write', 'course:read', 'course:write'],
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

describe('Admin Lessons & Video Status (CS4, CS5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LessonsListPage (/lessons)', () => {
    const mockLessons = [
      {
        id: 'les-1',
        title: 'Pitching to Angel Investors',
        courseId: 'c1',
        courseTitle: 'Fundraising Masterclass',
        moduleId: 'm1',
        moduleTitle: 'Module 1: Angels',
        type: 'video',
        status: 'published',
        durationSec: 420,
        isFreePreview: true,
        isRequired: true,
      },
      {
        id: 'les-2',
        title: 'SAFE Notes Reading Guide',
        courseId: 'c1',
        courseTitle: 'Fundraising Masterclass',
        moduleId: 'm1',
        moduleTitle: 'Module 1: Angels',
        type: 'reading',
        status: 'draft',
        durationSec: 300,
        isFreePreview: false,
        isRequired: true,
      },
    ];

    const mockCourses = [
      {
        _id: 'c1',
        title: 'Fundraising Masterclass',
        modules: [{ _id: 'm1', title: 'Module 1: Angels' }],
      },
    ];

    it('should render lessons list and filter options', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/courses')) {
          return Promise.resolve({ data: mockCourses });
        }
        if (url.includes('/admin/lessons')) {
          return Promise.resolve({ data: mockLessons, meta: { total: 2 } });
        }
        return Promise.resolve({ data: [] });
      });

      render(<LessonsListPage />);

      await waitFor(() => {
        expect(screen.getByText(/Lessons & Video Library/i)).toBeInTheDocument();
        expect(screen.getByText('Pitching to Angel Investors')).toBeInTheDocument();
        expect(screen.getByText('SAFE Notes Reading Guide')).toBeInTheDocument();
      });
    });

    it('should filter lessons by search and type', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/courses')) return Promise.resolve({ data: mockCourses });
        return Promise.resolve({ data: mockLessons, meta: { total: 2 } });
      });

      render(<LessonsListPage />);

      await waitFor(() => {
        expect(screen.getByText('Pitching to Angel Investors')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search lessons by title...');
      fireEvent.change(searchInput, { target: { value: 'Pitching' } });

      await waitFor(() => {
        expect(adminApiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=Pitching'));
      });
    });

    it('should open create modal and submit a new lesson', async () => {
      (adminApiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/admin/courses')) return Promise.resolve({ data: mockCourses });
        return Promise.resolve({ data: mockLessons, meta: { total: 2 } });
      });

      (adminApiClient.post as jest.Mock).mockResolvedValue({
        id: 'new-les-3',
        _id: 'new-les-3',
        title: 'Cap Table Modeling',
      });

      render(<LessonsListPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Lesson')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Lesson'));
      expect(screen.getByText('Create New Lesson')).toBeInTheDocument();

      // Fill in modal
      const courseSelect = screen.getByLabelText(/Target Course/i);
      fireEvent.change(courseSelect, { target: { value: 'c1' } });

      const titleInput = screen.getByLabelText(/Lesson Title/i);
      fireEvent.change(titleInput, { target: { value: 'Cap Table Modeling' } });

      const submitBtn = screen.getByText('Create & Open Editor');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(adminApiClient.post).toHaveBeenCalledWith('/admin/lessons', {
          courseId: 'c1',
          moduleId: 'm1',
          title: 'Cap Table Modeling',
          type: 'video',
          status: 'draft',
        });
        expect(mockPush).toHaveBeenCalledWith('/lessons/new-les-3');
      });
    });
  });

  describe('LessonEditorPage (/lessons/[id])', () => {
    const mockLessonDetail = {
      _id: 'les-1',
      id: 'les-1',
      title: 'Pitching to Angel Investors',
      type: 'video',
      status: 'draft',
      durationSec: 420,
      isFreePreview: true,
      isRequired: true,
      courseId: 'c1',
      moduleId: 'm1',
      course: { id: 'c1', title: 'Fundraising Masterclass', slug: 'fundraising' },
      module: { id: 'm1', title: 'Module 1: Angels' },
      video: {
        mux: {
          assetId: 'asset-123',
          playbackId: 'pb-123',
          status: 'ready',
        },
      },
    };

    it('should render lesson details, Mux video preview, and save changes', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValue(mockLessonDetail);
      (adminApiClient.put as jest.Mock).mockResolvedValue({
        ...mockLessonDetail,
        title: 'Pitching to Angel Investors (Updated)',
        status: 'published',
      });

      render(<LessonEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Pitching to Angel Investors')).toBeInTheDocument();
        expect(screen.getByText('Course: Fundraising Masterclass')).toBeInTheDocument();
        expect(screen.getByText('ready')).toBeInTheDocument();
        expect(screen.getByText('pb-123')).toBeInTheDocument();
      });

      // Update title
      const titleInput = screen.getByDisplayValue('Pitching to Angel Investors');
      fireEvent.change(titleInput, { target: { value: 'Pitching to Angel Investors (Updated)' } });

      // Save
      const saveBtn = screen.getByText('Save Lesson');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminApiClient.put).toHaveBeenCalledWith(
          '/admin/lessons/les-1',
          expect.objectContaining({
            title: 'Pitching to Angel Investors (Updated)',
            type: 'video',
          }),
        );
      });
    });

    it('should switch between lesson types (Reading / Resource)', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValue(mockLessonDetail);

      render(<LessonEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Pitching to Angel Investors')).toBeInTheDocument();
      });

      // Click Reading type button
      const readingBtn = screen.getByText('Reading / Article');
      fireEvent.click(readingBtn);

      await waitFor(() => {
        expect(screen.getByText('Reading Content & Formatted Text')).toBeInTheDocument();
        expect(screen.getByLabelText('Body HTML')).toBeInTheDocument();
      });

      // Click Resource type button
      const resourceBtn = screen.getByText('Resource & Files');
      fireEvent.click(resourceBtn);

      await waitFor(() => {
        expect(screen.getByText('Downloadable Files & Links')).toBeInTheDocument();
        expect(screen.getByText('Add Resource')).toBeInTheDocument();
      });
    });
  });

  describe('VideoStatusPage (/media/videos)', () => {
    const mockAssets = [
      {
        id: 'les-1',
        sourceType: 'lesson',
        title: 'Pitching to Angel Investors',
        courseId: 'c1',
        courseTitle: 'Fundraising Masterclass',
        moduleId: 'm1',
        moduleTitle: 'Module 1',
        assetId: 'asset-123',
        playbackId: 'pb-123',
        status: 'ready',
        durationSec: 420,
        isFreePreview: true,
        updatedAt: '2026-10-31T12:00:00.000Z',
      },
    ];

    it('should render video assets datatable with Mux playback IDs and status badges', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValue({
        data: mockAssets,
        meta: { total: 1 },
      });

      render(<VideoStatusPage />);

      await waitFor(() => {
        expect(screen.getByText(/Video Processing & Mux Assets/i)).toBeInTheDocument();
        expect(screen.getByText('Pitching to Angel Investors')).toBeInTheDocument();
        expect(screen.getByText('pb-123')).toBeInTheDocument();
        expect(screen.getByText('ready')).toBeInTheDocument();
      });
    });

    it('should open and close video preview modal', async () => {
      (adminApiClient.get as jest.Mock).mockResolvedValue({
        data: mockAssets,
        meta: { total: 1 },
      });

      render(<VideoStatusPage />);

      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Preview'));

      expect(screen.getByText('Open in Lesson Editor')).toBeInTheDocument();
    });
  });
});
