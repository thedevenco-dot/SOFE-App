import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { ProgressBar } from './ProgressBar';

export type DayStatus = 'done' | 'today' | 'upcoming' | 'missed';

export interface DayData {
  dayLabel: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  status: DayStatus;
}

export interface WeeklyConsistencyProps {
  days?: DayData[];
  currentMinutes?: number;
  targetMinutes?: number;
  style?: ViewStyle;
}

const defaultDays: DayData[] = [
  { dayLabel: 'M', status: 'done' },
  { dayLabel: 'T', status: 'done' },
  { dayLabel: 'W', status: 'done' },
  { dayLabel: 'T', status: 'today' },
  { dayLabel: 'F', status: 'upcoming' },
  { dayLabel: 'S', status: 'upcoming' },
  { dayLabel: 'S', status: 'upcoming' },
];

/**
 * 7-Day Consistency progress component matching DESIGN_V2.md.
 * Displays row of 7 day circles (done = orange with check, today = orange ring)
 * followed by target progress bar ("38m / 45 mins (84%)").
 */
export function WeeklyConsistency({
  days = defaultDays,
  currentMinutes = 38,
  targetMinutes = 45,
  style,
}: WeeklyConsistencyProps) {
  const percent = Math.min(100, Math.round((currentMinutes / targetMinutes) * 100));

  return (
    <View style={[styles.container, style]}>
      {/* 7 Days Row */}
      <View style={styles.daysRow}>
        {days.map((item, idx) => {
          const isDone = item.status === 'done';
          const isToday = item.status === 'today';

          return (
            <View key={idx} style={styles.dayCol}>
              <View
                style={[styles.circle, isDone && styles.circleDone, isToday && styles.circleToday]}
              >
                {isDone ? (
                  <Check size={14} color={palette.navy} strokeWidth={3} />
                ) : (
                  <Text
                    style={[typography.caption, styles.dayText, isToday && styles.dayTextToday]}
                  >
                    {item.dayLabel}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Target Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={percent}
          leftLabel="Daily Goal"
          rightLabel={`${currentMinutes}m / ${targetMinutes} mins (${percent}%)`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayCol: {
    alignItems: 'center',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: palette.orange,
  },
  circleToday: {
    backgroundColor: palette.white,
    borderWidth: 2,
    borderColor: palette.orange,
  },
  dayText: {
    color: palette.mutedOnLight,
    fontWeight: '600',
    fontSize: 12,
  },
  dayTextToday: {
    color: palette.orange,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
});
