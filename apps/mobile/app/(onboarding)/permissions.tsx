import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Bell, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { useLearnerAuth } from '../../src/lib/learner-auth-context';

const REMINDER_TIMES = ['08:00 AM', '09:00 AM', '12:30 PM', '08:00 PM'];

const INITIAL_TASKS = [
  {
    id: '1',
    title: 'Watch Day 1: Finding an Unfair Advantage',
    category: 'Lesson',
    duration: '8 min',
  },
  { id: '2', title: 'Solve Rapid Decision Quiz #1', category: 'Quiz', duration: '3 min' },
  {
    id: '3',
    title: 'Read Playbook: Zero to First 100 Users',
    category: 'Playbook',
    duration: '5 min',
  },
  {
    id: '4',
    title: 'Outline Your Customer Problem Statement',
    category: 'Project',
    duration: '10 min',
  },
  {
    id: '5',
    title: 'Daily Founder Reflection: What worked today?',
    category: 'Reflection',
    duration: '2 min',
  },
];

export default function PermissionsScreen() {
  const { colors, palette, spacing, radius } = useTheme();
  const { completeOnboarding } = useLearnerAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      await completeOnboarding();
      router.replace('/(tabs)/home');
    } catch {
      setError('Failed to complete onboarding. Redirecting to home...');
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl * 2 }}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={[typography.micro, { color: palette.orange, letterSpacing: 2, fontWeight: '700' }]}
        >
          STEP 4 OF 4
        </Text>
        <Text style={[typography.title1, { color: colors.text, marginTop: spacing.xs }]}>
          Protect Your Daily Streak
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Founders win through consistency. Configure daily micro-reminders to stay accountable.
        </Text>
      </View>

      {/* Notifications Card */}
      <Card
        style={[
          styles.permissionCard,
          {
            backgroundColor: colors.surface,
            borderColor: notificationsEnabled ? palette.orange : colors.border,
            borderWidth: 1,
            marginBottom: spacing.xl,
          },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: notificationsEnabled
                  ? palette.orange + '22'
                  : colors.surfaceRaised,
              },
            ]}
          >
            <Bell size={22} color={notificationsEnabled ? palette.orange : colors.textMuted} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.title3, { color: colors.text }]}>Daily Reminders</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              {notificationsEnabled
                ? 'Active — We will remind you daily'
                : 'Disabled — Notifications off'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            style={[
              styles.toggleButton,
              {
                backgroundColor: notificationsEnabled ? palette.orange : colors.surfaceRaised,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Text
              style={[
                typography.micro,
                {
                  color: notificationsEnabled ? palette.navy : colors.textMuted,
                  fontWeight: '700',
                },
              ]}
            >
              {notificationsEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {notificationsEnabled && (
          <View style={{ marginTop: spacing.md }}>
            <Text
              style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}
            >
              Preferred daily practice time:
            </Text>
            <View style={styles.chipsRow}>
              {REMINDER_TIMES.map((time) => (
                <Chip
                  key={time}
                  label={time}
                  selected={selectedTime === time}
                  onPress={() => setSelectedTime(time)}
                  variant="filter"
                />
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* First Daily Plan Preview */}
      <View style={{ marginBottom: spacing.xl }}>
        <View style={styles.planHeaderRow}>
          <Sparkles size={18} color={palette.orange} />
          <Text style={[typography.title3, { color: colors.text, marginLeft: spacing.xs }]}>
            Your First Founder Plan (0/5)
          </Text>
        </View>
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginBottom: spacing.md, marginTop: 4 },
          ]}
        >
          Auto-generated based on your validation & fundraising goals:
        </Text>

        <View style={{ gap: spacing.sm }}>
          {INITIAL_TASKS.map((task) => (
            <Card
              key={task.id}
              style={[
                styles.taskItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.taskContent}>
                <View style={[styles.taskIndexDot, { borderColor: colors.border }]}>
                  <Text style={[typography.micro, { color: colors.textMuted }]}>{task.id}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[typography.bodyStrong, { color: colors.text, fontSize: 13 }]}>
                    {task.title}
                  </Text>
                  <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]}>
                    {task.category} • {task.duration}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>

      {/* Error message */}
      {error && (
        <Text style={[typography.caption, { color: colors.error, marginBottom: spacing.md }]}>
          {error}
        </Text>
      )}

      {/* Primary Complete CTA */}
      <View style={{ gap: spacing.sm }}>
        <Button variant="primary" size="lg" loading={loading} onPress={handleFinish}>
          Complete & Start Learning
        </Button>
        <Button variant="ghost" size="md" disabled={loading} onPress={handleFinish}>
          Skip Reminders & Enter App
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionCard: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskItem: {
    padding: 12,
    borderWidth: 1,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIndexDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
