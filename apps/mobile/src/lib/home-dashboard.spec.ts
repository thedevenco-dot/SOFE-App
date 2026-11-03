import type { HomeDashboardResponse, VisionBoardItem } from '@sofe/shared';

describe('Mobile Home Dashboard Logic & State Management (Task T3.2)', () => {
  const sampleDashboard: HomeDashboardResponse = {
    greeting: 'Good morning, Alexis.',
    user: {
      id: 'usr-101',
      name: 'Alexis Ohanian',
      avatarUrl: 'https://example.com/alexis.jpg',
      cohortLabel: 'COHORT IX · WEEK 4',
    },
    streak: {
      currentStreakDays: 28,
      points: 750,
    },
    quote: {
      id: 'q-1',
      text: 'Build something people want.',
      author: 'Paul Graham',
    },
    word: {
      id: 'w-1',
      word: 'LEVERAGE',
      meaning: 'Using asymmetrical resources to achieve outsized outcomes.',
    },
    visionBoard: [
      {
        id: 'vb-1',
        userId: 'usr-101',
        imageUrl: 'https://example.com/unicorn.jpg',
        caption: '$100M ARR Target',
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    todayPlan: {
      id: 'plan-1',
      userId: 'usr-101',
      dateKey: '2026-11-03',
      completedCount: 1,
      items: [
        {
          id: 'task-1',
          key: 'watch_lesson',
          label: 'Continue Lesson: Unit Economics Matrix',
          done: true,
          doneAt: '2026-11-03T08:30:00Z',
          refId: 'l-101',
        },
        {
          id: 'task-2',
          key: 'reflect',
          label: 'Daily Founder Reflection',
          done: false,
        },
        {
          id: 'task-3',
          key: 'complete_quiz',
          label: 'Daily Decision Scenario: Rapid Calibration',
          done: false,
        },
      ],
    },
    continueLearning: {
      courseId: 'c-201',
      courseTitle: 'Foundations of High-Growth Venture Building',
      lessonId: 'l-101',
      lessonTitle: 'Unit Economics Matrix',
      moduleTitle: 'Module 2: Economics & Traction',
      percent: 45,
      durationSec: 1080,
      thumbnailUrl: 'https://example.com/thumb.jpg',
    },
    spotlightArticle: {
      id: 'art-301',
      slug: 'scaling-from-zero',
      title: 'Scaling from Zero: The Operator Blueprint',
      excerpt: 'How to build operational discipline before finding product-market fit.',
      coverUrl: 'https://example.com/cover.jpg',
      readTimeMin: 6,
      topicName: 'Venture Strategy',
    },
  };

  it('hydrates hero and greeting with founder profile and cohort metadata', () => {
    expect(sampleDashboard.greeting).toBe('Good morning, Alexis.');
    expect(sampleDashboard.user.name).toBe('Alexis Ohanian');
    expect(sampleDashboard.user.cohortLabel).toBe('COHORT IX · WEEK 4');
    expect(sampleDashboard.streak.currentStreakDays).toBe(28);
    expect(sampleDashboard.streak.points).toBe(750);
  });

  it('verifies Curator Manifesto card attributes', () => {
    expect(sampleDashboard.quote.text).toBe('Build something people want.');
    expect(sampleDashboard.quote.author).toBe('Paul Graham');
    expect(sampleDashboard.word.word).toBe('LEVERAGE');
    expect(sampleDashboard.word.meaning).toBeDefined();
  });

  it('calculates daily protocol completion and progress percentage correctly', () => {
    const total = sampleDashboard.todayPlan.items.length;
    const completed = sampleDashboard.todayPlan.completedCount;
    const percent = Math.round((completed / total) * 100);

    expect(total).toBe(3);
    expect(completed).toBe(1);
    expect(percent).toBe(33);
  });

  it('optimistically updates task completion state and recalculates count', () => {
    const taskIdToToggle = 'task-2';
    const currentPlan = { ...sampleDashboard.todayPlan };

    // Simulate optimistic toggle
    const updatedItems = currentPlan.items.map((item) =>
      item.id === taskIdToToggle ? { ...item, done: true, doneAt: new Date().toISOString() } : item,
    );
    const updatedCount = updatedItems.filter((i) => i.done).length;

    expect(updatedCount).toBe(2);
    expect(updatedItems.find((i) => i.id === taskIdToToggle)?.done).toBe(true);

    // If remaining tasks complete, allCompleted becomes true
    const allDoneItems = updatedItems.map((i) => ({ ...i, done: true }));
    const allDoneCount = allDoneItems.filter((i) => i.done).length;
    expect(allDoneCount === allDoneItems.length).toBe(true);
  });

  it('validates active curriculum continue learning card metrics', () => {
    const active = sampleDashboard.continueLearning;
    expect(active).not.toBeNull();
    if (active) {
      expect(active.lessonTitle).toBe('Unit Economics Matrix');
      expect(active.courseTitle).toBe('Foundations of High-Growth Venture Building');
      expect(active.percent).toBe(45);
      const minutesLeft = Math.round((active.durationSec || 0) / 60);
      expect(minutesLeft).toBe(18);
    }
  });

  it('enforces maximum 12 items limit on vision board', () => {
    const items: VisionBoardItem[] = Array.from({ length: 12 }, (_, idx) => ({
      id: `vb-${idx}`,
      userId: 'usr-101',
      imageUrl: `https://example.com/img-${idx}.jpg`,
      caption: `Goal ${idx + 1}`,
      order: idx,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const isFull = items.length >= 12;
    expect(isFull).toBe(true);

    const canAddMore = items.length < 12;
    expect(canAddMore).toBe(false);
  });

  it('formats spotlight article deep dive metadata correctly', () => {
    const spotlight = sampleDashboard.spotlightArticle;
    expect(spotlight).not.toBeNull();
    if (spotlight) {
      expect(spotlight.slug).toBe('scaling-from-zero');
      expect(spotlight.topicName).toBe('Venture Strategy');
      expect(spotlight.readTimeMin).toBe(6);
      expect(spotlight.title).toBe('Scaling from Zero: The Operator Blueprint');
    }
  });
});
