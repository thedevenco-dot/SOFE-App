import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, Search, SlidersHorizontal } from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  AppHeader,
  Button,
  Card,
  FilterChip,
  NewsletterCard,
  ProgressBar,
  QuoteCard,
  SectionHeader,
  SkeletonCard,
  StreakChip,
  TagChip,
  TimeChip,
  Avatar,
  ErrorState,
} from '../../src/components';
import { startupWorldApi, ApiArticle, ApiTopic } from '../../src/lib/startup-world-api';
import {
  saveArticleOffline,
  removeArticleOffline,
  isArticleSavedOffline,
} from '../../src/lib/offline-articles';

// Fallback seed data in case API is offline or loading
const FALLBACK_TOPICS: ApiTopic[] = [
  { id: 'all', name: 'All Dispatches', slug: 'all' },
  { id: 't1', name: 'Venture Strategy', slug: 'venture-strategy' },
  { id: 't2', name: 'Product & Growth', slug: 'product-growth' },
  { id: 't3', name: 'Fundraising', slug: 'fundraising' },
  { id: 't4', name: 'Go-To-Market', slug: 'go-to-market' },
];

const FALLBACK_LEAD_ARTICLE: ApiArticle = {
  id: 'lead-01',
  slug: 'unforgiving-math-product-market-fit',
  title: 'The Unforgiving Math of Product-Market Fit',
  excerpt:
    'Why retention curves flatten or decay, and the unit economics teardown every Series A founder needs before scaling go-to-market.',
  coverUrl:
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
  readTimeMin: 7,
  publishedAt: '2026-11-01T08:00:00Z',
  tags: ['Deep Teardown', '4.9 Bookmark Score'],
  authorId: {
    id: 'auth-01',
    name: 'Naveen Jain',
    title: 'Managing Director, SOFE Ventures',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
};

const FALLBACK_BRIEFINGS: ApiArticle[] = [
  {
    id: 'brief-01',
    slug: 'cac-payback-under-9-months',
    title: 'Engineering CAC Payback Under 9 Months in Enterprise SaaS',
    excerpt: 'Contractual prepayment incentives and outbound SDR compensation frameworks.',
    coverUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    readTimeMin: 3,
    tags: ['Go-To-Market'],
    authorId: { id: 'auth-02', name: 'Priya Sharma', title: 'VP Growth' },
  },
  {
    id: 'brief-02',
    slug: 'term-sheet-liquidation-preferences',
    title: 'Liquidation Preferences & Participation: What Actually Dilutes You',
    excerpt:
      'Mathematical simulations of 1x non-participating vs 2x participating preference cascades.',
    coverUrl:
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    readTimeMin: 4,
    tags: ['Fundraising'],
    authorId: { id: 'auth-03', name: 'Arjun Mehta', title: 'Partner' },
  },
];

export default function StartupWorldFeedScreen() {
  const router = useRouter();
  const [selectedTopicSlug, setSelectedTopicSlug] = useState('all');
  const [topics, setTopics] = useState<ApiTopic[]>(FALLBACK_TOPICS);
  const [leadArticle, setLeadArticle] = useState<ApiArticle>(FALLBACK_LEAD_ARTICLE);
  const [briefings, setBriefings] = useState<ApiArticle[]>(FALLBACK_BRIEFINGS);
  const [recentArticles, setRecentArticles] = useState<ApiArticle[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [feedData, topicsData] = await Promise.allSettled([
        startupWorldApi.getFeed(),
        startupWorldApi.listTopics(false),
      ]);

      if (feedData.status === 'fulfilled' && feedData.value) {
        if (feedData.value.featured && feedData.value.featured.length > 0) {
          setLeadArticle(feedData.value.featured[0]);
          if (feedData.value.featured.length > 1) {
            setBriefings(feedData.value.featured.slice(1, 4));
          }
        }
        if (feedData.value.recent) {
          setRecentArticles(feedData.value.recent);
        }
      }

      if (topicsData.status === 'fulfilled' && topicsData.value && topicsData.value.length > 0) {
        setTopics([{ id: 'all', name: 'All Dispatches', slug: 'all' }, ...topicsData.value]);
      }

      // Check bookmark status for articles
      const checkBookmarks = new Set<string>();
      if (await isArticleSavedOffline(leadArticle.id)) checkBookmarks.add(leadArticle.id);
      for (const b of briefings) {
        if (await isArticleSavedOffline(b.id)) checkBookmarks.add(b.id);
      }
      setBookmarkedIds(checkBookmarks);
    } catch (err: unknown) {
      // Keep fallbacks active
      setError(err instanceof Error ? err.message : 'Unable to load live articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leadArticle.id, briefings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleBookmark = async (article: ApiArticle) => {
    const isSaved = bookmarkedIds.has(article.id);
    const updated = new Set(bookmarkedIds);
    if (isSaved) {
      updated.delete(article.id);
      setBookmarkedIds(updated);
      await removeArticleOffline(article.id);
      try {
        await startupWorldApi.removeBookmark(article.id);
      } catch {
        // silent offline fallback
      }
    } else {
      updated.add(article.id);
      setBookmarkedIds(updated);
      await saveArticleOffline({
        id: article.id,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        coverUrl: article.coverUrl,
        readTimeMin: article.readTimeMin,
        publishedAt: article.publishedAt,
        author: typeof article.authorId === 'object' ? article.authorId : undefined,
      });
      try {
        await startupWorldApi.saveBookmark('article', article.id);
      } catch {
        // silent offline fallback
      }
    }
  };

  const authorName =
    typeof leadArticle.authorId === 'object' ? leadArticle.authorId?.name : 'SOFE Editorial';
  const authorTitle =
    typeof leadArticle.authorId === 'object' ? leadArticle.authorId?.title : 'Venture Research';
  const authorAvatar =
    typeof leadArticle.authorId === 'object' ? leadArticle.authorId?.avatarUrl : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        variant="blog"
        sectionName="Startup World"
        onSearchPress={() => router.push('/startup-world/search' as never)}
      />

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
        {/* Navy Header Sub-banner */}
        <View style={styles.navyHero}>
          <View style={styles.cohortStreakRow}>
            <Text style={[typography.eyebrow, styles.cohortEyebrow]}>COHORT IX · WEEK 4</Text>
            <StreakChip days={26} />
          </View>
          <Text style={[typography.display, styles.heroTitle]}>Sofe — Blog</Text>
          <Text style={[typography.body, styles.heroSubtitle]}>
            Curated essays, teardowns and tactical dispatches for venture-backed founders.
          </Text>
        </View>

        {/* Action Strip: Issue Pill, Search & Bookmark Quick Buttons */}
        <View style={styles.actionStrip}>
          <View style={styles.issueRow}>
            <View style={styles.darkIssueChip}>
              <Text style={styles.darkIssueText}>ISSUE NO. 48</Text>
            </View>
            <Text style={[typography.caption, styles.curatedText]}>Weekly Curated</Text>
          </View>
          <View style={styles.iconButtonsGroup}>
            <TouchableOpacity
              style={styles.iconCircleButton}
              onPress={() => router.push('/startup-world/search' as never)}
              accessibilityLabel="Search dispatches"
            >
              <Search size={18} color={palette.navy} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircleButton}
              onPress={() => router.push('/startup-world/saved' as never)}
              accessibilityLabel="Saved articles"
            >
              <Bookmark size={18} color={palette.navy} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircleButton}
              onPress={() => router.push('/startup-world/topics' as never)}
              accessibilityLabel="Manage topics"
            >
              <SlidersHorizontal size={18} color={palette.navy} />
            </TouchableOpacity>
          </View>
        </View>

        {/* FilterChip Topics Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsScroll}
        >
          {topics.map((t) => (
            <FilterChip
              key={t.id}
              label={t.name}
              selected={selectedTopicSlug === t.slug}
              onPress={() => {
                if (t.slug === 'all') {
                  setSelectedTopicSlug('all');
                } else {
                  router.push(`/startup-world/topic/${t.slug}` as never);
                }
              }}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : error && !leadArticle ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <View style={styles.mainFeed}>
            {/* 4. Lead Essay Card */}
            <Card variant="white" style={styles.leadCard}>
              <View style={styles.leadImageContainer}>
                {leadArticle.coverUrl ? (
                  <Image
                    source={{ uri: leadArticle.coverUrl }}
                    style={styles.leadImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.leadImage, styles.placeholderImage]} />
                )}
                <View style={styles.leadLabelBadge}>
                  <Text style={styles.leadLabelText}>THIS WEEK&apos;S LEAD ESSAY</Text>
                </View>
              </View>

              <View style={styles.leadCardBody}>
                <View style={styles.tagChipsRow}>
                  <TagChip label="Deep Teardown" variant="orange" />
                  <TagChip label="4.9 bookmark score" variant="dark" />
                  <TimeChip label={`${leadArticle.readTimeMin} mins`} />
                </View>

                <Text style={[typography.title1, styles.leadTitle]}>{leadArticle.title}</Text>
                <Text style={[typography.body, styles.leadExcerpt]}>{leadArticle.excerpt}</Text>

                {/* Author row */}
                <View style={styles.authorRow}>
                  <Avatar name={authorName} uri={authorAvatar} size={32} />
                  <View style={styles.authorMeta}>
                    <Text style={[typography.caption, styles.authorName]}>{authorName}</Text>
                    <Text style={[typography.micro, styles.authorTitle]}>
                      {authorTitle} · {leadArticle.readTimeMin} min read
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookmarkAction}
                    onPress={() => toggleBookmark(leadArticle)}
                    accessibilityLabel="Bookmark article"
                  >
                    <Bookmark
                      size={20}
                      color={bookmarkedIds.has(leadArticle.id) ? palette.orangeDeep : palette.navy}
                      fill={bookmarkedIds.has(leadArticle.id) ? palette.orangeDeep : 'none'}
                    />
                  </TouchableOpacity>
                </View>

                <Button
                  variant="primary"
                  onPress={() => router.push(`/startup-world/article/${leadArticle.slug}` as never)}
                  style={styles.readFullButton}
                >
                  Read Full Dispatch →
                </Button>
              </View>
            </Card>

            {/* 5. Tactical Briefings Section with Orange Bar */}
            <SectionHeader
              title="Tactical Briefings"
              actionLabel="3-MIN TEARDOWNS"
              hasOrangeBar
              style={styles.sectionMargin}
            />

            {briefings.map((brief) => (
              <Card key={brief.id} variant="white" style={styles.briefingCard}>
                <View style={styles.briefingContent}>
                  <View style={styles.briefingHeaderRow}>
                    <TagChip label={brief.tags?.[0] || 'Briefing'} variant="dark" />
                    <TimeChip label={`${brief.readTimeMin} mins`} />
                  </View>
                  <Text style={[typography.title3, styles.briefingTitle]}>{brief.title}</Text>
                  <Text style={[typography.caption, styles.briefingExcerpt]}>{brief.excerpt}</Text>
                  <View style={styles.briefingFooter}>
                    <Text style={[typography.micro, styles.briefingByline]}>
                      By{' '}
                      {typeof brief.authorId === 'object' ? brief.authorId?.name : 'SOFE Research'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push(`/startup-world/article/${brief.slug}` as never)}
                    >
                      <Text style={[typography.caption, styles.analyzeLink]}>Analyze →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}

            {/* 6. Curated Series Card */}
            <Card variant="dark" style={styles.seriesCard}>
              <View style={styles.seriesEyebrowRow}>
                <Text style={[typography.eyebrow, styles.seriesEyebrow]}>
                  CURATED SERIES · MODULE 03
                </Text>
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>3 of 5 Completed</Text>
                </View>
              </View>
              <Text style={[typography.title2, styles.seriesTitle]}>
                The Founder-Led Sales Playbook
              </Text>
              <Text style={[typography.body, styles.seriesDescription]}>
                Transitioning from initial founder evangelism to scalable, repeatable revenue
                pipelines.
              </Text>
              <ProgressBar
                progress={60}
                leftLabel="Series Progress"
                style={styles.seriesProgress}
              />
            </Card>

            {/* 7. CourseCardRow-style Recent Articles */}
            {recentArticles.length > 0 && (
              <View style={styles.recentSection}>
                <SectionHeader title="Recent Dispatches" actionLabel="VIEW ARCHIVE" />
                {recentArticles.slice(0, 4).map((art) => (
                  <TouchableOpacity
                    key={art.id}
                    style={styles.recentArticleRow}
                    onPress={() => router.push(`/startup-world/article/${art.slug}` as never)}
                  >
                    <View style={styles.recentRowTextGroup}>
                      <Text style={[typography.caption, styles.recentTopic]}>
                        {typeof art.primaryTopicId === 'object'
                          ? art.primaryTopicId?.name?.toUpperCase()
                          : 'VENTURE ESSAY'}
                      </Text>
                      <Text style={[typography.title3, styles.recentTitle]}>{art.title}</Text>
                      <Text style={[typography.micro, styles.recentMeta]}>
                        {art.readTimeMin} min read · By{' '}
                        {typeof art.authorId === 'object' ? art.authorId?.name : 'SOFE Editorial'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleBookmark(art)}
                      style={styles.recentBookmarkBtn}
                    >
                      <Bookmark
                        size={18}
                        color={bookmarkedIds.has(art.id) ? palette.orangeDeep : palette.navy}
                        fill={bookmarkedIds.has(art.id) ? palette.orangeDeep : 'none'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 8. QuoteCard */}
            <QuoteCard
              quote="The greatest startup risk is not execution failure; it is building something nobody actually wants."
              author="Marc Andreessen"
              authorRole="General Partner, a16z"
              style={styles.quoteMargin}
            />

            {/* 9. NewsletterCard */}
            <NewsletterCard
              headline="THE SATURDAY DISPATCH"
              body="Every Saturday morning, receive 2 deep teardowns and 3 tactical execution memos direct to your inbox."
              style={styles.newsletterMargin}
            />
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  navyHero: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  cohortStreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cohortEyebrow: {
    color: palette.gold,
  },
  heroTitle: {
    color: palette.white,
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    color: palette.cream,
    opacity: 0.85,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.cream,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  darkIssueChip: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  darkIssueText: {
    ...typography.micro,
    color: palette.white,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  curatedText: {
    color: palette.navy,
    fontWeight: '600',
  },
  iconButtonsGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  topicsScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  loadingContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  mainFeed: {
    paddingHorizontal: spacing.lg,
  },
  leadCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  leadImageContainer: {
    height: 190,
    width: '100%',
    position: 'relative',
  },
  leadImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: palette.navy,
  },
  leadLabelBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: palette.orange,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.xs,
  },
  leadLabelText: {
    ...typography.micro,
    color: palette.navy,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  leadCardBody: {
    padding: spacing.md,
  },
  tagChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  leadTitle: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  leadExcerpt: {
    color: palette.navy,
    opacity: 0.8,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    marginBottom: spacing.md,
  },
  authorMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    color: palette.navy,
    fontWeight: '700',
  },
  authorTitle: {
    color: palette.navy,
    opacity: 0.6,
  },
  bookmarkAction: {
    padding: spacing.xs,
  },
  readFullButton: {
    width: '100%',
  },
  sectionMargin: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  briefingCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  briefingContent: {
    gap: spacing.xs,
  },
  briefingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  briefingTitle: {
    color: palette.navy,
    marginTop: spacing.xs,
  },
  briefingExcerpt: {
    color: palette.navy,
    opacity: 0.75,
    lineHeight: 18,
  },
  briefingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  briefingByline: {
    color: palette.navy,
    opacity: 0.6,
  },
  analyzeLink: {
    color: palette.orangeDeep,
    fontWeight: '700',
  },
  seriesCard: {
    padding: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: palette.navy,
  },
  seriesEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  seriesEyebrow: {
    color: palette.gold,
  },
  completedPill: {
    backgroundColor: palette.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  completedPillText: {
    ...typography.micro,
    color: palette.navy,
    fontWeight: '700',
  },
  seriesTitle: {
    color: palette.white,
    marginTop: spacing.xs,
  },
  seriesDescription: {
    color: palette.cream,
    opacity: 0.85,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  seriesProgress: {
    marginTop: spacing.xs,
  },
  recentSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  recentArticleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  recentRowTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  recentTopic: {
    color: palette.orangeDeep,
    fontWeight: '700',
    marginBottom: 2,
  },
  recentTitle: {
    color: palette.navy,
  },
  recentMeta: {
    color: palette.navy,
    opacity: 0.6,
    marginTop: 2,
  },
  recentBookmarkBtn: {
    padding: spacing.xs,
  },
  quoteMargin: {
    marginVertical: spacing.lg,
  },
  newsletterMargin: {
    marginBottom: spacing.xl,
  },
});
