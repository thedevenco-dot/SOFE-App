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
import { ArrowLeft, BookOpen, Bookmark, CheckCircle, Share2 } from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../../src/theme/typography';
import { Button, Card, QuoteBox, SectionHeader, TagChip } from '../../../src/components';
import { learnApi, ApiBook } from '../../../src/lib/learn-api';

const FALLBACK_BOOK: ApiBook = {
  id: 'b-1',
  slug: 'the-venture-handbook',
  title: 'The Venture Handbook: Seed to Series B',
  author: 'Naveen Jain & SOFE Editorial',
  coverUrl:
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  descriptionHtml:
    'An exhaustive playbook detailing the non-obvious mechanics of early stage venture scaling. Covering capital allocation rhythms, high-performance executive onboarding, equity vesting models, and crisis management.',
  format: 'pdf',
  isFree: true,
};

const CHAPTERS = [
  {
    number: '01',
    title: 'The Anatomy of Early Conviction',
    summary:
      'Distinguishing customer affinity from genuine pull. Validating before burning capital.',
  },
  {
    number: '02',
    title: 'Hiring Executives: The 0-to-1 Blueprint',
    summary:
      'Why hiring VP-level candidates from big tech fails at seed stage, and what to test for.',
  },
  {
    number: '03',
    title: 'Board Meetings That Drive Velocity',
    summary: 'Structuring memo-driven board discussions rather than slide presentations.',
  },
  {
    number: '04',
    title: 'Cap Table Hygiene & Downside Protection',
    summary: 'Safeguarding founder equity through secondary rounds and liquidation preferences.',
  },
];

export default function BookDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [book, setBook] = useState<ApiBook>(FALLBACK_BOOK);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters'>('overview');

  const loadBook = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await learnApi.getBookBySlug(slug);
      if (res) {
        setBook(res);
      }
    } catch {
      if (slug !== FALLBACK_BOOK.slug) {
        setBook({
          ...FALLBACK_BOOK,
          title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug,
        });
      }
    }
  }, [slug]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: book.title,
        message: `${book.title}\n\nRead this venture field guide on SOFE: https://sofe.app/learn/book/${book.slug}`,
      });
    } catch {
      // dismissed
    }
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
          {book.title}
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
        {/* Book Hero Card */}
        <View style={styles.heroSection}>
          <View style={styles.coverWrapper}>
            <Image source={{ uri: book.coverUrl }} style={styles.coverImage} resizeMode="cover" />
          </View>
          <View style={styles.heroMeta}>
            <TagChip
              label={book.format === 'pdf' ? 'HANDBOOK · PDF' : 'EXECUTIVE SUMMARY'}
              variant="orange"
            />
            <Text style={[typography.h2, styles.bookHeading]}>{book.title}</Text>
            <Text style={[typography.caption, styles.authorText]}>By {book.author}</Text>
            <View style={styles.accessBadge}>
              <CheckCircle size={14} color={palette.orangeDeep} />
              <Text style={[typography.labelSmall, styles.accessText]}>
                Included with SOFE Membership
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                typography.labelSmall,
                styles.tabText,
                activeTab === 'overview' && styles.tabTextActive,
              ]}
            >
              Overview & Key Learnings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'chapters' && styles.tabButtonActive]}
            onPress={() => setActiveTab('chapters')}
          >
            <Text
              style={[
                typography.labelSmall,
                styles.tabText,
                activeTab === 'chapters' && styles.tabTextActive,
              ]}
            >
              Table of Contents (4)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content depending on tab */}
        {activeTab === 'overview' ? (
          <View style={styles.tabSection}>
            <SectionHeader title="Synopsis" hasOrangeBar />
            <Text style={[typography.body, styles.bodyText]}>
              {book.descriptionHtml?.replace(/<[^>]+>/g, '') || ''}
            </Text>

            <QuoteBox
              quote="High-velocity startups do not die from competition; they bleed out from internal friction and premature optimization. This book is the tourniquet."
              author="Naveen Jain · Managing Director, SOFE Ventures"
              style={styles.quoteBox}
            />

            <SectionHeader title="Executive Key Takeaways" hasOrangeBar />
            <View style={styles.takeawaysList}>
              <View style={styles.takeawayItem}>
                <Text style={[typography.label, styles.takeawayBullet]}>1.</Text>
                <Text style={[typography.bodySmall, styles.takeawayText]}>
                  Cash runway is psychological oxygen. Never calculate runway on best-case pipeline.
                </Text>
              </View>
              <View style={styles.takeawayItem}>
                <Text style={[typography.label, styles.takeawayBullet]}>2.</Text>
                <Text style={[typography.bodySmall, styles.takeawayText]}>
                  Early senior hires must be builders who sell, not managers who delegate.
                </Text>
              </View>
              <View style={styles.takeawayItem}>
                <Text style={[typography.label, styles.takeawayBullet]}>3.</Text>
                <Text style={[typography.bodySmall, styles.takeawayText]}>
                  Board presentations should be sent 48 hours prior as memos to reserve meeting time
                  for strategy.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabSection}>
            <SectionHeader title="Core Chapters" hasOrangeBar />
            <View style={styles.chaptersList}>
              {CHAPTERS.map((ch) => (
                <Card key={ch.number} style={styles.chapterCard}>
                  <View style={styles.chapterHeader}>
                    <Text style={[typography.labelSmall, styles.chapterNumber]}>
                      CHAPTER {ch.number}
                    </Text>
                    <BookOpen size={16} color={palette.orange} />
                  </View>
                  <Text style={[typography.h3, styles.chapterTitle]}>{ch.title}</Text>
                  <Text style={[typography.bodySmall, styles.chapterSummary]}>{ch.summary}</Text>
                </Card>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Reader CTA */}
      <View style={styles.bottomBar}>
        <Button variant="primary" fullWidth onPress={() => alert(`Opening ${book.title}...`)}>
          {book.format === 'pdf' ? 'Download & Read PDF →' : 'Read Executive Summary →'}
        </Button>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  heroSection: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coverWrapper: {
    width: 110,
    height: 160,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: palette.slate,
    ...shadows.soft,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heroMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookHeading: {
    color: palette.navy,
    marginTop: spacing.xs,
  },
  authorText: {
    color: palette.slate,
    marginTop: spacing.xs,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  accessText: {
    color: palette.orangeDeep,
  },
  tabToggleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: palette.orange,
  },
  tabText: {
    color: palette.slate,
  },
  tabTextActive: {
    color: palette.navy,
    fontFamily: 'Inter_600SemiBold',
  },
  tabSection: {
    gap: spacing.md,
  },
  bodyText: {
    color: palette.navy,
    lineHeight: 22,
  },
  quoteBox: {
    marginVertical: spacing.sm,
  },
  takeawaysList: {
    gap: spacing.sm,
  },
  takeawayItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
  },
  takeawayBullet: {
    color: palette.orangeDeep,
  },
  takeawayText: {
    color: palette.navy,
    flex: 1,
    lineHeight: 20,
  },
  chaptersList: {
    gap: spacing.sm,
  },
  chapterCard: {
    padding: spacing.md,
    backgroundColor: palette.white,
    gap: spacing.xs,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterNumber: {
    color: palette.orangeDeep,
  },
  chapterTitle: {
    color: palette.navy,
    marginTop: spacing.xs,
  },
  chapterSummary: {
    color: palette.slate,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.cream,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
});
