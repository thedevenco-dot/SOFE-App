import React, { useState, useEffect, useCallback } from 'react';
import {
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderDown,
} from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../../../../src/theme/typography';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  SkeletonCard,
  TagChip,
} from '../../../../src/components';
import { learnApi, ApiCourseResource } from '../../../../src/lib/learn-api';

const FALLBACK_RESOURCES: ApiCourseResource[] = [
  {
    lessonId: 'l-1',
    lessonTitle: 'The Problem-Solution Fit Matrix',
    title: 'Problem-Solution Fit Matrix Template (XLSX)',
    url: 'https://cdn.sofe.io/resources/problem-solution-matrix-v2.xlsx',
    kind: 'file',
  },
  {
    lessonId: 'l-2',
    lessonTitle: 'Customer Discovery: Asking Questions That Hurt',
    title: 'Customer Discovery Interview Script & Scorecard (PDF)',
    url: 'https://cdn.sofe.io/resources/customer-discovery-script.pdf',
    kind: 'pdf',
  },
  {
    lessonId: 'l-4',
    lessonTitle: 'Deconstructing CAC: Payback & LTV Ratios',
    title: 'SaaS Unit Economics Model Spreadsheet',
    url: 'https://cdn.sofe.io/resources/saas-unit-economics-v1.xlsx',
    kind: 'file',
  },
  {
    lessonId: 'l-5',
    lessonTitle: 'Runway Extension & Cash Burn Discipline',
    title: 'Operator Runway & Burn Calculator',
    url: 'https://tools.sofe.io/runway-calculator',
    kind: 'link',
  },
];

type FilterType = 'all' | 'pdf' | 'file' | 'link';

export default function CourseResourcesScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState<ApiCourseResource[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    if (!slug) return;
    try {
      setError(null);
      const res = await learnApi.getCourseResources(slug);
      const items = res.data?.resources;
      if (items && items.length > 0) {
        setResources(items);
      } else {
        setResources(FALLBACK_RESOURCES);
      }
    } catch {
      // Use fallback resources for offline testing
      setResources(FALLBACK_RESOURCES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadResources();
  }, [loadResources]);

  const handleOpenResource = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      // Fallback if unable to open
    }
  };

  const filteredResources = resources.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.kind === activeFilter;
  });

  const renderResourceIcon = (kind: string) => {
    switch (kind) {
      case 'pdf':
        return <FileText size={20} color={palette.orangeDeep} />;
      case 'file':
        return <FileSpreadsheet size={20} color={palette.slate} />;
      case 'link':
        return <ExternalLink size={20} color={palette.navy} />;
      default:
        return <FolderDown size={20} color={palette.slate} />;
    }
  };

  const renderFilterButton = (label: string, filter: FilterType) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(filter)}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[typography.labelSmall, isActive ? styles.filterTextActive : styles.filterText]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title, styles.navTitle]} numberOfLines={1}>
          Course Resources
        </Text>
        <View style={styles.navButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Description */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerIconWrap}>
            <FolderDown size={28} color={palette.orangeDeep} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={[typography.h3, styles.bannerTitle]}>Templates & Artifacts</Text>
            <Text style={[typography.bodySmall, styles.bannerSubtitle]}>
              Operational frameworks, financial models, and interview scripts provided across all
              course modules.
            </Text>
          </View>
        </Card>

        {/* Filter Chips Bar */}
        <View style={styles.filterBar}>
          {renderFilterButton('All Items', 'all')}
          {renderFilterButton('PDFs', 'pdf')}
          {renderFilterButton('Worksheets', 'file')}
          {renderFilterButton('Links', 'link')}
        </View>

        {/* Error notification if any */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState message={error} retryLabel="Retry" onRetry={loadResources} />
          </View>
        ) : null}

        {/* Resource Items */}
        {loading && !refreshing ? (
          <View style={styles.skeletonContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filteredResources.length === 0 ? (
          <EmptyState
            title="No Resources Found"
            description="There are no downloadable materials matching the selected filter."
            actionLabel="Show All Items"
            onAction={() => setActiveFilter('all')}
          />
        ) : (
          <View style={styles.resourcesList}>
            {filteredResources.map((res, index) => (
              <Card key={`${res.lessonId}-${index}`} style={styles.resourceCard}>
                <View style={styles.resourceHeaderRow}>
                  <View style={styles.resourceIconCircle}>{renderResourceIcon(res.kind)}</View>
                  <View style={styles.resourceHeaderInfo}>
                    <TagChip
                      label={res.kind.toUpperCase()}
                      variant={res.kind === 'pdf' ? 'orange' : 'dark'}
                    />
                    <Text style={[typography.caption, styles.lessonSource]} numberOfLines={1}>
                      {res.lessonTitle}
                    </Text>
                  </View>
                </View>

                <Text style={[typography.h3, styles.resourceTitle]}>{res.title}</Text>

                <View style={styles.resourceActionRow}>
                  <Button variant="secondary" fullWidth onPress={() => handleOpenResource(res.url)}>
                    {res.kind === 'link' ? 'Open Resource ↗' : 'Download Document ↓'}
                  </Button>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    color: palette.navy,
  },
  navButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.huge,
  },
  bannerCard: {
    backgroundColor: palette.peachTint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.orange,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  bannerTitle: {
    color: palette.navy,
  },
  bannerSubtitle: {
    color: palette.slate,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  filterChipActive: {
    backgroundColor: palette.navy,
    borderColor: palette.navy,
  },
  filterText: {
    color: palette.navy,
  },
  filterTextActive: {
    color: palette.white,
  },
  errorContainer: {
    paddingVertical: spacing.sm,
  },
  skeletonContainer: {
    gap: spacing.md,
  },
  resourcesList: {
    gap: spacing.md,
  },
  resourceCard: {
    backgroundColor: palette.white,
    padding: spacing.md,
    gap: spacing.md,
  },
  resourceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resourceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceHeaderInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  lessonSource: {
    color: palette.mutedOnLight,
  },
  resourceTitle: {
    color: palette.navy,
  },
  resourceActionRow: {
    marginTop: spacing.xs,
  },
});
