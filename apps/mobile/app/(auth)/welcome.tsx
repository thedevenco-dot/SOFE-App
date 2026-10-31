import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/Button';

interface Slide {
  id: number;
  tagline: string;
  title: string;
  description: string;
}

const CAROUSEL_SLIDES: Slide[] = [
  {
    id: 1,
    tagline: 'CURATED PLAYBOOKS',
    title: 'Master the Art of Building',
    description:
      'Structured curriculum, tactical playbooks, and honest case studies from founders who have walked the path.',
  },
  {
    id: 2,
    tagline: 'DAILY PRACTICE',
    title: 'Deliberate Founder Habits',
    description:
      'Sharpen execution instincts with 5-minute daily challenges, scenario quizzes, and streak rewards.',
  },
  {
    id: 3,
    tagline: 'PEER ECOSYSTEM',
    title: 'Build, Launch, & Lead',
    description:
      'Gain clarity on term sheets, customer validation, and scale alongside ambitious peers.',
  },
];

export default function WelcomeScreen() {
  const { colors, palette, spacing } = useTheme();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const activeSlide = CAROUSEL_SLIDES[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < CAROUSEL_SLIDES.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      router.push('/(auth)/sign-in');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      {/* Top Header with Skip */}
      <View style={styles.topBar}>
        <Text
          style={[typography.micro, { color: palette.orange, letterSpacing: 2, fontWeight: '700' }]}
        >
          SOFE
        </Text>
        <TouchableOpacity
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[typography.caption, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        <View
          style={[
            styles.taglineBadge,
            {
              backgroundColor: 'rgba(255, 132, 41, 0.12)',
              borderColor: 'rgba(255, 132, 41, 0.25)',
            },
          ]}
        >
          <Text
            style={[
              typography.micro,
              { color: palette.orange, fontWeight: '700', letterSpacing: 1 },
            ]}
          >
            {activeSlide.tagline}
          </Text>
        </View>

        <Text
          style={[
            typography.display,
            { color: colors.text, textAlign: 'center', marginTop: spacing.lg },
          ]}
        >
          {activeSlide.title}
        </Text>

        <Text
          style={[
            typography.body,
            { color: colors.textMuted, marginTop: spacing.md, textAlign: 'center', lineHeight: 24 },
          ]}
        >
          {activeSlide.description}
        </Text>

        {/* Carousel Indicator Dots */}
        <View style={[styles.dotsContainer, { marginTop: spacing.xxl }]}>
          {CAROUSEL_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <TouchableOpacity
                key={slide.id}
                onPress={() => setCurrentSlideIndex(idx)}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? palette.orange : colors.border,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button variant="primary" size="lg" onPress={handleNext}>
          {currentSlideIndex === CAROUSEL_SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Button>

        <Button
          variant="ghost"
          size="md"
          onPress={() => router.replace('/(tabs)/home')}
          style={{ marginTop: spacing.sm }}
        >
          Explore as Guest
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  slideContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  taglineBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    width: '100%',
  },
});
