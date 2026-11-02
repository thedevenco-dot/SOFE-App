import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { palette, radius, spacing, colorRoles } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  Card,
  EmptyState,
  FilterChip,
  SearchBar,
  SkeletonCard,
  TagChip,
  TimeChip,
} from '../../src/components';
import { startupWorldApi, ApiArticle } from '../../src/lib/startup-world-api';

const DEFAULT_RECENT_QUERIES = [
  'Product-Market Fit',
  'CAC Payback',
  'Liquidation Preferences',
  'Founder-Led Sales',
];

export default function StartupWorldSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'article'>('all');
  const [recentQueries, setRecentQueries] = useState<string[]>(DEFAULT_RECENT_QUERIES);
  const [results, setResults] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = useCallback(async (searchKey: string) => {
    if (!searchKey.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const searchRes = await startupWorldApi.search(searchKey, 'article');
      if (searchRes?.articles) {
        setResults(searchRes.articles);
      } else {
        const feed = await startupWorldApi.getFeed();
        const combined = [...(feed.featured || []), ...(feed.recent || [])];
        const filtered = combined.filter(
          (a) =>
            a.title.toLowerCase().includes(searchKey.toLowerCase()) ||
            a.excerpt.toLowerCase().includes(searchKey.toLowerCase()),
        );
        setResults(filtered);
      }

      setRecentQueries((prev) => {
        const cleaned = prev.filter((q) => q.toLowerCase() !== searchKey.toLowerCase());
        return [searchKey, ...cleaned].slice(0, 6);
      });
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        executeSearch(query);
      } else if (query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  const clearRecentQueries = () => {
    setRecentQueries([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Search Input Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search teardowns, topics, authors..."
          />
        </View>
      </View>

      {/* Filter Type Chips */}
      <View style={styles.filterStrip}>
        <FilterChip
          label="All Dispatches"
          selected={activeType === 'all'}
          onPress={() => setActiveType('all')}
        />
        <FilterChip
          label="Teardowns"
          selected={activeType === 'article'}
          onPress={() => setActiveType('article')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recent Searches */}
        {!hasSearched && query.length === 0 && recentQueries.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={[typography.caption, styles.recentTitle]}>RECENT SEARCHES</Text>
              <TouchableOpacity onPress={clearRecentQueries}>
                <Text style={[typography.micro, styles.clearText]}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentChipsWrap}>
              {recentQueries.map((rq, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentQueryChip}
                  onPress={() => {
                    setQuery(rq);
                    executeSearch(rq);
                  }}
                >
                  <Clock size={12} color={palette.navy} />
                  <Text style={[typography.caption, styles.recentQueryText]}>{rq}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : hasSearched && results.length === 0 ? (
          <EmptyState
            title="No matching dispatches"
            description={`We couldn't find any dispatches matching "${query}". Try searching for terms like "Fundraising", "PMF", or "Sales".`}
          />
        ) : (
          <View style={styles.resultsList}>
            {hasSearched && (
              <Text style={[typography.caption, styles.resultsCount]}>
                Found {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;
                {query}&rdquo;
              </Text>
            )}

            {results.map((art) => (
              <Card key={art.id} variant="white" style={styles.resultCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/startup-world/article/${art.slug}` as never)}
                  style={styles.cardTouchArea}
                >
                  <View style={styles.metaRow}>
                    <TagChip label="Dispatch" variant="orange" />
                    <TimeChip label={`${art.readTimeMin} mins`} />
                  </View>
                  <Text style={[typography.title2, styles.artTitle]}>{art.title}</Text>
                  <Text style={[typography.body, styles.artExcerpt]} numberOfLines={2}>
                    {art.excerpt}
                  </Text>
                  <View style={styles.resultFooter}>
                    <Text style={[typography.caption, styles.authorName]}>
                      By {typeof art.authorId === 'object' ? art.authorId?.name : 'SOFE Editorial'}
                    </Text>
                    <Text style={[typography.caption, styles.readLink]}>Read →</Text>
                  </View>
                </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  backButton: {
    padding: spacing.xs,
  },
  searchBarWrapper: {
    flex: 1,
  },
  filterStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  recentSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentTitle: {
    color: palette.navy,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  clearText: {
    color: colorRoles.errorOnLight,
    fontWeight: '600',
  },
  recentChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  recentQueryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: palette.line,
  },
  recentQueryText: {
    color: palette.navy,
  },
  loadingContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  resultsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  resultsCount: {
    color: palette.navy,
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
  resultCard: {
    padding: spacing.md,
  },
  cardTouchArea: {
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  artTitle: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  artExcerpt: {
    color: palette.navy,
    opacity: 0.75,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  authorName: {
    color: palette.navy,
    fontWeight: '600',
  },
  readLink: {
    color: palette.orangeDeep,
    fontWeight: '700',
  },
});
