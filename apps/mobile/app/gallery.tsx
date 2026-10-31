import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Moon, Sun, Award } from 'lucide-react-native';
import { useTheme } from '../src/theme/theme-context';
import { typography } from '../src/theme/typography';
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  ListRow,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Toast,
  TopTabs,
} from '../src/components';

export default function ComponentGalleryScreen() {
  const { colors, palette, spacing, isDark, toggleTheme } = useTheme();

  // State for interactive components
  const [activeTab, setActiveTab] = useState('courses');
  const [inputValue, setInputValue] = useState('Search playbooks');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [selectedFilter, setSelectedFilter] = useState(true);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={
          toastType === 'success'
            ? 'Action completed successfully!'
            : toastType === 'error'
              ? 'Failed to perform operation.'
              : 'Here is an informational tip.'
        }
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Top Bar with Back and Theme Toggle */}
      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[typography.title3, { color: colors.text }]}>Component Gallery</Text>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: colors.surface }]}
        >
          {isDark ? (
            <Sun size={18} color={palette.orange} />
          ) : (
            <Moon size={18} color={palette.navy} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Section: Typography */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          1. Typography
        </Text>
        <Text style={[typography.display, { color: colors.text }]}>Display 32pt</Text>
        <Text style={[typography.title1, { color: colors.text, marginTop: 4 }]}>Title 1 26pt</Text>
        <Text style={[typography.title2, { color: colors.text, marginTop: 4 }]}>Title 2 22pt</Text>
        <Text style={[typography.title3, { color: colors.text, marginTop: 4 }]}>Title 3 18pt</Text>
        <Text style={[typography.body, { color: colors.text, marginTop: 4 }]}>
          Body 15pt text for founder explanations.
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
          Caption 13pt meta text.
        </Text>
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: 4 }]}>
          MICRO 11PT LABELS
        </Text>

        {/* Section: Buttons */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          2. Buttons
        </Text>
        <View style={styles.rowWrap}>
          <Button variant="primary" size="lg" style={{ marginBottom: spacing.sm }}>
            Primary LG (Navy on Orange)
          </Button>
          <Button variant="primary" size="md" style={{ marginBottom: spacing.sm }}>
            Primary MD
          </Button>
          <Button variant="primary" size="sm" pill style={{ marginBottom: spacing.sm }}>
            Start (Pill SM)
          </Button>
          <Button variant="secondary" size="md" style={{ marginBottom: spacing.sm }}>
            Secondary Outline
          </Button>
          <Button variant="ghost" size="md" style={{ marginBottom: spacing.sm }}>
            Ghost Button
          </Button>
          <Button variant="destructive" size="md" style={{ marginBottom: spacing.sm }}>
            Destructive Delete
          </Button>
          <Button variant="primary" size="md" loading style={{ marginBottom: spacing.sm }}>
            Loading State
          </Button>
          <Button variant="primary" size="md" disabled style={{ marginBottom: spacing.sm }}>
            Disabled Button
          </Button>
        </View>

        {/* Section: Cards */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          3. Cards
        </Text>
        <Card variant="default" style={{ marginBottom: spacing.md }}>
          <Text style={[typography.title3, { color: colors.text }]}>Default Surface Card</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 4 }]}>
            Slate on dark mode, white with subtle shadow on light mode.
          </Text>
        </Card>
        <Card variant="raised" style={{ marginBottom: spacing.md }}>
          <Text style={[typography.title3, { color: colors.text }]}>Raised Surface Card</Text>
        </Card>
        <Card
          variant="outlined"
          onPress={() => alert('Card clicked')}
          style={{ marginBottom: spacing.md }}
        >
          <Text style={[typography.title3, { color: colors.text }]}>
            Interactive Outlined Card (Tap Me)
          </Text>
        </Card>

        {/* Section: Progress Indicators */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          4. Progress Indicators
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>
          ProgressBar (65%)
        </Text>
        <ProgressBar progress={0.65} style={{ marginBottom: spacing.lg }} />

        <View style={styles.centerRow}>
          <View style={{ alignItems: 'center', marginRight: spacing.xl }}>
            <ProgressRing progress={40} size={64} />
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
              Course 40%
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <ProgressRing progress={85} size={80} strokeWidth={8} />
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
              Mastery 85%
            </Text>
          </View>
        </View>

        {/* Section: Chips */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          5. Chips & Tags
        </Text>
        <View style={[styles.rowWrap, { gap: 8 }]}>
          <Chip label="IDEA & VALIDATION" variant="topic" />
          <Chip label="GROWTH & MARKETING" variant="topic" />
          <Chip
            label={selectedFilter ? 'Selected Filter' : 'Unselected Filter'}
            variant="filter"
            selected={selectedFilter}
            onPress={() => setSelectedFilter(!selectedFilter)}
          />
          <Chip label="350 pts" variant="points" />
        </View>

        {/* Section: Avatars */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          6. Avatars
        </Text>
        <View style={[styles.rowWrap, { alignItems: 'center', gap: 16 }]}>
          <Avatar size={24} name="Sara Blakely" />
          <Avatar size={32} name="Steve Jobs" />
          <Avatar size={44} name="Elon Musk" isVerified />
          <Avatar size={96} name="Founder Learner" isVerified />
        </View>

        {/* Section: Inputs */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          7. Inputs & SearchBar
        </Text>
        <Input
          label="Founder Name"
          placeholder="e.g. Alexis Ohanian"
          containerStyle={{ marginBottom: spacing.md }}
        />
        <Input
          label="Password (with Toggle)"
          placeholder="Enter secure password"
          secureTextEntry
          containerStyle={{ marginBottom: spacing.md }}
        />
        <Input
          isSearch
          value={inputValue}
          onChangeText={setInputValue}
          onClear={() => setInputValue('')}
          placeholder="Search lessons & playbooks..."
          containerStyle={{ marginBottom: spacing.md }}
        />
        <Input
          label="Error State Input"
          value="invalid-email"
          error="Please provide a valid company email address."
          containerStyle={{ marginBottom: spacing.md }}
        />

        {/* Section: TopTabs */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          8. TopTabs
        </Text>
        <TopTabs
          tabs={[
            { key: 'courses', label: 'My Courses', count: 3 },
            { key: 'saved', label: 'Saved Articles' },
            { key: 'completed', label: 'Certificates' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          style={{ marginBottom: spacing.lg }}
        />

        {/* Section: ListRow */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          9. ListRow
        </Text>
        <Card variant="default" padding={0} style={{ marginBottom: spacing.lg }}>
          <ListRow
            title="Pre-Seed Capital Raising"
            subtitle="Module 2: The Cap Table and SAFEs"
            leading={<Award size={22} color={palette.orange} />}
            showChevron
            onPress={() => {}}
          />
          <ListRow
            title="Building in Public"
            subtitle="How to build early momentum on Twitter/X"
            trailing={
              <Button variant="primary" size="sm" pill>
                Start
              </Button>
            }
          />
        </Card>

        {/* Section: Skeletons */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          10. Skeletons (No Spinner Screens)
        </Text>
        <View style={{ marginBottom: spacing.lg }}>
          <Skeleton height={24} width="60%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
          <Skeleton height={14} width="40%" style={{ marginBottom: 12 }} />
          <Skeleton height={80} width="100%" borderRadius={16} />
        </View>

        {/* Section: Overlays & Triggers */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          11. BottomSheet & Toast Overlays
        </Text>
        <View style={[styles.rowWrap, { gap: 8, marginBottom: spacing.lg }]}>
          <Button variant="secondary" size="md" onPress={() => setSheetVisible(true)}>
            Open BottomSheet
          </Button>
          <Button
            variant="secondary"
            size="md"
            onPress={() => {
              setToastType('success');
              setToastVisible(true);
            }}
          >
            Trigger Success Toast
          </Button>
          <Button
            variant="destructive"
            size="md"
            onPress={() => {
              setToastType('error');
              setToastVisible(true);
            }}
          >
            Trigger Error Toast
          </Button>
        </View>

        {/* Section: Empty & Error States */}
        <Text style={[styles.sectionTitle, typography.title2, { color: palette.orange }]}>
          12. Empty & Error States
        </Text>
        <Card variant="default" style={{ marginBottom: spacing.md }}>
          <EmptyState
            title="No Bookmarks Yet"
            description="Explore Startup World and tap the bookmark icon to save playbooks for offline reading."
            actionLabel="Explore Articles"
            onAction={() => {}}
          />
        </Card>
        <Card variant="default" style={{ marginBottom: spacing.xxl }}>
          <ErrorState
            message="Unable to reach the curriculum server. Please check your internet connection."
            onRetry={() => alert('Retrying...')}
          />
        </Card>
      </ScrollView>

      {/* Sample BottomSheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Sample Filter Sheet"
      >
        <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
          This is a sample BottomSheet modal with top radius 24 and drag handle.
        </Text>
        <Button variant="primary" size="md" onPress={() => setSheetVisible(false)}>
          Apply Filters
        </Button>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  themeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    paddingBottom: 48,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
});
