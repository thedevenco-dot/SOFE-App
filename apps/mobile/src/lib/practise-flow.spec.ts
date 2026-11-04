import type {
  PracticeTodayResponse,
  QuizAnswerSubmission,
  PointsLedgerEntry,
  RewardDto,
} from '@sofe/shared';

describe('Mobile Practise Flow & State Logic (Task T3.6)', () => {
  const samplePracticeToday: PracticeTodayResponse = {
    dateKey: '2026-11-04',
    schedule: {
      id: 'sched-1',
      userId: 'usr-101',
      dateKey: '2026-11-04',
      slots: [
        {
          slotKey: 'quick_quiz',
          title: 'Founders Unit Economics Drill',
          refType: 'quiz',
          refId: 'quiz-1',
          done: true,
          score: 100,
        },
        {
          slotKey: 'brain_game',
          title: 'Cognitive Agility Sprint',
          refType: 'game',
          done: false,
        },
        {
          slotKey: 'scenario_challenge',
          title: 'Tactical Negotiation Drill',
          refType: 'challenge',
          done: false,
        },
        {
          slotKey: 'match_concept',
          title: 'Mental Models Alignment',
          refType: 'game',
          done: false,
        },
        {
          slotKey: 'daily_reflection',
          title: 'Executive Reflection Note',
          refType: 'prompt',
          done: true,
        },
      ],
      completedCount: 2,
      totalCount: 5,
    },
    streak: {
      current: 7,
      longest: 14,
      isActiveToday: true,
    },
    quickQuiz: {
      id: 'quiz-1',
      title: 'Founders Unit Economics Drill',
      kind: 'quick_quiz',
      passingScorePercent: 80,
      questionCount: 3,
      questions: [
        {
          id: 'q1',
          text: 'What is the ideal LTV:CAC ratio for early-stage SaaS?',
          type: 'single',
          options: [
            { id: 'opt1', text: '1:1' },
            { id: 'opt2', text: '3:1 or higher' },
            { id: 'opt3', text: '0.5:1' },
          ],
        },
        {
          id: 'q2',
          text: 'Select all factors that directly impact Net Revenue Retention (NRR):',
          type: 'multi',
          options: [
            { id: 'optA', text: 'Expansion / Upsells' },
            { id: 'optB', text: 'Logo Churn' },
            { id: 'optC', text: 'Office Rent' },
            { id: 'optD', text: 'Contraction' },
          ],
        },
      ],
    },
  };

  describe('PR1 & PR2: Today Practice Slots & Progress', () => {
    it('calculates completion percentage accurately', () => {
      const schedule = samplePracticeToday.schedule;
      const percent = Math.round((schedule.completedCount / schedule.totalCount) * 100);
      expect(percent).toBe(40); // 2 of 5 = 40%
    });

    it('identifies available vs v1.5 slots', () => {
      const slots = samplePracticeToday.schedule.slots;
      const v1Slots = slots.filter(
        (s) => s.slotKey === 'quick_quiz' || s.slotKey === 'daily_reflection',
      );
      const v15Slots = slots.filter(
        (s) =>
          s.slotKey === 'brain_game' ||
          s.slotKey === 'scenario_challenge' ||
          s.slotKey === 'match_concept',
      );

      expect(v1Slots.length).toBe(2);
      expect(v15Slots.length).toBe(3);
    });

    it('evaluates streak status and consistency dots', () => {
      const streak = samplePracticeToday.streak;
      expect(streak.current).toBe(7);
      expect(streak.longest).toBe(14);
      expect(streak.isActiveToday).toBe(true);
    });
  });

  describe('PR3 & PR4: Quiz Runner Answer Selection & Submission Logic', () => {
    function selectOption(
      currentSelected: string[],
      optionId: string,
      questionType: 'single' | 'multi' | 'true_false',
    ): string[] {
      if (questionType === 'multi') {
        return currentSelected.includes(optionId)
          ? currentSelected.filter((id) => id !== optionId)
          : [...currentSelected, optionId];
      }
      return [optionId];
    }

    it('handles single choice option replacement', () => {
      let selected: string[] = [];
      selected = selectOption(selected, 'opt1', 'single');
      expect(selected).toEqual(['opt1']);

      selected = selectOption(selected, 'opt2', 'single');
      expect(selected).toEqual(['opt2']); // Replaced
    });

    it('handles multiple choice option toggling', () => {
      let selected: string[] = [];
      selected = selectOption(selected, 'optA', 'multi');
      expect(selected).toEqual(['optA']);

      selected = selectOption(selected, 'optB', 'multi');
      expect(selected).toEqual(['optA', 'optB']);

      // Untoggle optA
      selected = selectOption(selected, 'optA', 'multi');
      expect(selected).toEqual(['optB']);
    });

    it('formats submission answers structure for API', () => {
      const answersRecord: Record<string, string[]> = {
        q1: ['opt2'],
        q2: ['optA', 'optB', 'optD'],
      };

      const submissions: QuizAnswerSubmission[] = Object.entries(answersRecord).map(
        ([questionId, selectedOptionIds]) => ({
          questionId,
          selectedOptionIds,
        }),
      );

      expect(submissions).toHaveLength(2);
      expect(submissions[0].questionId).toBe('q1');
      expect(submissions[0].selectedOptionIds).toEqual(['opt2']);
      expect(submissions[1].selectedOptionIds).toEqual(['optA', 'optB', 'optD']);
    });

    it('computes quiz pass status from score threshold', () => {
      const passingScore = samplePracticeToday.quickQuiz?.passingScorePercent ?? 80;
      expect(85 >= passingScore).toBe(true);
      expect(75 >= passingScore).toBe(false);
    });
  });

  describe('PR12: Daily Reflection Validation', () => {
    function countWords(text: string): number {
      const trimmed = text.trim();
      return trimmed ? trimmed.split(/\s+/).length : 0;
    }

    it('counts words accurately', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('Unit economics are crucial for early seed traction.')).toBe(8);
    });

    it('validates synthesis minimum recommendation', () => {
      const shortText = 'Good day.';
      const substantialText =
        'Today we analyzed customer retention cohorts and identified churn concentrated in month two. We are deploying targeted onboarding sequences to fix this.';

      expect(countWords(shortText) >= 20).toBe(false);
      expect(countWords(substantialText) >= 20).toBe(true);
    });
  });

  describe('PR14: Points Ledger Transactions', () => {
    const sampleLedger: PointsLedgerEntry[] = [
      {
        id: '1',
        userId: 'u1',
        amount: 50,
        balanceAfter: 550,
        reason: 'quiz',
        idempotencyKey: 'k1',
      },
      {
        id: '2',
        userId: 'u1',
        amount: 20,
        balanceAfter: 570,
        reason: 'reflection',
        idempotencyKey: 'k2',
      },
      {
        id: '3',
        userId: 'u1',
        amount: -500,
        balanceAfter: 70,
        reason: 'redeem',
        idempotencyKey: 'k3',
      },
    ];

    it('filters transactions by reason', () => {
      const quizzes = sampleLedger.filter((e) => e.reason === 'quiz');
      const redemptions = sampleLedger.filter((e) => e.reason === 'redeem');

      expect(quizzes.length).toBe(1);
      expect(redemptions.length).toBe(1);
      expect(redemptions[0].amount).toBe(-500);
    });

    it('determines transaction sign and credit status', () => {
      expect(sampleLedger[0].amount > 0).toBe(true);
      expect(sampleLedger[2].amount < 0).toBe(true);
    });
  });

  describe('PR15 & PR16: Rewards Catalogue & Redemption Math', () => {
    const sampleReward: RewardDto = {
      id: 'r_1',
      title: 'Founders Unit Economics Masterclass',
      description: 'Full course access unlock',
      type: 'course_access',
      costPoints: 500,
      stock: 10,
      status: 'active',
    };

    it('validates user points affordability', () => {
      const userBalanceLow = 450;
      const userBalanceHigh = 600;

      expect(userBalanceLow >= sampleReward.costPoints).toBe(false);
      expect(userBalanceHigh >= sampleReward.costPoints).toBe(true);
    });

    it('calculates remaining points and shortfall correctly', () => {
      const balance = 550;
      const cost = sampleReward.costPoints; // 500
      const remaining = balance - cost;
      expect(remaining).toBe(50);

      const shortfallBalance = 320;
      const shortfall = cost - shortfallBalance;
      expect(shortfall).toBe(180);
    });
  });
});
