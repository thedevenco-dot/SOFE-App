import React, { createContext, useContext, useEffect, useState } from 'react';
import { tokenStorage } from './secure-store';
import { api } from './api-client';
import {
  getOnboardingResumeRoute,
  LearnerProfileSnapshot,
  OnboardingRoute,
} from './onboarding-resume';

export interface LearnerAuthContextValue {
  user: LearnerProfileSnapshot | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  phoneToVerify: string | null;
  setPhoneToVerify: (phone: string | null) => void;
  verifyPhoneOtp: (code: string) => Promise<OnboardingRoute>;
  signInWithGoogle: () => Promise<OnboardingRoute>;
  signInWithApple: () => Promise<OnboardingRoute>;
  signInDemo: (
    scenario?: 'new' | 'mid_goals' | 'mid_personalise' | 'completed',
  ) => Promise<OnboardingRoute>;
  updateProfile: (data: Partial<LearnerProfileSnapshot>) => Promise<LearnerProfileSnapshot>;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<LearnerProfileSnapshot | null>;
}

const LearnerAuthContext = createContext<LearnerAuthContextValue | null>(null);

const STORAGE_KEY_USER_PROFILE = 'sofe_learner_profile';

export function LearnerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LearnerProfileSnapshot | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [phoneToVerify, setPhoneToVerify] = useState<string | null>(null);

  // Initialize from SecureStore / Local state on mount
  useEffect(() => {
    async function initSession() {
      try {
        const storedToken = await tokenStorage.getAuthToken();
        const storedProfile = await tokenStorage.getItem(STORAGE_KEY_USER_PROFILE);

        if (storedToken) {
          setToken(storedToken);
          if (storedProfile) {
            try {
              setUser(JSON.parse(storedProfile));
            } catch {
              // Ignore JSON parse failure
            }
          }

          // Fetch fresh profile from API
          try {
            const apiRes = await api.get<LearnerProfileSnapshot>('/me');
            if (apiRes) {
              setUser(apiRes);
              await tokenStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(apiRes));
            }
          } catch {
            // Local fallback retained if offline
          }
        }
      } catch {
        // Failed session initialization
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  const saveSession = async (authToken: string, profile: LearnerProfileSnapshot) => {
    setToken(authToken);
    setUser(profile);
    await tokenStorage.setAuthToken(authToken);
    await tokenStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
  };

  const updateProfile = async (
    data: Partial<LearnerProfileSnapshot>,
  ): Promise<LearnerProfileSnapshot> => {
    const updated = { ...(user || {}), ...data };
    setUser(updated);
    await tokenStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(updated));

    try {
      const res = await api.patch<LearnerProfileSnapshot>('/me', data);
      if (res) {
        setUser(res);
        await tokenStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(res));
        return res;
      }
    } catch {
      // Offline fallback: updated state already persisted locally
    }

    return updated;
  };

  const verifyPhoneOtp = async (code: string): Promise<OnboardingRoute> => {
    if (code.length !== 6) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    const mockToken = `learner-token-${phoneToVerify || 'phone'}-${Date.now()}`;
    const newProfile: LearnerProfileSnapshot = user || {
      id: `usr-${Date.now()}`,
      name: '',
      interests: [],
      goals: [],
    };

    await saveSession(mockToken, newProfile);
    return getOnboardingResumeRoute(newProfile);
  };

  const signInWithGoogle = async (): Promise<OnboardingRoute> => {
    const mockToken = `google-learner-token-${Date.now()}`;
    const profile: LearnerProfileSnapshot = {
      id: `usr-google-${Date.now()}`,
      name: 'Google Founder',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      interests: [],
      goals: [],
    };

    await saveSession(mockToken, profile);
    return getOnboardingResumeRoute(profile);
  };

  const signInWithApple = async (): Promise<OnboardingRoute> => {
    const mockToken = `apple-learner-token-${Date.now()}`;
    const profile: LearnerProfileSnapshot = {
      id: `usr-apple-${Date.now()}`,
      name: 'Apple Founder',
      interests: [],
      goals: [],
    };

    await saveSession(mockToken, profile);
    return getOnboardingResumeRoute(profile);
  };

  const signInDemo = async (
    scenario: 'new' | 'mid_goals' | 'mid_personalise' | 'completed' = 'new',
  ): Promise<OnboardingRoute> => {
    const mockToken = `demo-token-${scenario}-${Date.now()}`;
    let profile: LearnerProfileSnapshot;

    switch (scenario) {
      case 'new':
        profile = {
          id: 'demo-new-1',
          name: '',
          interests: [],
          goals: [],
        };
        break;
      case 'mid_goals':
        profile = {
          id: 'demo-mid-1',
          name: 'Sarah Connor',
          headline: 'Robotics & AI Founder',
          interests: [],
          goals: [],
        };
        break;
      case 'mid_personalise':
        profile = {
          id: 'demo-mid-2',
          name: 'Sarah Connor',
          headline: 'Robotics & AI Founder',
          goals: ['Fundraising', 'B2B Sales'],
          interests: ['AI', 'Robotics'],
        };
        break;
      case 'completed':
        profile = {
          id: 'demo-completed-1',
          name: 'Sarah Connor',
          headline: 'Robotics & AI Founder',
          goals: ['Fundraising', 'B2B Sales'],
          interests: ['AI', 'Robotics'],
          manifestationWord: 'RELENTLESS',
          quote: {
            text: 'Action is the foundational key to all success.',
            author: 'Pablo Picasso',
            source: 'library',
          },
          onboardingCompletedAt: new Date().toISOString(),
        };
        break;
    }

    await saveSession(mockToken, profile);
    return getOnboardingResumeRoute(profile);
  };

  const completeOnboarding = async (): Promise<void> => {
    const completedAt = new Date().toISOString();
    await updateProfile({ onboardingCompletedAt: completedAt });
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    setPhoneToVerify(null);
    await tokenStorage.removeAuthToken();
    await tokenStorage.removeItem(STORAGE_KEY_USER_PROFILE);
  };

  const refreshUser = async (): Promise<LearnerProfileSnapshot | null> => {
    try {
      const res = await api.get<LearnerProfileSnapshot>('/me');
      if (res) {
        setUser(res);
        await tokenStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(res));
        return res;
      }
    } catch {
      // Return cached user
    }
    return user;
  };

  const value: LearnerAuthContextValue = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    phoneToVerify,
    setPhoneToVerify,
    verifyPhoneOtp,
    signInWithGoogle,
    signInWithApple,
    signInDemo,
    updateProfile,
    completeOnboarding,
    signOut,
    refreshUser,
  };

  return <LearnerAuthContext.Provider value={value}>{children}</LearnerAuthContext.Provider>;
}

export function useLearnerAuth(): LearnerAuthContextValue {
  const context = useContext(LearnerAuthContext);
  if (!context) {
    throw new Error('useLearnerAuth must be used within a LearnerAuthProvider');
  }
  return context;
}
