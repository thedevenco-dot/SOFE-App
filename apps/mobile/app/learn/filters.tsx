import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import { Button, FilterChip, SectionHeader } from '../../src/components';

const CATEGORIES = [
  { id: 'all', label: 'All Disciplines' },
  { id: 'startups-ideation', label: 'Startups & Ideation' },
  { id: 'venture-strategy', label: 'Venture Strategy' },
  { id: 'b2b-saas', label: 'B2B SaaS Growth' },
  { id: 'go-to-market', label: 'Go-To-Market' },
  { id: 'fundraising', label: 'Fundraising & Capital' },
];

const LEVELS = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Foundational' },
  { id: 'intermediate', label: 'Operator' },
  { id: 'advanced', label: 'Venture Scale' },
];

const PRICING = [
  { id: 'all', label: 'All Formats' },
  { id: 'free', label: 'Free Access' },
  { id: 'paid', label: 'Cohort Masterclass' },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'rating', label: 'Highest Rated (4.8+)' },
  { id: 'newest', label: 'Recently Added' },
  { id: 'duration', label: 'Curriculum Depth' },
];

export default function LearnFiltersModal() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('popular');

  const handleReset = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedPrice('all');
    setSelectedSort('popular');
  };

  const handleApply = () => {
    // Navigate to courses catalogue with applied filter query parameters
    const params: Record<string, string> = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedLevel !== 'all') params.level = selectedLevel;
    if (selectedPrice !== 'all') params.price = selectedPrice;
    if (selectedSort !== 'popular') params.sort = selectedSort;

    router.replace({
      pathname: '/learn/courses',
      params,
    } as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityLabel="Close filters"
        >
          <X size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title, styles.headerTitle]}>Filter & Sort</Text>
        <TouchableOpacity onPress={handleReset} accessibilityLabel="Reset all filters">
          <Text style={[typography.labelSmall, styles.resetText]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Focus */}
        <View style={styles.filterSection}>
          <SectionHeader title="Discipline & Focus" hasOrangeBar />
          <View style={styles.chipGrid}>
            {CATEGORIES.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.label}
                selected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
              />
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.filterSection}>
          <SectionHeader title="Operator Level" hasOrangeBar />
          <View style={styles.chipGrid}>
            {LEVELS.map((lvl) => (
              <FilterChip
                key={lvl.id}
                label={lvl.label}
                selected={selectedLevel === lvl.id}
                onPress={() => setSelectedLevel(lvl.id)}
              />
            ))}
          </View>
        </View>

        {/* Access & Pricing */}
        <View style={styles.filterSection}>
          <SectionHeader title="Format & Access" hasOrangeBar />
          <View style={styles.chipGrid}>
            {PRICING.map((pr) => (
              <FilterChip
                key={pr.id}
                label={pr.label}
                selected={selectedPrice === pr.id}
                onPress={() => setSelectedPrice(pr.id)}
              />
            ))}
          </View>
        </View>

        {/* Sort Order */}
        <View style={styles.filterSection}>
          <SectionHeader title="Sort By" hasOrangeBar />
          <View style={styles.sortList}>
            {SORT_OPTIONS.map((sort) => {
              const active = selectedSort === sort.id;
              return (
                <TouchableOpacity
                  key={sort.id}
                  style={[styles.sortItem, active && styles.sortItemActive]}
                  onPress={() => setSelectedSort(sort.id)}
                >
                  <Text
                    style={[typography.body, styles.sortLabel, active && styles.sortLabelActive]}
                  >
                    {sort.label}
                  </Text>
                  {active ? <Check size={18} color={palette.orange} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <Button variant="primary" fullWidth onPress={handleApply}>
          Apply Filters
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: palette.navy,
  },
  resetText: {
    color: palette.orangeDeep,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  filterSection: {
    gap: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sortList: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
  },
  sortItemActive: {
    borderColor: palette.orange,
    backgroundColor: palette.peachTint,
  },
  sortLabel: {
    color: palette.navy,
  },
  sortLabelActive: {
    color: palette.orangeDeep,
    fontFamily: 'Inter_600SemiBold',
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.cream,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
});
