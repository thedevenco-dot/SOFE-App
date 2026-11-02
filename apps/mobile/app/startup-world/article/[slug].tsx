import React, { useState, useEffect, useCallback } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Share2 } from 'lucide-react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../../../src/theme/typography';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  OfflineBanner,
  ProgressBar,
  QuoteBox,
  SkeletonCard,
  TagChip,
  TimeChip,
} from '../../../src/components';
import { startupWorldApi, ApiArticle } from '../../../src/lib/startup-world-api';
import {
  saveArticleOffline,
  removeArticleOffline,
  getOfflineArticleBySlug,
  OfflineArticle,
} from '../../../src/lib/offline-articles';

// Clean text renderer for html/plain content
function parseParagraphs(htmlOrText: string): string[] {
  if (!htmlOrText) return [];
  const stripped = htmlOrText.replace(/<[^>]+>/g, '\n');
  return stripped
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export default function ArticleReaderScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [article, setArticle] = useState<ApiArticle | OfflineArticle | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [isOfflineSource, setIsOfflineSource] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);

      // Check if already in local offline storage first
      const offlineDoc = await getOfflineArticleBySlug(slug);
      if (offlineDoc) {
        setIsSavedOffline(true);
      }

      try {
        const liveDoc = await startupWorldApi.getArticleBySlug(slug);
        setArticle(liveDoc);
        setIsOfflineSource(false);
      } catch (networkErr: unknown) {
        // Fallback to offline stored version if network failed
        if (offlineDoc) {
          setArticle(offlineDoc);
          setIsOfflineSource(true);
        } else {
          throw networkErr;
        }
      }
    } catch (err: unknown) {
      // If network failed and no offline copy
      const cached = await getOfflineArticleBySlug(slug);
      if (cached) {
        setArticle(cached);
        setIsOfflineSource(true);
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load article');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollableDistance = contentSize.height - layoutMeasurement.height;
    if (scrollableDistance > 0) {
      const progress = Math.min(100, Math.max(0, (contentOffset.y / scrollableDistance) * 100));
      setReadingProgress(progress);
    }
  };

  const toggleSaveOffline = async () => {
    if (!article) return;
    if (isSavedOffline) {
      await removeArticleOffline(article.slug);
      setIsSavedOffline(false);
      try {
        await startupWorldApi.removeBookmark(article.id);
      } catch {
        // ignore offline delete error
      }
    } else {
      const authorToSave =
        'authorId' in article && typeof article.authorId === 'object'
          ? article.authorId
          : 'author' in article
            ? article.author
            : undefined;

      await saveArticleOffline({
        id: article.id,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        bodyHtml: article.bodyHtml,
        coverUrl: article.coverUrl,
        readTimeMin: article.readTimeMin,
        publishedAt: article.publishedAt,
        author: authorToSave,
      });
      setIsSavedOffline(true);
      try {
        await startupWorldApi.saveBookmark('article', article.id);
      } catch {
        // ignore offline save error
      }
    }
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead this on SOFE Startup World: https://sofe.app/article/${article.slug}`,
      });
    } catch {
      // share dismissed
    }
  };

  const authorObj =
    article && 'authorId' in article && typeof article.authorId === 'object'
      ? article.authorId
      : article && 'author' in article
        ? article.author
        : undefined;

  const authorName = authorObj?.name || 'SOFE Editorial';
  const authorTitle = authorObj?.title || 'Venture Research';
  const authorBio =
    authorObj?.bio ||
    'Curating venture frameworks, tactical teardowns, and deep dives for founders.';
  const authorAvatar = authorObj?.avatarUrl;

  const topicName =
    article && 'primaryTopicId' in article && typeof article.primaryTopicId === 'object'
      ? article.primaryTopicId?.name
      : article && 'primaryTopic' in article
        ? article.primaryTopic?.name
        : 'Venture Strategy';

  const paragraphs = article?.bodyHtml
    ? parseParagraphs(article.bodyHtml)
    : parseParagraphs(article?.excerpt || '');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navIconButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>

        <Text style={[typography.caption, styles.navCategory]} numberOfLines={1}>
          {topicName?.toUpperCase()}
        </Text>

        <View style={styles.navActions}>
          <TouchableOpacity
            onPress={toggleSaveOffline}
            style={styles.navIconButton}
            accessibilityLabel={isSavedOffline ? 'Remove from offline' : 'Save for offline'}
          >
            <Bookmark
              size={20}
              color={isSavedOffline ? palette.orangeDeep : palette.navy}
              fill={isSavedOffline ? palette.orangeDeep : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.navIconButton}
            accessibilityLabel="Share article"
          >
            <Share2 size={20} color={palette.navy} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reading Progress Indicator */}
      <ProgressBar progress={readingProgress} height={3} style={styles.readingProgressBar} />

      {/* Offline Notice */}
      {isOfflineSource && (
        <OfflineBanner
          message="Viewing offline copy. Connect to the internet to sync updates."
          style={styles.offlineNotice}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error || !article ? (
        <ErrorState message={error || 'Article not found'} onRetry={loadArticle} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Header Image */}
          {article.coverUrl ? (
            <View style={styles.coverContainer}>
              <Image
                source={{ uri: article.coverUrl }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            </View>
          ) : null}

          <View style={styles.articleBody}>
            {/* Meta Tags Row */}
            <View style={styles.tagRow}>
              <TagChip label={topicName || 'Venture Strategy'} variant="orange" />
              <TimeChip label={`${article.readTimeMin} mins`} />
              {isSavedOffline && <TagChip label="Saved Offline" variant="dark" />}
            </View>

            {/* Display Title & Subtitle */}
            <Text style={[typography.display, styles.articleTitle]}>{article.title}</Text>
            {article.excerpt ? (
              <Text style={[typography.body, styles.articleExcerpt]}>{article.excerpt}</Text>
            ) : null}

            {/* Author Byline Row */}
            <View style={styles.bylineRow}>
              <Avatar name={authorName} uri={authorAvatar} size={44} />
              <View style={styles.bylineMeta}>
                <Text style={[typography.bodyStrong, styles.bylineName]}>{authorName}</Text>
                <Text style={[typography.caption, styles.bylineTitle]}>
                  {authorTitle} · {article.readTimeMin} min read
                </Text>
              </View>
            </View>

            {/* Main Content Blocks */}
            <View style={styles.contentBlocks}>
              {paragraphs.map((p, idx) => (
                <Text key={idx} style={[typography.body, styles.paragraph]}>
                  {p}
                </Text>
              ))}

              {/* Key Takeaways Callout */}
              <QuoteBox
                quote="Focus on high-velocity learning loops. In early stages, speed of customer iteration compounds faster than any advertising spend."
                author={authorName}
                style={styles.calloutQuote}
              />

              <Text style={[typography.body, styles.paragraph]}>
                Review your unit economics monthly against cohort survival rates. When product pull
                is authentic, customers proactively recommend the product without unprompted
                referral incentives.
              </Text>
            </View>

            {/* Offline Save Toggle Banner */}
            <Card variant="tint" style={styles.offlineActionCard}>
              <View style={styles.offlineCardText}>
                <Text style={[typography.title3, styles.offlineCardTitle]}>
                  {isSavedOffline ? 'Saved for Offline Reading' : 'Save for Offline Reading'}
                </Text>
                <Text style={[typography.caption, styles.offlineCardSubtitle]}>
                  {isSavedOffline
                    ? 'This dispatch is stored on your device and can be read anytime without internet.'
                    : 'Download full essay and metrics to read on flights or offline.'}
                </Text>
              </View>
              <Button
                variant={isSavedOffline ? 'secondary' : 'primary'}
                onPress={toggleSaveOffline}
              >
                {isSavedOffline ? 'Remove Offline' : 'Save Offline'}
              </Button>
            </Card>

            {/* Author Card Footer */}
            {authorObj?.id && (
              <Card variant="white" style={styles.authorFooterCard}>
                <View style={styles.authorCardHeader}>
                  <Avatar name={authorName} uri={authorAvatar} size={44} />
                  <View style={styles.authorCardMeta}>
                    <Text style={[typography.title3, styles.authorCardName]}>{authorName}</Text>
                    <Text style={[typography.caption, styles.authorCardRole]}>{authorTitle}</Text>
                  </View>
                </View>
                <Text style={[typography.body, styles.authorCardBio]}>{authorBio}</Text>
                <Button
                  variant="ghost"
                  onPress={() => router.push(`/startup-world/author/${authorObj.id}` as never)}
                  style={styles.authorProfileButton}
                >
                  View Author Profile →
                </Button>
              </Card>
            )}
          </View>
        </ScrollView>
      )}
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
    backgroundColor: palette.cream,
  },
  navIconButton: {
    padding: spacing.xs,
  },
  navCategory: {
    color: palette.orangeDeep,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readingProgressBar: {
    width: '100%',
  },
  offlineNotice: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  coverContainer: {
    width: '100%',
    height: 220,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  articleBody: {
    padding: spacing.lg,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  articleTitle: {
    color: palette.navy,
    marginBottom: spacing.sm,
  },
  articleExcerpt: {
    color: palette.navy,
    opacity: 0.85,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.line,
    marginBottom: spacing.lg,
  },
  bylineMeta: {
    marginLeft: spacing.md,
  },
  bylineName: {
    color: palette.navy,
  },
  bylineTitle: {
    color: palette.navy,
    opacity: 0.6,
  },
  contentBlocks: {
    gap: spacing.md,
  },
  paragraph: {
    color: palette.navy,
    lineHeight: 24,
  },
  calloutQuote: {
    marginVertical: spacing.md,
  },
  offlineActionCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  offlineCardText: {
    marginBottom: spacing.md,
  },
  offlineCardTitle: {
    color: palette.navy,
    marginBottom: 4,
  },
  offlineCardSubtitle: {
    color: palette.navy,
    opacity: 0.75,
    lineHeight: 18,
  },
  authorFooterCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  authorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorCardMeta: {
    marginLeft: spacing.md,
  },
  authorCardName: {
    color: palette.navy,
  },
  authorCardRole: {
    color: palette.navy,
    opacity: 0.6,
  },
  authorCardBio: {
    color: palette.navy,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  authorProfileButton: {
    alignSelf: 'flex-start',
  },
});
