import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Play, Search } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  Card,
  CourseCardRow,
  EmptyState,
  FilterChip,
  SearchBar,
  SectionHeader,
  SkeletonCard,
  TagChip,
} from '../../src/components';
import { learnApi, ApiBook, ApiCourse, ApiVideo } from '../../src/lib/learn-api';

const POPULAR_SEARCHES = [
  'Unit Economics',
  'SAFE Notes',
  'Series A Pitch',
  'Outbound Sales',
  'Executive Hiring',
  'Cap Table Hygiene',
];

const MOCK_COURSES: ApiCourse[] = [
  {
    id: 'c-1',
    slug: 'foundations-of-high-growth-venture-building',
    title: 'Foundations of High-Growth Venture Building',
    subtitle: 'From zero to repeatable PMF and unit economics.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
    level: 'intermediate',
    priceInr: 1499900,
    stats: { lessonCount: 36, durationSec: 64800 },
  },
  {
    id: 'c-2',
    slug: 'saas-pricing-and-packaging-mastery',
    title: 'SaaS Pricing & Packaging Architecture',
    subtitle: 'Value metrics and seat models for Series A startups.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
    level: 'advanced',
    priceInr: 999900,
    stats: { lessonCount: 24, durationSec: 43200 },
  },
];

const MOCK_BOOKS: ApiBook[] = [
  {
    id: 'b-1',
    slug: 'the-venture-handbook',
    title: 'The Venture Handbook: Seed to Series B',
    author: 'Naveen Jain & SOFE Editorial',
    coverUrl:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    format: 'pdf',
    isFree: true,
  },
];

const MOCK_VIDEOS: ApiVideo[] = [
  {
    id: 'v-1',
    slug: 'the-art-of-the-series-a-pitch',
    title: 'The Art of the Series A Pitch: Slide-by-Slide Anatomy',
    description: 'A deep teardown of 3 actual Series A decks.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
    durationSec: 1540,
    isFree: true,
  },
];

export default function LearnSearchScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'courses' | 'books' | 'videos'>('all');
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(
    async (searchText: string, type: 'all' | 'courses' | 'books' | 'videos') => {
      if (!searchText.trim()) {
        setCourses([]);
        setBooks([]);
        setVideos([]);
        setHasSearched(false);
        return;
      }

      try {
        setLoading(true);
        setHasSearched(true);
        const res = await learnApi.searchLearn(searchText, type === 'all' ? undefined : type);

        if (res) {
          setCourses(res.courses || []);
          setBooks(res.books || []);
          setVideos(res.videos || []);
        } else {
          // Fallback mock filtering
          const q = searchText.toLowerCase();
          setCourses(
            type === 'all' || type === 'courses'
              ? MOCK_COURSES.filter((c) => c.title.toLowerCase().includes(q))
              : [],
          );
          setBooks(
            type === 'all' || type === 'books'
              ? MOCK_BOOKS.filter((b) => b.title.toLowerCase().includes(q))
              : [],
          );
          setVideos(
            type === 'all' || type === 'videos'
              ? MOCK_VIDEOS.filter((v) => v.title.toLowerCase().includes(q))
              : [],
          );
        }
      } catch {
        // Local filtering fallback
        const q = searchText.toLowerCase();
        setCourses(
          type === 'all' || type === 'courses'
            ? MOCK_COURSES.filter((c) => c.title.toLowerCase().includes(q))
            : [],
        );
        setBooks(
          type === 'all' || type === 'books'
            ? MOCK_BOOKS.filter((b) => b.title.toLowerCase().includes(q))
            : [],
        );
        setVideos(
          type === 'all' || type === 'videos'
            ? MOCK_VIDEOS.filter((v) => v.title.toLowerCase().includes(q))
            : [],
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, filterType);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, filterType, performSearch]);

  const totalResults = courses.length + books.length + videos.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Header Bar */}
      <View style={styles.header}>
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
            placeholder="Search masterclasses, books, talks..."
          />
        </View>
      </View>

      {/* Scope Filter Tabs */}
      <View style={styles.filterTabs}>
        <FilterChip
          label="All Formats"
          selected={filterType === 'all'}
          onPress={() => setFilterType('all')}
        />
        <FilterChip
          label="Courses"
          selected={filterType === 'courses'}
          onPress={() => setFilterType('courses')}
        />
        <FilterChip
          label="Books"
          selected={filterType === 'books'}
          onPress={() => setFilterType('books')}
        />
        <FilterChip
          label="Videos"
          selected={filterType === 'videos'}
          onPress={() => setFilterType('videos')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* If empty query, show popular search shortcuts */}
        {!query.trim() ? (
          <View style={styles.suggestionsContainer}>
            <SectionHeader title="Popular Searches" hasOrangeBar />
            <View style={styles.tagsGrid}>
              {POPULAR_SEARCHES.map((search) => (
                <TouchableOpacity
                  key={search}
                  style={styles.suggestionTag}
                  onPress={() => setQuery(search)}
                >
                  <Search size={14} color={palette.orangeDeep} />
                  <Text style={[typography.labelSmall, styles.suggestionText]}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : hasSearched && totalResults === 0 ? (
          <EmptyState
            title="No Results Found"
            description={`We couldn't find any resources matching "${query}". Try adjusting your keywords.`}
            actionLabel="Clear Search"
            onAction={() => setQuery('')}
          />
        ) : (
          <View style={styles.resultsContainer}>
            {/* Courses Results */}
            {courses.length > 0 ? (
              <View style={styles.resultGroup}>
                <SectionHeader title={`Courses (${courses.length})`} hasOrangeBar />
                {courses.map((course) => (
                  <CourseCardRow
                    key={course.id}
                    title={course.title}
                    thumbnailUrl={course.thumbnailUrl}
                    label={course.level.toUpperCase()}
                    metaText={`${Math.round((course.stats?.durationSec || 3600) / 3600)}h · ${course.stats?.lessonCount || 16} lessons`}
                    onPress={() => router.push(`/learn/course/${course.slug}` as never)}
                    style={styles.resultRow}
                  />
                ))}
              </View>
            ) : null}

            {/* Books Results */}
            {books.length > 0 ? (
              <View style={styles.resultGroup}>
                <SectionHeader title={`Books & Guides (${books.length})`} hasOrangeBar />
                {books.map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/learn/book/${book.slug}` as never)}
                  >
                    <Card style={styles.mediaResultCard}>
                      <View style={styles.mediaIconWrapper}>
                        <BookOpen size={20} color={palette.orangeDeep} />
                      </View>
                      <View style={styles.mediaDetails}>
                        <View style={styles.badgeLine}>
                          <TagChip
                            label={book.format === 'pdf' ? 'PDF' : 'SUMMARY'}
                            variant="orange"
                          />
                        </View>
                        <Text style={[typography.h3, styles.mediaTitle]}>{book.title}</Text>
                        <Text style={[typography.caption, styles.mediaMeta]}>By {book.author}</Text>
                      </View>
                      <ChevronRight size={18} color={palette.slate} />
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Videos Results */}
            {videos.length > 0 ? (
              <View style={styles.resultGroup}>
                <SectionHeader title={`Talks & Teardowns (${videos.length})`} hasOrangeBar />
                {videos.map((vid) => (
                  <TouchableOpacity
                    key={vid.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/learn/video/${vid.slug}` as never)}
                  >
                    <Card style={styles.mediaResultCard}>
                      <View style={styles.mediaIconWrapper}>
                        <Play size={20} color={palette.orangeDeep} fill={palette.orangeDeep} />
                      </View>
                      <View style={styles.mediaDetails}>
                        <Text style={[typography.h3, styles.mediaTitle]}>{vid.title}</Text>
                        <Text style={[typography.caption, styles.mediaMeta]}>
                          {Math.round(vid.durationSec / 60)} mins runtime
                        </Text>
                      </View>
                      <ChevronRight size={18} color={palette.slate} />
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  backButton: {
    padding: spacing.xs,
  },
  searchBarWrapper: {
    flex: 1,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  suggestionsContainer: {
    gap: spacing.md,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
  },
  suggestionText: {
    color: palette.navy,
  },
  loadingContainer: {
    gap: spacing.md,
  },
  resultsContainer: {
    gap: spacing.xl,
  },
  resultGroup: {
    gap: spacing.sm,
  },
  resultRow: {
    marginBottom: spacing.xs,
  },
  mediaResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: palette.white,
  },
  mediaIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  badgeLine: {
    flexDirection: 'row',
  },
  mediaTitle: {
    color: palette.navy,
  },
  mediaMeta: {
    color: palette.slate,
  },
});
