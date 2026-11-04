import {
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_RULE_TYPES,
  type AchievementTier,
  type AchievementRuleType,
} from '@sofe/shared';

export interface SeedAchievementItem {
  key: string;
  title: string;
  description: string;
  iconUrl: string;
  tier: AchievementTier;
  rule: {
    type: AchievementRuleType;
    threshold: number;
  };
  status: 'active' | 'inactive';
  order: number;
}

export const SEED_ACHIEVEMENTS: SeedAchievementItem[] = [
  {
    key: 'seven_day_streak',
    title: '7-Day Streak',
    description: 'Maintain an unbroken 7-day daily learning streak.',
    iconUrl: 'https://assets.sofe.app/badges/streak-7.svg',
    tier: ACHIEVEMENT_TIERS.GOLD,
    rule: {
      type: ACHIEVEMENT_RULE_TYPES.STREAK_DAYS,
      threshold: 7,
    },
    status: 'active',
    order: 1,
  },
  {
    key: 'three_day_streak',
    title: '3-Day Momentum',
    description: 'Complete 3 consecutive days of practice drills or lessons.',
    iconUrl: 'https://assets.sofe.app/badges/streak-3.svg',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    rule: {
      type: ACHIEVEMENT_RULE_TYPES.STREAK_DAYS,
      threshold: 3,
    },
    status: 'active',
    order: 2,
  },
  {
    key: 'quiz_master',
    title: 'Quiz Master',
    description: 'Score 80% or higher on 5 founder practice quizzes.',
    iconUrl: 'https://assets.sofe.app/badges/quiz-master.svg',
    tier: ACHIEVEMENT_TIERS.SILVER,
    rule: {
      type: ACHIEVEMENT_RULE_TYPES.QUIZZES_COMPLETED,
      threshold: 5,
    },
    status: 'active',
    order: 3,
  },
  {
    key: 'top_10_percent_learner',
    title: 'Top 10% Founder',
    description: 'Rank among the top 10% most dedicated learners by video lesson watch time.',
    iconUrl: 'https://assets.sofe.app/badges/top-learner.svg',
    tier: ACHIEVEMENT_TIERS.GOLD,
    rule: {
      type: ACHIEVEMENT_RULE_TYPES.LEARNING_TIME_PERCENTILE,
      threshold: 90,
    },
    status: 'active',
    order: 4,
  },
  {
    key: 'first_drill',
    title: 'First Step',
    description: 'Complete your very first practice micro-drill or quick quiz.',
    iconUrl: 'https://assets.sofe.app/badges/first-drill.svg',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    rule: {
      type: ACHIEVEMENT_RULE_TYPES.QUIZZES_COMPLETED,
      threshold: 1,
    },
    status: 'active',
    order: 5,
  },
  {
    key: 'course_finisher',
    title: 'Course Finisher',
    description: 'Complete all required lessons in a course curriculum.',
    iconUrl: 'https://assets.sofe.app/badges/course-finisher.svg',
    tier: ACHIEVEMENT_TIERS.GOLD,
    rule: {
      type: ACHIEVEMENT_RULE_TYPES.COURSES_COMPLETED,
      threshold: 1,
    },
    status: 'active',
    order: 6,
  },
];
