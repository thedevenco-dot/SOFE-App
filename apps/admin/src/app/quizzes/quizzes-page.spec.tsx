import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import QuizzesListPage from './page';
import QuizEditorPage from './[id]/page';
import CsvImportPage from './import/page';
import { adminApiClient } from '../../lib/api-client';

const mockPush = jest.fn();
let mockParams = { id: 'new' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
  usePathname: () => '/quizzes',
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      name: 'Admin',
      email: 'admin@sofe.io',
      roles: ['super_admin'],
      permissions: ['quiz:read', 'quiz:write'],
    },
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

jest.mock('../../lib/api-client', () => ({
  adminApiClient: {
    request: jest.fn(),
  },
}));

describe('Admin Quizzes Pages (CS17, CS18, CS19)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { id: 'new' };
  });

  describe('CS17 Quizzes List', () => {
    it('renders quizzes list page and displays items', async () => {
      (adminApiClient.request as jest.Mock).mockResolvedValue({
        items: [
          {
            id: 'quiz_1',
            title: 'Founders Unit Economics Drill',
            kind: 'quick_quiz',
            passingScorePercent: 80,
            questionCount: 5,
            status: 'published',
          },
        ],
      });

      render(<QuizzesListPage />);
      expect(screen.getByText(/Quizzes & Question Bank/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Founders Unit Economics Drill')).toBeInTheDocument();
        expect(screen.getAllByText('Quick Quiz').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('CS18 Quiz Editor', () => {
    it('renders editor for new quiz with question builder', () => {
      render(<QuizEditorPage />);
      expect(screen.getByText(/Create Quiz & Question Bank/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Unit Economics & CAC Rapid Calibration/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Add Question/i)).toBeInTheDocument();
    });

    it('enforces 3-question minimum gate when publishing', async () => {
      render(<QuizEditorPage />);

      const titleInput = screen.getByPlaceholderText(/Unit Economics & CAC Rapid Calibration/i);
      fireEvent.change(titleInput, { target: { value: 'Short Quiz' } });

      const statusSelect = screen.getByDisplayValue('Draft');
      fireEvent.change(statusSelect, { target: { value: 'published' } });

      const saveBtn = screen.getByRole('button', { name: /Save Quiz/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Publishing requires at least 3 questions in the quiz/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('CS19 CSV Import', () => {
    it('renders CSV import page and dry-run validation', async () => {
      (adminApiClient.request as jest.Mock).mockResolvedValue({
        totalRows: 3,
        validRows: 3,
        errorRows: 0,
        quizzesDetected: 1,
        errors: [],
        preview: [
          {
            quizTitle: 'Unit Economics',
            questionText: 'Prompt 1',
            type: 'single',
            optionsCount: 3,
            correctCount: 1,
          },
        ],
      });

      render(<CsvImportPage />);
      expect(screen.getByText(/CSV Quiz Import & Dry Run/i)).toBeInTheDocument();

      const dryRunBtn = screen.getByRole('button', { name: /Dry-Run Validation/i });
      fireEvent.click(dryRunBtn);

      await waitFor(() => {
        expect(screen.getByText(/Dry-Run Validation Results/i)).toBeInTheDocument();
      });
    });
  });
});
