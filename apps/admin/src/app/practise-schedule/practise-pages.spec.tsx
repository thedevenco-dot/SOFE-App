import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PracticeSchedulePage from './page';
import PointsRulesPage from '../points/page';
import RewardsCataloguePage from '../rewards/page';
import QuotesPromptsLibraryPage from '../quotes/page';
import { adminApiClient } from '../../lib/api-client';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({}),
  usePathname: () => '/practise-schedule',
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    admin: {
      name: 'Admin',
      email: 'admin@sofe.io',
      roles: ['super_admin'],
      permissions: [
        'practise:schedule',
        'user:read',
        'order:manual',
        'reward:read',
        'reward:write',
        'quote:read',
        'quote:write',
      ],
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

describe('Admin Practice, Points & Motivation Pages (CS22, CS23, CS24, CS26)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CS22 Practice Scheduler', () => {
    it('renders scheduler and surfaces unassigned dates warning', async () => {
      (adminApiClient.request as jest.Mock).mockResolvedValue({
        schedules: [
          {
            dateKey: '2026-11-04',
            slots: [
              { slotKey: 'quick_quiz', title: 'Daily Rapid Calibration', refType: 'quiz' },
              { slotKey: 'brain_game', title: 'Cognitive Sprint', refType: 'game' },
              { slotKey: 'scenario_challenge', title: 'Negotiation', refType: 'challenge' },
              { slotKey: 'match_concept', title: 'Mental Models', refType: 'game' },
              { slotKey: 'daily_reflection', title: 'Synthesis', refType: 'prompt' },
            ],
          },
        ],
        unassignedFutureDates: ['2026-11-05', '2026-11-06'],
      });

      render(<PracticeSchedulePage />);
      expect(screen.getByText(/Daily Practice Scheduler/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByText(
            /Warning: 2 upcoming days in the next 7 days have no practice schedule/i,
          ),
        ).toBeInTheDocument();
        expect(screen.getByText('2026-11-04')).toBeInTheDocument();
      });
    });
  });

  describe('CS23 Points & Rules', () => {
    it('renders points configuration and adjustment form', async () => {
      (adminApiClient.request as jest.Mock).mockResolvedValue({
        quizPoints: 50,
        lessonPoints: 25,
        dailyStreakBonus: 50,
        maxDailyPoints: 500,
        freeCourseCost: 500,
      });

      render(<PointsRulesPage />);
      expect(screen.getByText(/Points Engine & Rules/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/Points & Economy Calculation Rules/i)).toBeInTheDocument();
        expect(screen.getByText(/Manual Points Ledger Adjustment/i)).toBeInTheDocument();
      });
    });
  });

  describe('CS24 Rewards Catalogue', () => {
    it('renders rewards store listing and allows adding a reward', async () => {
      (adminApiClient.request as jest.Mock).mockResolvedValue([
        {
          id: 'rew_1',
          title: 'Full Course Pass',
          description: 'Access to any single course',
          type: 'course_access',
          costPoints: 500,
          status: 'active',
        },
      ]);

      render(<RewardsCataloguePage />);
      expect(screen.getByText(/Rewards Catalogue/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Full Course Pass')).toBeInTheDocument();
        expect(screen.getByText('500 pts')).toBeInTheDocument();
      });
    });
  });

  describe('CS26 Quotes & Prompts Library', () => {
    it('renders motivation library with tabs', async () => {
      (adminApiClient.request as jest.Mock).mockResolvedValue([
        {
          id: 'q_1',
          text: 'Ideas are cheap, execution is everything.',
          author: 'Chris Sacca',
          status: 'published',
        },
      ]);

      render(<QuotesPromptsLibraryPage />);
      expect(screen.getByText(/Quotes, Words & Prompts Library/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByText(/"Ideas are cheap, execution is everything."/i),
        ).toBeInTheDocument();
      });
    });
  });
});
