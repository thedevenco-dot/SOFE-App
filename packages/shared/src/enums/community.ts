export const VISIBILITIES = {
  PUBLIC: 'public',
  FOLLOWERS: 'followers',
  PRIVATE: 'private',
} as const;

export type Visibility = (typeof VISIBILITIES)[keyof typeof VISIBILITIES];

export const PROJECT_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

export const POST_TYPES = {
  POST: 'post',
  ARTICLE: 'article',
  PROJECT: 'project',
  POLL: 'poll',
} as const;

export type PostType = (typeof POST_TYPES)[keyof typeof POST_TYPES];

export const POST_STATUSES = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  REMOVED: 'removed',
} as const;

export type PostStatus = (typeof POST_STATUSES)[keyof typeof POST_STATUSES];

export const COMMENT_TARGET_TYPES = {
  POST: 'post',
  ARTICLE: 'article',
} as const;

export type CommentTargetType = (typeof COMMENT_TARGET_TYPES)[keyof typeof COMMENT_TARGET_TYPES];

export const LIKE_TARGET_TYPES = {
  POST: 'post',
  COMMENT: 'comment',
} as const;

export type LikeTargetType = (typeof LIKE_TARGET_TYPES)[keyof typeof LIKE_TARGET_TYPES];

export const REPORT_TARGET_TYPES = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user',
} as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[keyof typeof REPORT_TARGET_TYPES];

export const REPORT_REASONS = {
  SPAM: 'spam',
  ABUSE: 'abuse',
  MISINFORMATION: 'misinformation',
  OTHER: 'other',
} as const;

export type ReportReason = (typeof REPORT_REASONS)[keyof typeof REPORT_REASONS];

export const REPORT_STATUSES = {
  OPEN: 'open',
  DISMISSED: 'dismissed',
  ACTIONED: 'actioned',
} as const;

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

export const REPORT_ACTIONS = {
  REMOVED: 'removed',
  WARNED: 'warned',
  SUSPENDED: 'suspended',
} as const;

export type ReportAction = (typeof REPORT_ACTIONS)[keyof typeof REPORT_ACTIONS];

export const LEAD_SOURCES = {
  FRAMER_FORM: 'framer_form',
  IN_APP: 'in_app',
  WEBINAR: 'webinar',
  REFERRAL: 'referral',
  MANUAL: 'manual',
  IMPORT: 'import',
} as const;

export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];

export const LEAD_STAGES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  DEMO: 'demo',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost',
} as const;

export type LeadStage = (typeof LEAD_STAGES)[keyof typeof LEAD_STAGES];

export const LEAD_ACTIVITY_TYPES = {
  NOTE: 'note',
  CALL: 'call',
  EMAIL: 'email',
  TASK: 'task',
  STAGE_CHANGE: 'stage_change',
} as const;

export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[keyof typeof LEAD_ACTIVITY_TYPES];

export const SUPPORT_TICKET_STATUSES = {
  OPEN: 'open',
  PENDING: 'pending',
  CLOSED: 'closed',
} as const;

export type SupportTicketStatus =
  (typeof SUPPORT_TICKET_STATUSES)[keyof typeof SUPPORT_TICKET_STATUSES];

export const LEGAL_DOCUMENT_TYPES = {
  TERMS: 'terms',
  PRIVACY: 'privacy',
} as const;

export type LegalDocumentType = (typeof LEGAL_DOCUMENT_TYPES)[keyof typeof LEGAL_DOCUMENT_TYPES];

export const HOME_CURATION_SLOTS = {
  FEATURED_COURSES: 'featured_courses',
  RECOMMENDED_COURSES: 'recommended_courses',
  FEATURED_ARTICLES: 'featured_articles',
  STARTUP_WORLD_HERO: 'startup_world_hero',
} as const;

export type HomeCurationSlot = (typeof HOME_CURATION_SLOTS)[keyof typeof HOME_CURATION_SLOTS];
