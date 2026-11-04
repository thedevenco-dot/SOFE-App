import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Button, TopTabs, ProgressRing, FilterChip, EmptyState } from '../../src/components';
import { profileApi, type MobileProfile } from '../../src/lib/profile-api';
import type {
  UserStatsResponseDto,
  ProjectDto,
  LearnerAchievementsResponseDto,
} from '@sofe/shared';

export default function ProfileScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  const [activeTab, setActiveTab] = useState<'progress' | 'portfolio' | 'achievements'>('progress');
  const [profile, setProfile] = useState<MobileProfile | null>(null);
  const [stats, setStats] = useState<UserStatsResponseDto | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [achievementsData, setAchievementsData] = useState<LearnerAchievementsResponseDto | null>(
    null,
  );
  const [projectFilter, setProjectFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pRes, sRes, projRes, achRes] = await Promise.allSettled([
        profileApi.getMyProfile(),
        profileApi.getMyStats(),
        profileApi.listProjects(),
        profileApi.getAchievements(),
      ]);

      if (pRes.status === 'fulfilled') setProfile(pRes.value);
      if (sRes.status === 'fulfilled') setStats(sRes.value);
      if (projRes.status === 'fulfilled') setProjects(projRes.value);
      if (achRes.status === 'fulfilled') setAchievementsData(achRes.value);
    } catch {
      // Graceful fallback with cached/empty state
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredProjects = projects.filter((p) => {
    if (projectFilter === 'all') return true;
    return p.status === projectFilter;
  });

  const tabs = [
    { key: 'progress', label: 'Progress' },
    { key: 'portfolio', label: `Portfolio (${projects.length})` },
    {
      key: 'achievements',
      label: `Badges (${achievementsData?.unlockedCount || 0}/${achievementsData?.totalCount || 0})`,
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.orange}
          />
        }
      >
        {/* Profile Header Card */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.headerRow}>
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={[
                  styles.avatar,
                  {
                    borderRadius: radius.pill,
                    borderColor: palette.orange,
                    borderWidth: 2,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: palette.navy,
                    borderColor: palette.orange,
                    borderWidth: 2,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Text style={[typography.title2, { color: palette.orange }]}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'F'}
                </Text>
              </View>
            )}

            <View style={styles.nameBlock}>
              <Text style={[typography.title2, { color: colors.text }]}>
                {profile?.name || 'Founder Learner'}
              </Text>
              <Text
                style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}
              >
                {profile?.headline || 'Building the future'}
              </Text>
              {profile?.location ? (
                <Text
                  style={[typography.caption, { color: palette.orange, marginTop: spacing.xs }]}
                >
                  📍 {profile.location}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Stat Pills */}
          <View style={[styles.statRow, { marginTop: spacing.md }]}>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.background, borderRadius: radius.pill },
              ]}
            >
              <Text style={[typography.captionStrong, { color: palette.orange }]}>
                🔥 {stats?.practiceStats.currentStreak ?? profile?.streak?.current ?? 0}d streak
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.background, borderRadius: radius.pill },
              ]}
            >
              <Text style={[typography.captionStrong, { color: palette.gold }]}>
                ⭐ {stats?.practiceStats.totalPoints ?? profile?.pointsBalance ?? 0} pts
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.background, borderRadius: radius.pill },
              ]}
            >
              <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
                📁 {projects.length} projects
              </Text>
            </View>
          </View>

          <Button
            variant="secondary"
            size="sm"
            style={{ marginTop: spacing.md }}
            onPress={() => router.push('/profile/edit')}
          >
            Edit Profile
          </Button>
        </View>

        {/* Navigation Tabs */}
        <View style={{ marginTop: spacing.lg }}>
          <TopTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(key) => setActiveTab(key as typeof activeTab)}
          />
        </View>

        {/* Tab 1: Progress */}
        {activeTab === 'progress' && (
          <View style={{ marginTop: spacing.lg }}>
            {/* Curriculum Progress Ring Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.ringRow}>
                <ProgressRing
                  progress={stats?.progressRing.percent ?? 0}
                  size={76}
                  strokeWidth={7}
                  fillColor={palette.orange}
                  trackColor={colors.border}
                />
                <View style={styles.ringInfo}>
                  <Text style={[typography.title3, { color: colors.text }]}>
                    Curriculum Progress
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}
                  >
                    {stats?.progressRing.completedCourses ?? 0} of{' '}
                    {stats?.progressRing.totalCourses ?? 0} courses completed
                  </Text>
                  <Text
                    style={[
                      typography.captionStrong,
                      { color: palette.orange, marginTop: spacing.xs },
                    ]}
                  >
                    {stats?.progressRing.hoursWatched ?? 0}h learning logged
                  </Text>
                </View>
              </View>
            </View>

            {/* 7-Day Learning Time Chart */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginTop: spacing.md,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[typography.title3, { color: colors.text }]}>7-Day Consistency</Text>
              <Text
                style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}
              >
                Daily minutes watched
              </Text>

              <View style={[styles.chartContainer, { marginTop: spacing.md }]}>
                {(stats?.learningTimeChart || []).map((day, idx) => {
                  const maxMin = Math.max(
                    60,
                    ...(stats?.learningTimeChart.map((d) => d.minutes) || [60]),
                  );
                  const barHeight = Math.max(8, Math.round((day.minutes / maxMin) * 70));
                  const isToday = idx === (stats?.learningTimeChart.length || 0) - 1;

                  return (
                    <View key={day.dateKey} style={styles.chartCol}>
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textMuted, marginBottom: spacing.xs },
                        ]}
                      >
                        {day.minutes > 0 ? `${day.minutes}m` : '-'}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: barHeight,
                              backgroundColor:
                                day.minutes > 0
                                  ? isToday
                                    ? palette.orange
                                    : palette.peachTint
                                  : colors.border,
                              borderRadius: radius.sm,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          typography.captionStrong,
                          {
                            color: isToday ? palette.orange : colors.textMuted,
                            marginTop: spacing.xs,
                          },
                        ]}
                      >
                        {day.dayLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Practice Stats 4-Grid */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginTop: spacing.md,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[typography.title3, { color: colors.text }]}>Practice Metrics</Text>

              <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
                <View style={styles.gridItem}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    Current Streak
                  </Text>
                  <Text
                    style={[typography.title2, { color: palette.orange, marginTop: spacing.xs }]}
                  >
                    {stats?.practiceStats.currentStreak ?? 0}d
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    Longest Streak
                  </Text>
                  <Text style={[typography.title2, { color: colors.text, marginTop: spacing.xs }]}>
                    {stats?.practiceStats.longestStreak ?? 0}d
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    Quizzes Done
                  </Text>
                  <Text style={[typography.title2, { color: colors.text, marginTop: spacing.xs }]}>
                    {stats?.practiceStats.quizzesCompleted ?? 0}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    Avg Quiz Score
                  </Text>
                  <Text
                    style={[typography.title2, { color: colors.success, marginTop: spacing.xs }]}
                  >
                    {stats?.practiceStats.avgScorePercent ?? 0}%
                  </Text>
                </View>
              </View>
            </View>

            {/* View Detailed Analytics Button */}
            <Button
              variant="secondary"
              size="md"
              style={{ marginTop: spacing.lg }}
              onPress={() => router.push('/profile/stats')}
            >
              View Detailed Analytics
            </Button>
          </View>
        )}

        {/* Tab 2: Portfolio */}
        {activeTab === 'portfolio' && (
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.filterRow}>
              <FilterChip
                label="All"
                selected={projectFilter === 'all'}
                onPress={() => setProjectFilter('all')}
              />
              <FilterChip
                label="Published"
                selected={projectFilter === 'published'}
                onPress={() => setProjectFilter('published')}
              />
              <FilterChip
                label="Drafts"
                selected={projectFilter === 'draft'}
                onPress={() => setProjectFilter('draft')}
              />
            </View>

            <Button
              variant="primary"
              size="sm"
              style={{ marginTop: spacing.md }}
              onPress={() => router.push('/profile/projects/edit')}
            >
              + New Project
            </Button>

            {filteredProjects.length === 0 ? (
              <View style={{ marginTop: spacing.xl }}>
                <EmptyState
                  title="No projects found"
                  description="Share your venture milestones, pitch decks, or demo links with founders."
                  actionLabel="+ Create Project"
                  onAction={() => router.push('/profile/projects/edit')}
                />
              </View>
            ) : (
              <View style={{ marginTop: spacing.md }}>
                {filteredProjects.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/profile/projects/${p.id}`)}
                    style={[
                      styles.projectCard,
                      {
                        backgroundColor: colors.surface,
                        borderRadius: radius.lg,
                        padding: spacing.md,
                        marginBottom: spacing.md,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <View style={styles.projectHeader}>
                      <Text style={[typography.title3, { color: colors.text, flex: 1 }]}>
                        {p.title}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              p.status === 'published' ? palette.peachTint : colors.border,
                            borderRadius: radius.pill,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.captionStrong,
                            {
                              color: p.status === 'published' ? palette.orange : colors.textMuted,
                            },
                          ]}
                        >
                          {p.status}
                        </Text>
                      </View>
                    </View>

                    <Text
                      numberOfLines={2}
                      style={[
                        typography.caption,
                        { color: colors.textMuted, marginTop: spacing.xs },
                      ]}
                    >
                      {p.summary}
                    </Text>

                    {p.tags && p.tags.length > 0 ? (
                      <View style={[styles.tagRow, { marginTop: spacing.sm }]}>
                        {p.tags.slice(0, 3).map((tag, tIdx) => (
                          <View
                            key={tIdx}
                            style={[
                              styles.tagChip,
                              { backgroundColor: colors.background, borderRadius: radius.sm },
                            ]}
                          >
                            <Text style={[typography.caption, { color: colors.textMuted }]}>
                              #{tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={[styles.projectFooter, { marginTop: spacing.sm }]}>
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: '/profile/projects/edit',
                            params: { id: p.id },
                          })
                        }
                      >
                        <Text style={[typography.captionStrong, { color: palette.orange }]}>
                          Edit Project →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 3: Achievements */}
        {activeTab === 'achievements' && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.title3, { color: colors.text }]}>Badge Showcase</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
              {achievementsData?.unlockedCount ?? 0} of {achievementsData?.totalCount ?? 0} badges
              unlocked
            </Text>

            <View style={[styles.badgeGrid, { marginTop: spacing.md }]}>
              {(achievementsData?.items || []).map((ach) => (
                <TouchableOpacity
                  key={ach.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/profile/achievement/${ach.id}`)}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      borderColor: ach.unlocked ? palette.orange : colors.border,
                      borderWidth: ach.unlocked ? 1.5 : 1,
                      opacity: ach.unlocked ? 1 : 0.65,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.badgeIconBox,
                      {
                        backgroundColor: ach.unlocked ? palette.peachTint : colors.border,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.title1,
                        { color: ach.unlocked ? palette.orange : colors.textMuted },
                      ]}
                    >
                      {ach.unlocked ? '🏆' : '🔒'}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[
                      typography.title3,
                      {
                        color: colors.text,
                        marginTop: spacing.sm,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {ach.title}
                  </Text>

                  <Text
                    style={[
                      typography.captionStrong,
                      {
                        color: ach.tier === 'gold' ? palette.gold : palette.orange,
                        marginTop: spacing.xs,
                        textTransform: 'uppercase',
                      },
                    ]}
                  >
                    {ach.tier}
                  </Text>

                  {ach.unlocked ? (
                    <Text
                      style={[typography.caption, { color: colors.success, marginTop: spacing.xs }]}
                    >
                      ✓ Unlocked
                    </Text>
                  ) : (
                    <View
                      style={[
                        styles.progressBarTrack,
                        {
                          backgroundColor: colors.border,
                          marginTop: spacing.xs,
                          borderRadius: radius.pill,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${ach.progress?.percent || 0}%`,
                            backgroundColor: palette.orange,
                            borderRadius: radius.pill,
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  headerCard: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBlock: {
    flex: 1,
    marginLeft: 14,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  card: {
    width: '100%',
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringInfo: {
    flex: 1,
    marginLeft: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: 70,
    width: 14,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  projectCard: {
    width: '100%',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    alignItems: 'center',
  },
  badgeIconBox: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '80%',
    height: 5,
  },
  progressBarFill: {
    height: 5,
  },
});
