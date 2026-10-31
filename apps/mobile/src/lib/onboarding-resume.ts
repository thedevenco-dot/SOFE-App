export interface LearnerProfileSnapshot {
  id?: string;
  name?: string;
  avatarUrl?: string;
  headline?: string;
  interests?: string[];
  goals?: string[];
  manifestationWord?: string;
  quote?: {
    text: string;
    author?: string;
    source: 'library' | 'custom';
  };
  onboardingCompletedAt?: string | Date | null;
}

export type OnboardingRoute =
  | '/(tabs)/home'
  | '/(onboarding)/profile'
  | '/(onboarding)/goals'
  | '/(onboarding)/personalise'
  | '/(onboarding)/permissions';

/**
 * Calculates the exact route a learner should resume at based on their profile data.
 * If onboarding has been completed, returns the main Home dashboard.
 * Otherwise, returns the first incomplete onboarding step (ON5 -> ON6 -> ON7 -> ON8).
 */
export function getOnboardingResumeRoute(profile?: LearnerProfileSnapshot | null): OnboardingRoute {
  if (!profile) {
    return '/(onboarding)/profile';
  }

  // 1. If user already finished onboarding, go straight to Home (HM1)
  if (profile.onboardingCompletedAt) {
    return '/(tabs)/home';
  }

  // 2. Step 1 of onboarding (ON5): Name is mandatory
  if (!profile.name || profile.name.trim().length === 0) {
    return '/(onboarding)/profile';
  }

  // 3. Step 2 of onboarding (ON6): At least 1 goal or interest required
  const hasGoals = Array.isArray(profile.goals) && profile.goals.length > 0;
  const hasInterests = Array.isArray(profile.interests) && profile.interests.length > 0;
  if (!hasGoals && !hasInterests) {
    return '/(onboarding)/goals';
  }

  // 4. Step 3 of onboarding (ON7): Personalisation (word or quote)
  const hasWord = !!profile.manifestationWord && profile.manifestationWord.trim().length > 0;
  const hasQuote = !!profile.quote && !!profile.quote.text;
  if (!hasWord && !hasQuote) {
    return '/(onboarding)/personalise';
  }

  // 5. Step 4 of onboarding (ON8): Permissions & plan confirmation
  return '/(onboarding)/permissions';
}
