import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import {
  palette,
  colorRoles,
  radius,
  shadows,
  spacing,
  type DailyPlan,
  type DailyPlanItem,
} from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import { TaskRow } from '../../src/components/TaskRow';
import { ProgressRing } from '../../src/components/ProgressRing';
import { homeApi } from '../../src/lib/home-api';

export default function DailyPlanScreen() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const data = await homeApi.getDailyPlan();
      setPlan(data);
    } catch {
      // Ignore or show message
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlan();
    }, [fetchPlan]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlan();
  };

  const handleToggleTask = async (item: DailyPlanItem) => {
    if (!plan) return;
    const newDone = !item.done;

    // Optimistic UI update
    setPlan((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((i) =>
        i.id === item.id
          ? { ...i, done: newDone, doneAt: newDone ? new Date().toISOString() : undefined }
          : i,
      );
      const updatedCount = updatedItems.filter((i) => i.done).length;
      return {
        ...prev,
        items: updatedItems,
        completedCount: updatedCount,
      };
    });

    try {
      const res = await homeApi.toggleDailyTask(item.id, newDone);
      if (res?.completedCount !== undefined) {
        setPlan((prev) => (prev ? { ...prev, completedCount: res.completedCount } : prev));
      }
    } catch {
      // Revert on error
      Alert.alert('Error', 'Failed to update protocol status');
      fetchPlan();
    }
  };

  const totalTasks = plan?.items?.length || 0;
  const completedTasks = plan?.completedCount || 0;
  const allCompleted = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[typography.title1, styles.title]}>Today&apos;s Protocol</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Consistent daily habits compound non-linearly. Complete your executive regimen.
        </Text>
      </View>

      {/* Progress Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsRingCol}>
          <ProgressRing
            size={76}
            strokeWidth={8}
            progress={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
            label={`${completedTasks}/${totalTasks}`}
          />
        </View>
        <View style={styles.statsTextCol}>
          <Text style={[typography.title3, styles.statsTitle]}>
            {allCompleted
              ? 'All Protocols Completed'
              : `${completedTasks} of ${totalTasks} Completed`}
          </Text>
          <Text style={[typography.caption, styles.statsSubtitle]}>
            Earn up to 100 discipline points daily to build momentum.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={palette.orange} size="large" />
        </View>
      ) : (
        <View style={styles.tasksSection}>
          <Text style={[typography.eyebrow, styles.sectionEyebrow]}>EXECUTIVE TASKS</Text>
          <View style={styles.tasksList}>
            {plan?.items?.map((item) => (
              <TaskRow
                key={item.id}
                title={item.label}
                subtitle={item.key === 'watch_lesson' ? 'Video masterclass lesson' : undefined}
                minutes={item.key === 'watch_lesson' ? 18 : 10}
                points={25}
                isCompleted={item.done}
                onToggle={() => handleToggleTask(item)}
              />
            ))}
          </View>
        </View>
      )}

      {allCompleted && (
        <View style={styles.celebrationCard}>
          <CheckCircle2 size={24} color={colorRoles.successOnDark} />
          <View style={styles.celebrationText}>
            <Text style={[typography.bodyStrong, styles.celebrationTitle]}>
              Daily Protocol Complete!
            </Text>
            <Text style={[typography.caption, styles.celebrationBody]}>
              Great execution today. Your streak and discipline points have been updated.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: palette.navy,
  },
  subtitle: {
    color: palette.slate,
    marginTop: spacing.xs,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.soft,
  },
  statsRingCol: {
    marginRight: spacing.lg,
  },
  statsTextCol: {
    flex: 1,
  },
  statsTitle: {
    color: palette.navy,
  },
  statsSubtitle: {
    color: palette.slate,
    marginTop: spacing.xs,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  tasksSection: {
    marginBottom: spacing.xl,
  },
  sectionEyebrow: {
    color: palette.orangeDeep,
    marginBottom: spacing.sm,
  },
  tasksList: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  celebrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.peachTint,
    borderColor: colorRoles.successOnDark,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  celebrationText: {
    flex: 1,
  },
  celebrationTitle: {
    color: palette.navy,
  },
  celebrationBody: {
    color: palette.slate,
    marginTop: 2,
  },
});
