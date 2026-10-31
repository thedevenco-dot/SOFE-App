import { getOnboardingResumeRoute, LearnerProfileSnapshot } from './onboarding-resume';

describe('getOnboardingResumeRoute', () => {
  it('should route to /(onboarding)/profile when profile is null or empty', () => {
    expect(getOnboardingResumeRoute(null)).toBe('/(onboarding)/profile');
    expect(getOnboardingResumeRoute(undefined)).toBe('/(onboarding)/profile');
    expect(getOnboardingResumeRoute({})).toBe('/(onboarding)/profile');
    expect(getOnboardingResumeRoute({ name: '   ' })).toBe('/(onboarding)/profile');
  });

  it('should route to /(onboarding)/goals when name is present but goals/interests are missing', () => {
    const profile: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      interests: [],
      goals: [],
    };
    expect(getOnboardingResumeRoute(profile)).toBe('/(onboarding)/goals');
  });

  it('should route to /(onboarding)/personalise when interests exist without goals', () => {
    const profileWithInterests: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      interests: ['AI & Robotics'],
      goals: [],
    };
    expect(getOnboardingResumeRoute(profileWithInterests)).toBe('/(onboarding)/personalise');
  });

  it('should route to /(onboarding)/personalise when goals exist without personalisation', () => {
    const profileWithGoals: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      goals: ['Fundraising', 'B2B Sales'],
    };
    expect(getOnboardingResumeRoute(profileWithGoals)).toBe('/(onboarding)/personalise');
  });

  it('should treat blank manifestationWord as incomplete personalisation', () => {
    const profileBlankWord: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      goals: ['Fundraising'],
      manifestationWord: '   ',
    };
    expect(getOnboardingResumeRoute(profileBlankWord)).toBe('/(onboarding)/personalise');
  });

  it('should route to /(onboarding)/permissions when manifestation word is set', () => {
    const profileWithWord: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      goals: ['Fundraising'],
      manifestationWord: 'RELENTLESS',
    };
    expect(getOnboardingResumeRoute(profileWithWord)).toBe('/(onboarding)/permissions');
  });

  it('should route to /(onboarding)/permissions when quote is set', () => {
    const profileWithQuote: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      goals: ['Fundraising'],
      quote: {
        text: 'Action is key.',
        author: 'Pablo Picasso',
        source: 'library',
      },
    };
    expect(getOnboardingResumeRoute(profileWithQuote)).toBe('/(onboarding)/permissions');
  });

  it('should route to /(tabs)/home when onboardingCompletedAt is set as ISO string', () => {
    const completedProfile: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      goals: ['Fundraising'],
      manifestationWord: 'RELENTLESS',
      onboardingCompletedAt: '2026-10-30T10:00:00.000Z',
    };
    expect(getOnboardingResumeRoute(completedProfile)).toBe('/(tabs)/home');
  });

  it('should route to /(tabs)/home when onboardingCompletedAt is set as Date object', () => {
    const completedProfile: LearnerProfileSnapshot = {
      name: 'Rohan Mehta',
      goals: ['Fundraising'],
      manifestationWord: 'RELENTLESS',
      onboardingCompletedAt: new Date(),
    };
    expect(getOnboardingResumeRoute(completedProfile)).toBe('/(tabs)/home');
  });
});
