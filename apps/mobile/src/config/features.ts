/**
 * Feature flags for the SOFE Mobile app.
 * Matches specifications in docs/PRD.md and docs/PAGES.md.
 */
export const features = {
  /**
   * Network tab and social features (v1.5).
   * Hidden in v1 by default per PRD.md and PAGES.md.
   */
  networkEnabled: false,

  /**
   * Brain games and scenario challenges (v1.5).
   */
  brainGamesEnabled: false,

  /**
   * Course reviews (v1.5).
   */
  courseReviewsEnabled: false,
} as const;

export type FeatureKey = keyof typeof features;
