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
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { palette, radius, spacing, colorRoles } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  Button,
  Card,
  EmptyState,
  FilterChip,
  OfflineBanner,
  SkeletonCard,
  TagChip,
  TimeChip,
} from '../../src/components';
import { startupWorldApi } from '../../src/lib/startup-world-api';
import {
  getOfflineArticles,
  removeArticleOffline,
  saveArticleOffline,
  OfflineArticle,
} from '../../src/lib/offline-articles';

export default function SavedArticlesScreen() {
  const router = useRouter();
  const [offlineArticles, setOfflineArticles] = useState<OfflineArticle[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'offline'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const loadSavedArticles = useCallback(async () => {
    try {
      setLoading(true);
      // Always load local offline items first
      const localItems = await getOfflineArticles();
      setOfflineArticles(localItems);

      // Attempt to sync with backend bookmarks if online
      try {
        const bookmarks = await startupWorldApi.listBookmarks('article');
        if (bookmarks && bookmarks.length > 0) {
          // Cache any server bookmarks locally
          for (const bm of bookmarks) {
            if (bm.target && !localItems.some((l) => l.id === bm.targetId)) {
              await saveArticleOffline({
                id: bm.target.id,
                slug: bm.target.slug,
                title: bm.target.title,
                excerpt: bm.target.excerpt,
                bodyHtml: bm.target.bodyHtml,
                coverUrl: bm.target.coverUrl,
                readTimeMin: bm.target.readTimeMin,
                publishedAt: bm.target.publishedAt,
                author: typeof bm.target.authorId === 'object' ? bm.target.authorId : undefined,
              });
            }
          }
          const updatedLocal = await getOfflineArticles();
          setOfflineArticles(updatedLocal);
        }
        setIsOfflineMode(false);
      } catch {
        // Network unavailable: offline mode active
        setIsOfflineMode(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSavedArticles();
  }, [loadSavedArticles]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSavedArticles();
  };

  const handleRemove = async (article: OfflineArticle) => {
    await removeArticleOffline(article.id);
    setOfflineArticles((prev) => prev.filter((a) => a.id !== article.id));
    try {
      await startupWorldApi.removeBookmark(article.id);
    } catch {
      // offline delete
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
        <Text style={[typography.title3, styles.navTitle]}>Saved Dispatches</Text>
        <View style={styles.placeholderIcon} />
      </View>

      {isOfflineMode && (
        <OfflineBanner
          message="Offline Mode: Displaying articles stored on your device."
          style={styles.offlineBanner}
        />
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <FilterChip
          label={`All Saved (${offlineArticles.length})`}
          selected={activeTab === 'all'}
          onPress={() => setActiveTab('all')}
        />
        <FilterChip
          label="Offline Ready"
          selected={activeTab === 'offline'}
          onPress={() => setActiveTab('offline')}
        />
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : offlineArticles.length === 0 ? (
          <EmptyState
            title="No saved dispatches"
            description="Articles you bookmark or save for offline reading will appear here."
            actionLabel="Explore Dispatches"
            onAction={() => router.push('/(tabs)/startup-world' as never)}
          />
        ) : (
          <View style={styles.articlesList}>
            {offlineArticles.map((art) => (
              <Card key={art.id} variant="white" style={styles.articleCard}>
                {art.coverUrl ? (
                  <Image
                    source={{ uri: art.coverUrl }}
                    style={styles.coverThumbnail}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={styles.cardBody}>
                  <View style={styles.metaRow}>
                    <TagChip label="Offline Ready" variant="orange" />
                    <TimeChip label={`${art.readTimeMin} mins`} />
                  </View>

                  <Text style={[typography.title2, styles.title]}>{art.title}</Text>
                  <Text style={[typography.body, styles.excerpt]} numberOfLines={2}>
                    {art.excerpt}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={[typography.micro, styles.savedDate]}>
                      Saved on {new Date(art.savedAt).toLocaleDateString()}
                    </Text>

                    <View style={styles.actionGroup}>
                      <TouchableOpacity
                        onPress={() => handleRemove(art)}
                        style={styles.removeBtn}
                        accessibilityLabel="Remove bookmark"
                      >
                        <Trash2 size={16} color={colorRoles.errorOnLight} />
                      </TouchableOpacity>
                      <Button
                        variant="primary"
                        onPress={() => router.push(`/startup-world/article/${art.slug}` as never)}
                      >
                        Read Now →
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
  placeholderIcon: {
    width: 24,
  },
  offlineBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
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
    height: 140,
  },
  cardBody: {
    padding: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  excerpt: {
    color: palette.navy,
    opacity: 0.75,
    lineHeight: 18,
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
  savedDate: {
    color: palette.navy,
    opacity: 0.6,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  removeBtn: {
    padding: spacing.xs,
  },
});
