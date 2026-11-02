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
import { ArrowLeft, BookOpen, Search } from 'lucide-react-native';
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
import { learnApi, ApiBook } from '../../src/lib/learn-api';

const MOCK_BOOKS: ApiBook[] = [
  {
    id: 'b-1',
    slug: 'the-venture-handbook',
    title: 'The Venture Handbook: Seed to Series B',
    author: 'Naveen Jain & SOFE Editorial',
    coverUrl:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    descriptionHtml:
      'The complete operator manual covering governance, equity matrices, early board dynamics, and investor reporting rhythms.',
    format: 'pdf',
    isFree: true,
  },
  {
    id: 'b-2',
    slug: 'high-growth-handbook-executive-summary',
    title: 'High Growth Operations: Executive Summary',
    author: 'Elena Rostova',
    coverUrl:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    descriptionHtml:
      'A concise 20-minute synthesis on org chart restructuring when scaling from 20 to 100 employees without culture degradation.',
    format: 'summary',
    isFree: true,
  },
  {
    id: 'b-3',
    slug: 'b2b-saas-playbook',
    title: 'B2B SaaS GTM Playbook & Sales Scripts',
    author: 'Rachel Vance',
    coverUrl:
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    descriptionHtml:
      'Verbatim objection handling scripts, cold outbound sequence templates, and contract negotiation guides for enterprise sales.',
    format: 'pdf',
    isFree: false,
    priceInr: 199900,
  },
  {
    id: 'b-4',
    slug: 'the-term-sheet-compendium',
    title: 'The Term Sheet Compendium & SAFE Teardowns',
    author: 'Arjun Mehta',
    coverUrl:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    descriptionHtml:
      'Line-by-line legal breakdowns of liquidation preferences, pro-rata rights, and protective provisions for seed founders.',
    format: 'summary',
    isFree: true,
  },
];

export default function BooksListScreen() {
  const router = useRouter();

  const [books, setBooks] = useState<ApiBook[]>(MOCK_BOOKS);
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'pdf' | 'summary'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await learnApi.listBooks({
        format: selectedFormat === 'all' ? undefined : selectedFormat,
      });

      if (res?.data?.length > 0) {
        setBooks(res.data);
      } else {
        const filtered = MOCK_BOOKS.filter((b) => {
          if (selectedFormat !== 'all' && b.format !== selectedFormat) return false;
          return true;
        });
        setBooks(filtered.length > 0 ? filtered : MOCK_BOOKS);
      }
    } catch {
      setError('Unable to load latest books. Showing offline library.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFormat]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
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
        <Text style={[typography.title, styles.navTitle]}>Books & Field Guides</Text>
        <TouchableOpacity
          onPress={() => router.push('/learn/search' as never)}
          style={styles.navButton}
          accessibilityLabel="Search library"
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
        {/* Format Selector Pills */}
        <View style={styles.formatTabs}>
          <FilterChip
            label="All Guides"
            selected={selectedFormat === 'all'}
            onPress={() => setSelectedFormat('all')}
          />
          <FilterChip
            label="Executive Summaries"
            selected={selectedFormat === 'summary'}
            onPress={() => setSelectedFormat('summary')}
          />
          <FilterChip
            label="Handbooks & PDFs"
            selected={selectedFormat === 'pdf'}
            onPress={() => setSelectedFormat('pdf')}
          />
        </View>

        {/* Count statement */}
        <View style={styles.countRow}>
          <Text style={[typography.bodySmall, styles.countText]}>
            {loading ? 'Fetching library...' : `${books.length} publications available`}
          </Text>
        </View>

        {/* Error notification */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState message={error} retryLabel="Retry" onRetry={loadBooks} />
          </View>
        ) : null}

        {/* Book Cards */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : books.length === 0 ? (
          <EmptyState
            title="No Guides Available"
            description="No publications found for the selected format filter."
            actionLabel="View All"
            onAction={() => setSelectedFormat('all')}
          />
        ) : (
          <View style={styles.booksList}>
            {books.map((book) => (
              <TouchableOpacity
                key={book.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/learn/book/${book.slug}` as never)}
              >
                <Card style={styles.bookCard}>
                  <View style={styles.bookCoverWrapper}>
                    <Image
                      source={{ uri: book.coverUrl }}
                      style={styles.bookCover}
                      resizeMode="cover"
                    />
                    <View style={styles.formatTag}>
                      <TagChip
                        label={book.format === 'pdf' ? 'PDF' : 'SUMMARY'}
                        variant={book.format === 'pdf' ? 'dark' : 'orange'}
                      />
                    </View>
                  </View>

                  <View style={styles.bookDetails}>
                    <Text style={[typography.h3, styles.bookTitle]} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={[typography.caption, styles.bookAuthor]}>By {book.author}</Text>
                    <Text style={[typography.bodySmall, styles.bookSnippet]} numberOfLines={3}>
                      {book.descriptionHtml?.replace(/<[^>]+>/g, '') || ''}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.accessIndicator}>
                        <BookOpen size={14} color={palette.orangeDeep} />
                        <Text style={[typography.labelSmall, styles.accessText]}>
                          {book.isFree !== false
                            ? 'Free Fellow Access'
                            : `₹${((book.priceInr || 0) / 100).toLocaleString('en-IN')}`}
                        </Text>
                      </View>
                      <Text style={[typography.labelSmall, styles.readLink]}>Read Now →</Text>
                    </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  formatTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  countRow: {
    paddingBottom: spacing.sm,
  },
  countText: {
    color: palette.slate,
  },
  errorContainer: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    gap: spacing.md,
  },
  booksList: {
    gap: spacing.md,
  },
  bookCard: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: palette.white,
  },
  bookCoverWrapper: {
    width: 90,
    height: 125,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: palette.slate,
    position: 'relative',
    ...shadows.soft,
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  formatTag: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
  bookDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    color: palette.navy,
  },
  bookAuthor: {
    color: palette.slate,
    marginTop: spacing.xs,
  },
  bookSnippet: {
    color: palette.navy,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  accessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  accessText: {
    color: palette.orangeDeep,
  },
  readLink: {
    color: palette.navy,
  },
});
