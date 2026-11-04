import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme/theme-context';
import { typography } from '../../../src/theme/typography';
import { FilterChip, EmptyState } from '../../../src/components';
import { profileApi } from '../../../src/lib/profile-api';
import type { ProjectDto } from '@sofe/shared';

export default function ProjectsListScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await profileApi.listProjects();
      setProjects(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const filtered = projects.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { borderBottomColor: colors.border, padding: spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[typography.bodyStrong, { color: palette.orange }]}>← Profile</Text>
        </TouchableOpacity>
        <Text style={[typography.title3, { color: colors.text }]}>Portfolio Projects</Text>
        <TouchableOpacity onPress={() => router.push('/profile/projects/edit')}>
          <Text style={[typography.bodyStrong, { color: palette.orange }]}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[styles.filterBar, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}
      >
        <FilterChip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip
          label="Published"
          selected={filter === 'published'}
          onPress={() => setFilter('published')}
        />
        <FilterChip
          label="Drafts"
          selected={filter === 'draft'}
          onPress={() => setFilter('draft')}
        />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : (
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
          {filtered.length === 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <EmptyState
                title="No projects here"
                description="Create and showcase your startup initiatives, pitch decks, and work."
                actionLabel="+ Create Project"
                onAction={() => router.push('/profile/projects/edit')}
              />
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/profile/projects/${item.id}`)}
                style={[
                  styles.card,
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
                <View style={styles.cardHeader}>
                  <Text style={[typography.title3, { color: colors.text, flex: 1 }]}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          item.status === 'published' ? palette.peachTint : colors.border,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.captionStrong,
                        {
                          color: item.status === 'published' ? palette.orange : colors.textMuted,
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text
                  numberOfLines={2}
                  style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}
                >
                  {item.summary}
                </Text>

                {item.tags && item.tags.length > 0 ? (
                  <View style={[styles.tagRow, { marginTop: spacing.sm }]}>
                    {item.tags.map((tag, idx) => (
                      <View
                        key={idx}
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

                <View style={[styles.footerRow, { marginTop: spacing.sm }]}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {(item.files || []).length} files • {(item.links || []).length} links
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/profile/projects/edit',
                        params: { id: item.id },
                      })
                    }
                  >
                    <Text style={[typography.captionStrong, { color: palette.orange }]}>
                      Edit →
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flexGrow: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
