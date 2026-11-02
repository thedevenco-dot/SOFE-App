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
  Button,
  Card,
  EmptyState,
  ErrorState,
  FollowButton,
  SearchBar,
  SkeletonCard,
  TagChip,
  TimeChip,
} from '../../../src/components';
import { startupWorldApi, ApiArticle, ApiTopic } from '../../../src/lib/startup-world-api';
import {
  saveArticleOffline,
  removeArticleOffline,
  isArticleSavedOffline,
} from '../../../src/lib/offline-articles';

export default function TopicFeedScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [topic, setTopic] = useState<ApiTopic | null>(null);
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopicAndArticles = useCallback(async () => {
    if (!slug) return;
    try {
      setError(null);
      const [topicsRes, articlesRes, followedRes] = await Promise.allSettled([
        startupWorldApi.listTopics(false),
        startupWorldApi.listArticles({ topic: slug }),
        startupWorldApi.getFollowedTopics(),
      ]);

      let currentTopic: ApiTopic | null = null;
      if (topicsRes.status === 'fulfilled' && topicsRes.value) {
        currentTopic = topicsRes.value.find((t) => t.slug === slug) ?? null;
      }

      if (!currentTopic) {
        currentTopic = {
          id: String(slug),
          name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug,
          description: `Strategic insights, tactical teardowns and founder playbooks covering ${slug.replace(/-/g, ' ')}.`,
        };
      }
      setTopic(currentTopic);

      if (followedRes.status === 'fulfilled' && followedRes.value && currentTopic) {
        setIsFollowing(followedRes.value.includes(currentTopic.id));
      }

      if (articlesRes.status === 'fulfilled' && articlesRes.value?.data) {
        setArticles(articlesRes.value.data);

        const savedSet = new Set<string>();
        for (const a of articlesRes.value.data) {
          if (await isArticleSavedOffline(a.id)) savedSet.add(a.id);
        }
        setBookmarkedIds(savedSet);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load topic');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    loadTopicAndArticles();
  }, [loadTopicAndArticles]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTopicAndArticles();
  };

  const toggleFollow = async () => {
    if (!topic) return;
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      if (next) {
        await startupWorldApi.followTopic(topic.id);
      } else {
        await startupWorldApi.unfollowTopic(topic.id);
      }
    } catch {
      // rollback on failure
      setIsFollowing(!next);
    }
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
        primaryTopic: topic ? { id: topic.id, name: topic.name, slug: topic.slug } : undefined,
      });
      try {
        await startupWorldApi.saveBookmark('article', article.id);
      } catch {
        // silent offline fallback
      }
    }
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title3, styles.navTitle]} numberOfLines={1}>
          {topic?.name || 'Topic'}
        </Text>
        <FollowButton isFollowing={isFollowing} onPress={toggleFollow} />
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
        {/* Topic Header Card */}
        <View style={styles.headerBlock}>
          <Text style={[typography.caption, styles.eyebrow]}>TOPIC FOCUS</Text>
          <Text style={[typography.display, styles.topicName]}>{topic?.name}</Text>
          {topic?.description ? (
            <Text style={[typography.body, styles.topicDescription]}>{topic.description}</Text>
          ) : null}
          <Text style={[typography.micro, styles.metaCount]}>
            {articles.length} {articles.length === 1 ? 'Dispatch' : 'Dispatches'} Published
          </Text>
        </View>

        {/* Filter / Search within topic */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${topic?.name || 'topic'}...`}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={loadTopicAndArticles} />
        ) : filteredArticles.length === 0 ? (
          <EmptyState
            title="No dispatches found"
            description={
              searchQuery
                ? `No articles match "${searchQuery}" in this topic.`
                : 'No articles have been published in this topic yet.'
            }
          />
        ) : (
          <View style={styles.articlesList}>
            {filteredArticles.map((art) => (
              <Card key={art.id} variant="white" style={styles.articleCard}>
                {art.coverUrl ? (
                  <Image
                    source={{ uri: art.coverUrl }}
                    style={styles.coverThumbnail}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.articleCardBody}>
                  <View style={styles.metaRow}>
                    <TagChip label={topic?.name || 'Topic'} variant="dark" />
                    <TimeChip label={`${art.readTimeMin} mins`} />
                  </View>
                  <Text style={[typography.title2, styles.articleTitle]}>{art.title}</Text>
                  <Text style={[typography.body, styles.articleExcerpt]} numberOfLines={3}>
                    {art.excerpt}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[typography.caption, styles.authorText]}>
                      By {typeof art.authorId === 'object' ? art.authorId?.name : 'SOFE Editorial'}
                    </Text>
                    <View style={styles.footerActions}>
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
                      <Button
                        variant="ghost"
                        onPress={() => router.push(`/startup-world/article/${art.slug}` as never)}
                      >
                        Read →
                      </Button>
                    </View>
                  </View>
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
  navBar: {
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
    marginRight: spacing.sm,
  },
  navTitle: {
    flex: 1,
    color: palette.navy,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerBlock: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    color: palette.gold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  topicName: {
    color: palette.white,
    marginTop: spacing.xs,
  },
  topicDescription: {
    color: palette.cream,
    opacity: 0.85,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  metaCount: {
    color: palette.gold,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  articlesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  articleCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  coverThumbnail: {
    width: '100%',
    height: 160,
  },
  articleCardBody: {
    padding: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  articleTitle: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  articleExcerpt: {
    color: palette.navy,
    opacity: 0.75,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  authorText: {
    color: palette.navy,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bookmarkButton: {
    padding: spacing.xs,
  },
});
