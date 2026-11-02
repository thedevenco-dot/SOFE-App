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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../../../src/theme/typography';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FollowButton,
  SkeletonCard,
  TimeChip,
} from '../../../src/components';
import { startupWorldApi, ApiArticle, ApiAuthor } from '../../../src/lib/startup-world-api';
import {
  saveArticleOffline,
  removeArticleOffline,
  isArticleSavedOffline,
} from '../../../src/lib/offline-articles';

export default function AuthorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [author, setAuthor] = useState<ApiAuthor | null>(null);
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAuthorData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [authorRes, articlesRes] = await Promise.allSettled([
        startupWorldApi.getAuthorById(id),
        startupWorldApi.listArticles({ limit: 30 }),
      ]);

      if (authorRes.status === 'fulfilled' && authorRes.value) {
        setAuthor(authorRes.value);
      } else {
        // Fallback author
        setAuthor({
          id,
          name: 'Naveen Jain',
          title: 'Managing Director, SOFE Ventures',
          bio: 'Writing on seed diligence, PMF inflection metrics, and building defensible moats.',
        });
      }

      if (articlesRes.status === 'fulfilled' && articlesRes.value?.data) {
        const authorArticles = articlesRes.value.data.filter((a) => {
          if (typeof a.authorId === 'object') return a.authorId?.id === id;
          return a.authorId === id;
        });
        setArticles(
          authorArticles.length > 0 ? authorArticles : articlesRes.value.data.slice(0, 5),
        );

        const savedSet = new Set<string>();
        for (const a of articlesRes.value.data) {
          if (await isArticleSavedOffline(a.id)) savedSet.add(a.id);
        }
        setBookmarkedIds(savedSet);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load author');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadAuthorData();
  }, [loadAuthorData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAuthorData();
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
        // ignore offline delete error
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
        author: author || undefined,
      });
      try {
        await startupWorldApi.saveBookmark('article', article.id);
      } catch {
        // ignore offline save error
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title3, styles.navTitle]} numberOfLines={1}>
          Author Profile
        </Text>
        <FollowButton isFollowing={isFollowing} onPress={() => setIsFollowing(!isFollowing)} />
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
        {/* Author Header Banner */}
        <View style={styles.authorHeader}>
          <Avatar name={author?.name || 'Author'} uri={author?.avatarUrl} size={96} hasOrangeRing />
          <Text style={[typography.title1, styles.authorName]}>{author?.name}</Text>
          <Text style={[typography.caption, styles.authorRole]}>{author?.title}</Text>
          {author?.bio && <Text style={[typography.body, styles.authorBio]}>{author.bio}</Text>}
        </View>

        <View style={styles.articlesSection}>
          <Text style={[typography.title2, styles.sectionTitle]}>
            Published Dispatches ({articles.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={loadAuthorData} />
          ) : articles.length === 0 ? (
            <EmptyState
              title="No articles yet"
              description="This author has not published any articles yet."
            />
          ) : (
            articles.map((art) => (
              <Card key={art.id} variant="white" style={styles.articleCard}>
                {art.coverUrl ? (
                  <Image
                    source={{ uri: art.coverUrl }}
                    style={styles.coverThumbnail}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.cardContent}>
                  <View style={styles.metaRow}>
                    <TimeChip label={`${art.readTimeMin} mins`} />
                    <TouchableOpacity
                      onPress={() => toggleBookmark(art)}
                      style={styles.bookmarkButton}
                      accessibilityLabel="Bookmark article"
                    >
                      <Bookmark
                        size={18}
                        color={bookmarkedIds.has(art.id) ? palette.orangeDeep : palette.navy}
                        fill={bookmarkedIds.has(art.id) ? palette.orangeDeep : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[typography.title3, styles.articleTitle]}>{art.title}</Text>
                  <Text style={[typography.body, styles.articleExcerpt]} numberOfLines={2}>
                    {art.excerpt}
                  </Text>
                  <Button
                    variant="ghost"
                    onPress={() => router.push(`/startup-world/article/${art.slug}` as never)}
                    style={styles.readButton}
                  >
                    Read Dispatch →
                  </Button>
                </View>
              </Card>
            ))
          )}
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
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  backButton: {
    padding: spacing.xs,
  },
  navTitle: {
    color: palette.navy,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  authorHeader: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  authorName: {
    color: palette.white,
    marginTop: spacing.md,
  },
  authorRole: {
    color: palette.gold,
    marginTop: 2,
    fontWeight: '600',
  },
  authorBio: {
    color: palette.cream,
    opacity: 0.85,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    maxWidth: 320,
  },
  articlesSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  loadingContainer: {
    gap: spacing.md,
  },
  articleCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  coverThumbnail: {
    width: '100%',
    height: 140,
  },
  cardContent: {
    padding: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bookmarkButton: {
    padding: spacing.xs,
  },
  articleTitle: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  articleExcerpt: {
    color: palette.navy,
    opacity: 0.75,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  readButton: {
    alignSelf: 'flex-start',
  },
});
