export const QUIZ_KINDS = {
  QUICK_QUIZ: 'quick_quiz',
  LESSON_QUIZ: 'lesson_quiz',
} as const;

export type QuizKind = (typeof QUIZ_KINDS)[keyof typeof QUIZ_KINDS];

export const QUIZ_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type QuizStatus = (typeof QUIZ_STATUSES)[keyof typeof QUIZ_STATUSES];

export const QUESTION_TYPES = {
  SINGLE: 'single',
  MULTI: 'multi',
  TRUE_FALSE: 'true_false',
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export const PRACTICE_SLOT_KEYS = {
  QUICK_QUIZ: 'quick_quiz',
  BRAIN_GAME: 'brain_game',
  SCENARIO_CHALLENGE: 'scenario_challenge',
  MATCH_CONCEPT: 'match_concept',
  DAILY_REFLECTION: 'daily_reflection',
} as const;

export type PracticeSlotKey = (typeof PRACTICE_SLOT_KEYS)[keyof typeof PRACTICE_SLOT_KEYS];

export const PRACTICE_REF_TYPES = {
  QUIZ: 'quiz',
  GAME: 'game',
  CHALLENGE: 'challenge',
  PROMPT: 'prompt',
} as const;

export type PracticeRefType = (typeof PRACTICE_REF_TYPES)[keyof typeof PRACTICE_REF_TYPES];

export const PRACTICE_ATTEMPT_STATUSES = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type PracticeAttemptStatus =
  (typeof PRACTICE_ATTEMPT_STATUSES)[keyof typeof PRACTICE_ATTEMPT_STATUSES];

export const POINTS_LEDGER_REASONS = {
  QUIZ: 'quiz',
  GAME: 'game',
  CHALLENGE: 'challenge',
  MATCH: 'match',
  REFLECTION: 'reflection',
  LESSON: 'lesson',
  STREAK_BONUS: 'streak_bonus',
  REDEEM: 'redeem',
  ADMIN_ADJUST: 'admin_adjust',
  REFUND_REVERSAL: 'refund_reversal',
} as const;

export type PointsLedgerReason = (typeof POINTS_LEDGER_REASONS)[keyof typeof POINTS_LEDGER_REASONS];

export const REWARD_TYPES = {
  COURSE_ACCESS: 'course_access',
  COUPON: 'coupon',
  BADGE: 'badge',
} as const;

export type RewardType = (typeof REWARD_TYPES)[keyof typeof REWARD_TYPES];

export const REWARD_REDEMPTION_STATUSES = {
  COMPLETED: 'completed',
  REVERSED: 'reversed',
} as const;

export type RewardRedemptionStatus =
  (typeof REWARD_REDEMPTION_STATUSES)[keyof typeof REWARD_REDEMPTION_STATUSES];

export const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
} as const;

export type AchievementTier = (typeof ACHIEVEMENT_TIERS)[keyof typeof ACHIEVEMENT_TIERS];

export const ACHIEVEMENT_RULE_TYPES = {
  STREAK_DAYS: 'streak_days',
  QUIZZES_COMPLETED: 'quizzes_completed',
  LEARNING_TIME_PERCENTILE: 'learning_time_percentile',
  COURSES_COMPLETED: 'courses_completed',
  MANUAL: 'manual',
} as const;

export type AchievementRuleType =
  (typeof ACHIEVEMENT_RULE_TYPES)[keyof typeof ACHIEVEMENT_RULE_TYPES];

export const DAILY_PLAN_TASK_KEYS = {
  WATCH_LESSON: 'watch_lesson',
  COMPLETE_QUIZ: 'complete_quiz',
  READ_ARTICLE: 'read_article',
  WORK_PROJECT: 'work_project',
  REFLECT: 'reflect',
} as const;

export type DailyPlanTaskKey = (typeof DAILY_PLAN_TASK_KEYS)[keyof typeof DAILY_PLAN_TASK_KEYS];

export const GAME_TYPES = {
  MATCH_CONCEPT: 'match_concept',
  MEMORY: 'memory',
  SEQUENCE: 'sequence',
  SPEED: 'speed',
} as const;

export type GameType = (typeof GAME_TYPES)[keyof typeof GAME_TYPES];
