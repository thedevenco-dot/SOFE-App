import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Chip } from '../../src/components/Chip';
import { Button } from '../../src/components/Button';
import { useLearnerAuth } from '../../src/lib/learner-auth-context';

const GOAL_OPTIONS = [
  'Idea Validation',
  'Pre-Seed Fundraising',
  'B2B Sales & GTM',
  'Product Design & MVP',
  'Growth & Marketing',
  'Unit Economics & Pricing',
  'Leadership & Hiring',
  'Term Sheets & Cap Tables',
  'Building in Public',
  'Customer Discovery',
];

export default function GoalsScreen() {
  const { colors, palette, spacing } = useTheme();
  const { user, updateProfile } = useLearnerAuth();

  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    user?.goals && user.goals.length > 0 ? user.goals : ['Idea Validation', 'Pre-Seed Fundraising'],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleGoal = (goal: string) => {
    setError(null);
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleNext = async () => {
    if (selectedGoals.length === 0) {
      setError('Please select at least 1 goal to customize your daily curriculum.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        goals: selectedGoals,
        interests: selectedGoals,
      });
      router.push('/(onboarding)/personalise');
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.xl }}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={[typography.micro, { color: palette.orange, letterSpacing: 2, fontWeight: '700' }]}
        >
          STEP 2 OF 4
        </Text>
        <Text style={[typography.title1, { color: colors.text, marginTop: spacing.xs }]}>
          What are you building?
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Choose the topics and competencies you want to master first.
        </Text>
      </View>

      {/* Chip Grid */}
      <View style={styles.gridContainer}>
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = selectedGoals.includes(goal);
          return (
            <Chip
              key={goal}
              label={goal}
              selected={isSelected}
              onPress={() => toggleGoal(goal)}
              style={{ marginBottom: spacing.sm, marginRight: spacing.sm }}
            />
          );
        })}
      </View>

      {/* Selection Summary & Error */}
      <View style={{ marginVertical: spacing.lg }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {selectedGoals.length} {selectedGoals.length === 1 ? 'goal' : 'goals'} selected
        </Text>

        {error && (
          <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
            {error}
          </Text>
        )}
      </View>

      {/* Next Button */}
      <Button
        variant="primary"
        size="lg"
        onPress={handleNext}
        loading={loading}
        disabled={selectedGoals.length === 0}
      >
        Continue to Personalise
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});
