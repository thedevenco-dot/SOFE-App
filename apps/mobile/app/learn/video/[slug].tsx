import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Maximize2, Pause, Play, Share2 } from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../../src/theme/typography';
import { ProgressBar, QuoteBox, SectionHeader, TagChip } from '../../../src/components';
import { learnApi, ApiVideo } from '../../../src/lib/learn-api';

const FALLBACK_VIDEO: ApiVideo = {
  id: 'v-1',
  slug: 'the-art-of-the-series-a-pitch',
  title: 'The Art of the Series A Pitch: Slide-by-Slide Anatomy',
  description:
    'An unvarnished breakdown of three Series A pitch decks that resulted in term sheets within 14 days. Learn how to structure your market expansion narrative, quantify net revenue retention, and overcome investor skepticism during partner meetings.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  durationSec: 1540,
  isFree: true,
};

const CHAPTERS = [
  { time: '00:00', title: 'The Hook: Market Disruption vs. Incremental Growth' },
  { time: '04:15', title: 'Traction Metrics: Cohort Retention Curves' },
  { time: '11:30', title: 'The Go-To-Market Engine: Repeatable Unit Economics' },
  { time: '18:50', title: 'Cap Table & Use of Funds Breakdown' },
];

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [video, setVideo] = useState<ApiVideo>(FALLBACK_VIDEO);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgressSec, setCurrentProgressSec] = useState(180);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const loadVideo = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await learnApi.getVideoBySlug(slug);
      if (res) {
        setVideo(res);
      }
    } catch {
      if (slug !== FALLBACK_VIDEO.slug) {
        setVideo({
          ...FALLBACK_VIDEO,
          title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug,
        });
      }
    }
  }, [slug]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: video.title,
        message: `${video.title}\n\nWatch this founder keynote on SOFE: https://sofe.app/learn/video/${video.slug}`,
      });
    } catch {
      // dismissed
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, (currentProgressSec / video.durationSec) * 100);

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
          {video.title}
        </Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => setIsBookmarked(!isBookmarked)}
            style={styles.navButton}
            accessibilityLabel="Bookmark"
          >
            <Bookmark
              size={20}
              color={isBookmarked ? palette.orange : palette.navy}
              fill={isBookmarked ? palette.orange : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.navButton}
            accessibilityLabel="Share"
          >
            <Share2 size={20} color={palette.navy} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Video Player Display */}
        <View style={styles.playerContainer}>
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.playerImage}
            resizeMode="cover"
          />

          {/* Player Controls Overlay */}
          <View style={styles.playerControls}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => setIsPlaying(!isPlaying)}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={28} color={palette.cream} fill={palette.cream} />
              ) : (
                <Play
                  size={28}
                  color={palette.cream}
                  fill={palette.cream}
                  style={styles.playIconOffset}
                />
              )}
            </TouchableOpacity>

            {/* Bottom Progress Bar & Timestamps */}
            <View style={styles.playbackFooter}>
              <View style={styles.progressTrack}>
                <ProgressBar progress={progressPercent} height={4} />
              </View>
              <View style={styles.timeRow}>
                <Text style={[typography.caption, styles.timeText]}>
                  {formatTime(currentProgressSec)} / {formatTime(video.durationSec)}
                </Text>
                <TouchableOpacity accessibilityLabel="Fullscreen">
                  <Maximize2 size={16} color={palette.cream} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Video Metadata */}
        <View style={styles.metaSection}>
          <View style={styles.tagsRow}>
            <TagChip label="SERIES A PLAYBOOK" variant="orange" />
            <TagChip label="FELLOWS EXCLUSIVE" variant="dark" />
          </View>

          <Text style={[typography.h2, styles.videoHeading]}>{video.title}</Text>
          <Text style={[typography.body, styles.videoDescription]}>{video.description}</Text>

          <QuoteBox
            quote="If your Series A pitch spends more than 3 slides on the problem, you haven't proven market urgency. Lead with velocity."
            author="SOFE Venture Fellow · Keynote Speaker"
          />
        </View>

        {/* Timestamp Chapters */}
        <View style={styles.chaptersSection}>
          <SectionHeader title="Discussion Chapters" hasOrangeBar />
          <View style={styles.chaptersList}>
            {CHAPTERS.map((ch, index) => (
              <TouchableOpacity
                key={index}
                style={styles.chapterRow}
                onPress={() => {
                  const parts = ch.time.split(':');
                  setCurrentProgressSec(parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10));
                  setIsPlaying(true);
                }}
              >
                <View style={styles.chapterTimeBadge}>
                  <Text style={[typography.labelSmall, styles.chapterTimeText]}>{ch.time}</Text>
                </View>
                <Text style={[typography.bodySmall, styles.chapterLabel]}>{ch.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  playerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: palette.navy,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  playerControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 30, 48, 0.4)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  playIconOffset: {
    marginLeft: 3,
  },
  playbackFooter: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.xs,
  },
  progressTrack: {
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: palette.cream,
  },
  metaSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  videoHeading: {
    color: palette.navy,
  },
  videoDescription: {
    color: palette.slate,
    lineHeight: 22,
  },
  chaptersSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  chaptersList: {
    gap: spacing.sm,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
  },
  chapterTimeBadge: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.xs,
  },
  chapterTimeText: {
    color: palette.cream,
  },
  chapterLabel: {
    color: palette.navy,
    flex: 1,
  },
});
