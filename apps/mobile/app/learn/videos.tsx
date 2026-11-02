import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, Search } from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  Card,
  EmptyState,
  ErrorState,
  FilterChip,
  SkeletonCard,
  TagChip,
} from '../../src/components';
import { learnApi, ApiVideo } from '../../src/lib/learn-api';

const MOCK_VIDEOS: ApiVideo[] = [
  {
    id: 'v-1',
    slug: 'the-art-of-the-series-a-pitch',
    title: 'The Art of the Series A Pitch: Slide-by-Slide Anatomy',
    description:
      'A deep teardown of 3 actual Series A decks that closed within 2 weeks. Analysis of narrative tension, traction metrics, and founder presence.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    durationSec: 1540,
    isFree: true,
  },
  {
    id: 'v-2',
    slug: 'burn-multiple-and-capital-efficiency',
    title: 'Burn Multiple & Capital Efficiency in Tough Markets',
    description:
      'David Sacks and top venture operators explain why Net New ARR / Net Burn is the ultimate metric for SaaS survivability.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    durationSec: 2160,
    isFree: true,
  },
  {
    id: 'v-3',
    slug: 'technical-moats-in-the-age-of-ai',
    title: 'Defensible Moats in the Generative AI Era',
    description:
      'Why prompt wrappers fail and how proprietary workflow hooks create enduring enterprise switching costs.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    durationSec: 1820,
    isFree: false,
  },
  {
    id: 'v-4',
    slug: 'crisis-management-for-founders',
    title: 'Crisis Management: Surviving Broken Rounds and Down Markets',
    description:
      'Real stories from founders who turned around near-zero bank balances, restructured their teams, and reached profitability.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    durationSec: 2400,
    isFree: true,
  },
];

const TOPICS = [
  { id: 'all', label: 'All Talks' },
  { id: 'pitch-decks', label: 'Pitch Decks' },
  { id: 'capital-efficiency', label: 'Capital Efficiency' },
  { id: 'ai-moats', label: 'AI Moats' },
  { id: 'founder-psychology', label: 'Crisis & Mindset' },
];

export default function VideosListScreen() {
  const router = useRouter();

  const [videos, setVideos] = useState<ApiVideo[]>(MOCK_VIDEOS);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await learnApi.listVideos({
        topic: selectedTopic === 'all' ? undefined : selectedTopic,
      });

      if (res?.data?.length > 0) {
        setVideos(res.data);
      } else {
        setVideos(MOCK_VIDEOS);
      }
    } catch {
      setError('Unable to load video catalogue. Showing offline archive.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTopic]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVideos();
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title, styles.navTitle]}>Founder Keynotes & Talks</Text>
        <TouchableOpacity
          onPress={() => router.push('/learn/search' as never)}
          style={styles.navButton}
          accessibilityLabel="Search videos"
        >
          <Search size={20} color={palette.navy} />
        </TouchableOpacity>
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
        {/* Topic Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsScroll}
        >
          {TOPICS.map((topic) => (
            <FilterChip
              key={topic.id}
              label={topic.label}
              selected={selectedTopic === topic.id}
              onPress={() => setSelectedTopic(topic.id)}
            />
          ))}
        </ScrollView>

        {/* Status Count */}
        <View style={styles.countRow}>
          <Text style={[typography.bodySmall, styles.countText]}>
            {loading ? 'Loading keynotes...' : `${videos.length} Masterclass Talks`}
          </Text>
        </View>

        {/* Error notification */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState message={error} retryLabel="Retry" onRetry={loadVideos} />
          </View>
        ) : null}

        {/* Video Cards List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : videos.length === 0 ? (
          <EmptyState
            title="No Talks Available"
            description="No keynotes found for the selected topic."
            actionLabel="View All"
            onAction={() => setSelectedTopic('all')}
          />
        ) : (
          <View style={styles.videosList}>
            {videos.map((vid) => (
              <TouchableOpacity
                key={vid.id}
                activeOpacity={0.88}
                onPress={() => router.push(`/learn/video/${vid.slug}` as never)}
              >
                <Card style={styles.videoCard}>
                  {/* Thumbnail with duration badge and play icon */}
                  <View style={styles.thumbnailWrapper}>
                    <Image
                      source={{ uri: vid.thumbnailUrl }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.playOverlay}>
                      <View style={styles.playIcon}>
                        <Play size={20} color={palette.cream} fill={palette.cream} />
                      </View>
                    </View>
                    <View style={styles.durationPill}>
                      <Text style={[typography.labelSmall, styles.durationText]}>
                        {formatDuration(vid.durationSec)}
                      </Text>
                    </View>
                  </View>

                  {/* Video Details */}
                  <View style={styles.videoDetails}>
                    <View style={styles.badgeRow}>
                      <TagChip
                        label={vid.isFree !== false ? 'FREE KEYNOTE' : 'VENTURE COHORT'}
                        variant={vid.isFree !== false ? 'dark' : 'orange'}
                      />
                    </View>
                    <Text style={[typography.h3, styles.videoTitle]} numberOfLines={2}>
                      {vid.title}
                    </Text>
                    <Text style={[typography.bodySmall, styles.videoDescription]} numberOfLines={2}>
                      {vid.description}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  navButton: {
    padding: spacing.xs,
  },
  navTitle: {
    color: palette.navy,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  topicsScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  countText: {
    color: palette.slate,
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  videosList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  videoCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: palette.white,
  },
  thumbnailWrapper: {
    width: '100%',
    height: 180,
    backgroundColor: palette.navy,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  playOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    ...shadows.soft,
  },
  durationPill: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.xs,
  },
  durationText: {
    color: palette.cream,
  },
  videoDetails: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  videoTitle: {
    color: palette.navy,
  },
  videoDescription: {
    color: palette.slate,
    lineHeight: 18,
  },
});
