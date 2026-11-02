import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Moon,
  Sun,
  Award,
  BookOpen,
  Code,
  Flame,
  Globe,
  Home,
  Sparkles,
  User,
  Zap,
} from 'lucide-react-native';
import { palette, colorRoles, spacing } from '@sofe/shared';
import { useTheme } from '../src/theme/theme-context';
import { typography } from '../src/theme/typography';
import {
  AppHeader,
  Avatar,
  AvatarStack,
  BadgeRow,
  BottomSheet,
  Button,
  Card,
  CarouselCard,
  CourseCardGrid,
  CourseCardLarge,
  CourseCardRow,
  DisciplineRow,
  EmptyState,
  ErrorState,
  EyebrowLabel,
  FeaturedChallengeCard,
  FilterChip,
  FollowButton,
  HeroImageCard,
  Input,
  ListRow,
  LogoTile,
  MetaChip,
  MilestoneCard,
  NewsletterCard,
  OfflineBanner,
  PostCard,
  ProgressBar,
  ProgressRing,
  QuickQuizCard,
  QuoteBox,
  QuoteCard,
  RoundRobinCard,
  ScreenHero,
  SearchBar,
  SectionHeader,
  Skeleton,
  SkeletonCard,
  SkeletonRow,
  StatTile,
  StreakChip,
  TabBar,
  TagChip,
  TaskRow,
  TimeChip,
  Toast,
  TopTabs,
  TrendingRow,
  VentureCard,
  WeeklyConsistency,
} from '../src/components';

export default function ComponentGalleryScreen() {
  const { isDark, toggleTheme } = useTheme();

  // State for interactive demonstrations
  const [selectedFilter, setSelectedFilter] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [task1Done, setTask1Done] = useState(false);
  const [task2Done, setTask2Done] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState('home');
  const [activeTopTab, setActiveTopTab] = useState('courses');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(true);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDark ? palette.navy : palette.cream }]}
    >
      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={
          toastType === 'success'
            ? 'Action completed successfully!'
            : toastType === 'error'
              ? 'Unable to reach the curriculum server.'
              : 'Here is an informational founder tip.'
        }
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Top Bar with Back, Title and Theme Toggle */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={isDark ? palette.white : palette.navy} />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <LogoTile size={24} />
          <Text
            style={[
              typography.title3,
              { color: isDark ? palette.white : palette.navy, marginLeft: spacing.sm },
            ]}
          >
            Design V2 Gallery
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: isDark ? palette.slate : palette.white }]}
          accessibilityLabel="Toggle Theme"
        >
          {isDark ? (
            <Sun size={18} color={palette.orange} />
          ) : (
            <Moon size={18} color={palette.navy} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ========================================================
            1. TYPOGRAPHY & TOKENS
        ======================================================== */}
        <SectionHeader title="1. Typography & Tokens" hasOrangeBar />
        <Card variant="white" style={styles.sectionCard}>
          <Text style={[typography.display, { color: palette.navy }]}>
            Display 28pt (Serif Bold)
          </Text>
          <Text style={[typography.title1, { color: palette.navy, marginTop: 4 }]}>
            Title 1 24pt (Serif Bold)
          </Text>
          <Text style={[typography.title2, { color: palette.navy, marginTop: 4 }]}>
            Title 2 20pt (Serif Bold)
          </Text>
          <Text style={[typography.title3, { color: palette.navy, marginTop: 4 }]}>
            Title 3 17pt (Serif Semibold)
          </Text>
          <Text style={[typography.body, { color: palette.navy, marginTop: 4 }]}>
            Body 14pt (Sans Regular) for founder explanations, curriculum details and descriptions.
          </Text>
          <Text style={[typography.bodyStrong, { color: palette.navy, marginTop: 4 }]}>
            BodyStrong 14pt (Sans Semibold) for list row titles and emphasis.
          </Text>
          <Text style={[typography.caption, { color: palette.mutedOnLight, marginTop: 4 }]}>
            Caption 12pt (Sans Regular) for metadata and durations.
          </Text>
          <Text style={[typography.eyebrow, { color: colorRoles.accentText, marginTop: 4 }]}>
            EYEBROW 11PT (SANS SEMIBOLD · TRACKING 0.8)
          </Text>
          <Text style={[typography.numeric, { color: palette.navy, marginTop: 6 }]}>
            48.5 <Text style={{ color: palette.orange, fontSize: 16 }}>HRS</Text> (Numeric 30pt)
          </Text>
          <Text style={[typography.tab, { color: palette.navy, marginTop: 4 }]}>
            TAB LABEL 10PT (UPPERCASE)
          </Text>
        </Card>

        {/* ========================================================
            2. STRUCTURE & HEADERS
        ======================================================== */}
        <SectionHeader title="2. Structure & Headers" hasOrangeBar />

        {/* AppHeader: Home Variant */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>AppHeader (Home Variant)</Text>
        <AppHeader
          variant="home"
          greetingName="Alex"
          subtitle="Curating 3 daily tactical protocols · Term Active"
          hasUnreadNotifications
          style={{ borderRadius: 16, marginBottom: spacing.md }}
        />

        {/* AppHeader: Title Variant with Section Name */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          AppHeader (Title Variant · Practise)
        </Text>
        <AppHeader
          variant="title"
          sectionName="PRACTISE"
          title="Daily Calibration"
          subtitle="Think sharper. Make better decisions under pressure."
          style={{ borderRadius: 16, marginBottom: spacing.md }}
        />

        {/* AppHeader: Blog Variant with Search Icon */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          AppHeader (Blog Variant with Search)
        </Text>
        <AppHeader
          variant="blog"
          hasUnreadNotifications={false}
          onSearchPress={() => alert('Search tapped')}
          style={{ borderRadius: 16, marginBottom: spacing.md }}
        />

        {/* ScreenHero */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>ScreenHero Component</Text>
        <ScreenHero
          eyebrow="COHORT IX · WEEK 4"
          streakDays={26}
          streakPoints={340}
          title="Master Execution"
          subtitle="Frameworks from venture-scale founders."
          style={{ borderRadius: 16, marginBottom: spacing.md }}
        />

        {/* SectionHeader Variants */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          SectionHeader with Orange Bar & Action
        </Text>
        <Card variant="white" style={styles.sectionCard}>
          <SectionHeader
            title="Tactical Briefings"
            hasOrangeBar
            actionLabel="VIEW ALL 32"
            onActionPress={() => alert('View All tapped')}
          />
          <SectionHeader
            title="Active Curriculum"
            actionLabel="IN PROGRESS"
            onActionPress={() => {}}
          />
        </Card>

        {/* EyebrowLabel Variants */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          EyebrowLabel (Light vs Dark)
        </Text>
        <Card variant="white" style={styles.sectionCard}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <EyebrowLabel>ACCENT.TEXT (ORANGEDEEP ON LIGHT)</EyebrowLabel>
          </View>
        </Card>
        <View
          style={{
            backgroundColor: palette.navy,
            padding: spacing.md,
            borderRadius: 12,
            marginBottom: spacing.md,
          }}
        >
          <EyebrowLabel onDark>ORANGE ON DARK (NAVY BACKGROUND)</EyebrowLabel>
        </View>

        {/* ========================================================
            3. ACTIONS & BUTTONS
        ======================================================== */}
        <SectionHeader title="3. Actions & Buttons" hasOrangeBar />
        <Card variant="white" style={styles.sectionCard}>
          {/* Primary Button */}
          <Text style={[typography.caption, styles.subLabel]}>
            Primary (Navy text on Orange fill, Height 50)
          </Text>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            showTrailingArrow
            style={{ marginBottom: spacing.sm }}
          >
            Continue learning
          </Button>

          {/* Secondary Button */}
          <Text style={[typography.caption, styles.subLabel]}>
            Secondary (White/Cream fill, 1px border)
          </Text>
          <Button variant="secondary" size="md" fullWidth style={{ marginBottom: spacing.sm }}>
            Edit Profile Dossier
          </Button>

          {/* Dark Pill Button */}
          <Text style={[typography.caption, styles.subLabel]}>Dark Pill ("Begin Quiz")</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.sm }}>
            <Button variant="dark" size="sm" pill>
              Begin Quiz
            </Button>
            <Button
              variant="dark"
              size="sm"
              pill
              icon={<Sparkles size={14} color={palette.orange} />}
            >
              Calibrate
            </Button>
          </View>

          {/* Ghost / Link Button */}
          <Text style={[typography.caption, styles.subLabel]}>
            Ghost / Link (Deep Orange text with Arrow)
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: spacing.sm }}>
            <Button variant="ghost" showTrailingArrow onPress={() => {}}>
              Analyze
            </Button>
            <Button variant="link" showTrailingArrow onPress={() => {}}>
              Read essay
            </Button>
          </View>

          {/* Icon Buttons */}
          <Text style={[typography.caption, styles.subLabel]}>
            Square Icon Buttons (Bookmark & Share)
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: spacing.sm }}>
            <Button variant="icon" icon={<Award size={18} color={palette.navy} />} />
            <Button variant="icon" icon={<Zap size={18} color={palette.orangeDeep} />} />
          </View>

          {/* States: Loading, Disabled, Pressed */}
          <Text style={[typography.caption, styles.subLabel]}>States: Loading & Disabled</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.sm }}>
            <Button variant="primary" size="md" loading style={{ flex: 1 }}>
              Submit
            </Button>
            <Button variant="primary" size="md" disabled style={{ flex: 1 }}>
              Disabled Action
            </Button>
          </View>

          {/* FollowButton */}
          <Text style={[typography.caption, styles.subLabel]}>
            FollowButton Toggle (Unselected vs Selected)
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <FollowButton isFollowing={isFollowing} onPress={() => setIsFollowing(!isFollowing)} />
            <FollowButton isFollowing={true} />
          </View>
        </Card>

        {/* ========================================================
            4. CHIPS & TAGS
        ======================================================== */}
        <SectionHeader title="4. Chips & Tags" hasOrangeBar />
        <Card variant="white" style={styles.sectionCard}>
          {/* FilterChip */}
          <Text style={[typography.caption, styles.subLabel]}>
            FilterChip (Selected vs Unselected)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing.md }}
          >
            <FilterChip
              label="All Dispatches"
              selected={selectedFilter}
              onPress={() => setSelectedFilter(!selectedFilter)}
            />
            <FilterChip
              label="Venture Strategy"
              selected={!selectedFilter}
              onPress={() => setSelectedFilter(!selectedFilter)}
            />
            <FilterChip label="Legal & Term Sheets" />
            <FilterChip label="Growth & Pipeline" />
          </ScrollView>

          {/* TagChip */}
          <Text style={[typography.caption, styles.subLabel]}>
            TagChip (Orange, Dark, Translucent)
          </Text>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }}
          >
            <TagChip label="FOUNDER ESSENTIALS" variant="orange" />
            <TagChip label="DEEP TEARDOWN" variant="dark" />
            <TagChip label="WEEKLY DEEP DIVE" variant="translucent" />
            <TagChip label="COHORT RECOMMENDED" variant="orange" />
          </View>

          {/* MetaChip */}
          <Text style={[typography.caption, styles.subLabel]}>
            MetaChip (bg.tint tiles with icons)
          </Text>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}
          >
            <MetaChip label="Intermediate" icon={<Award size={14} color={palette.navy} />} />
            <MetaChip label="8.5 Hours" />
            <MetaChip label="24 Lessons" icon={<BookOpen size={14} color={palette.navy} />} />
            <MetaChip label="6 mins read" />
            <MetaChip label="+50 Points" icon={<Flame size={14} color={palette.orangeDeep} />} />
          </View>

          {/* StreakChip & TimeChip */}
          <Text style={[typography.caption, styles.subLabel]}>StreakChip & TimeChip</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <StreakChip days={26} />
            <StreakChip days={7} points={340} />
            <TimeChip label="18 mins left" />
          </View>
        </Card>

        {/* ========================================================
            5. PROGRESS & METRICS
        ======================================================== */}
        <SectionHeader title="5. Progress & Metrics" hasOrangeBar />
        <Card variant="white" style={styles.sectionCard}>
          {/* ProgressBar */}
          <Text style={[typography.caption, styles.subLabel]}>ProgressBar with Labels (68%)</Text>
          <ProgressBar
            progress={0.68}
            leftLabel="Curriculum Progress"
            rightLabel="68%"
            style={{ marginBottom: spacing.md }}
          />

          {/* ProgressRing */}
          <Text style={[typography.caption, styles.subLabel]}>
            ProgressRing ("2/3" Daily Protocol & 84%)
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <ProgressRing progress={66} label="2/3" size={60} strokeWidth={6} />
              <Text style={[typography.caption, { marginTop: 4, color: palette.mutedOnLight }]}>
                Protocol 2/3
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <ProgressRing progress={84} size={60} strokeWidth={6} />
              <Text style={[typography.caption, { marginTop: 4, color: palette.mutedOnLight }]}>
                Mastery 84%
              </Text>
            </View>
          </View>

          {/* WeeklyConsistency */}
          <Text style={[typography.caption, styles.subLabel]}>
            WeeklyConsistency (7-Day Row + Target Bar)
          </Text>
          <WeeklyConsistency
            currentMinutes={38}
            targetMinutes={45}
            style={{ marginBottom: spacing.md }}
          />

          {/* StatTile 2x2 Grid */}
          <Text style={[typography.caption, styles.subLabel]}>StatTile 2x2 Metric Grid</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <StatTile
              label="LOGGED"
              value="48.5"
              unit="Hrs"
              caption="Curriculum time"
              icon={<Zap size={16} color={palette.orange} />}
            />
            <StatTile
              label="CURRICULUM"
              value="12"
              unit="Done"
              caption="Masterclasses completed"
              icon={<Award size={16} color={palette.orange} />}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatTile
              label="MOMENTUM"
              value="26"
              unit="Days"
              caption="Active daily streak"
              icon={<Flame size={16} color={palette.orange} />}
            />
            <StatTile
              label="MASTERY"
              value="94"
              unit="%"
              caption="Case simulation accuracy"
              icon={<Sparkles size={16} color={palette.orange} />}
            />
          </View>
        </Card>

        {/* ========================================================
            6. CARDS & EDITORIAL COMPONENTS
        ======================================================== */}
        <SectionHeader title="6. Cards & Editorial Rows" hasOrangeBar />

        {/* HeroImageCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          HeroImageCard (Curator's Manifesto)
        </Text>
        <HeroImageCard
          eyebrow="CURATOR'S MANIFESTO"
          title="Build something that matters."
          body="Venture building is not about motion; it is about compounding leverage. Stay focused on high-order execution."
          quote={{
            text: 'Execution eats strategy for breakfast every single Tuesday.',
            author: 'School of Founder Education',
          }}
          style={{ marginBottom: spacing.md }}
        />

        {/* CourseCardLarge */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          CourseCardLarge (Flagship / Active Masterclass)
        </Text>
        <CourseCardLarge
          eyebrow="MODULE 02 · TRACTION"
          title="Master Execution & Product-Market Fit"
          description="A tactical blueprint for founder-led growth, customer discovery interviews, and pre-seed fundraising."
          tagLabel="FLAGSHIP MASTERCLASS"
          timeLabel="18 mins left"
          isBookmarked={isBookmarked}
          onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
          metaChips={['Intermediate', '8.5 Hours', '24 Lessons', 'Free for Fellows']}
          instructorName="Taught by Reid Hoffman & Peter Thiel"
          rating={4.9}
          ratingCount={340}
          progressPercent={68}
          progressLabel="Curriculum Progress"
          ctaLabel="Continue learning →"
          onCtaPress={() => alert('Continue tapped')}
        />

        {/* CourseCardRow */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          CourseCardRow (Horizontal Lesson / Article)
        </Text>
        <CourseCardRow
          label="PART IV · OUTBOUND PIPELINE"
          title="Building In Public: How Founders Acquire First 100 Customers"
          metaText="Sara Blakely · 8 mins read"
          progressPercent={45}
          onPress={() => {}}
        />
        <CourseCardRow
          label="CASE STUDY"
          title="The Seed Round Diligence Checklist for SaaS"
          metaText="Venture Strategy · 12 mins read"
          isBookmarked={true}
          onBookmarkToggle={() => {}}
        />

        {/* CourseCardGrid (2-Column) */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          CourseCardGrid (2-Column Compact Layout)
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
          <CourseCardGrid
            tagLabel="RECOMMENDED"
            metaText="5 Modules · 3h"
            title="Cap Table Dynamics & SAFEs"
            instructorName="Naval Ravikant"
            rating={4.8}
            onPress={() => {}}
          />
          <CourseCardGrid
            tagLabel="NEW"
            metaText="8 Modules · 6h"
            title="Enterprise Sales for Technical Founders"
            instructorName="Marc Andreessen"
            rating={4.9}
            onPress={() => {}}
          />
        </View>

        {/* CarouselCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          CarouselCard (Horizontal Peek Card)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
        >
          <CarouselCard
            category="VENTURE STRATEGY"
            duration="14 mins"
            title="Pricing Strategy Before Product-Market Fit"
            description="Why undercharging kills SaaS companies before Series A."
          />
          <CarouselCard
            category="TALENT & CULTURE"
            duration="22 mins"
            title="Hiring Your First 10 Engineers"
            description="The interview rubric top founders use to filter 10x talent."
          />
        </ScrollView>

        {/* TaskRow (Daily Protocol) */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          TaskRow (Daily Protocol - Tap to Toggle)
        </Text>
        <TaskRow
          title="Review Seed Term Sheet Calibration"
          subtitle="Module 3: Liquidation preference & board seats"
          minutes={15}
          points={25}
          isCompleted={task1Done}
          onToggle={() => setTask1Done(!task1Done)}
        />
        <TaskRow
          title="Complete Rapid Calibration Quiz #14"
          minutes={10}
          points={25}
          isCompleted={task2Done}
          onToggle={() => setTask2Done(!task2Done)}
        />

        {/* DisciplineRow */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          DisciplineRow (Practise Tracks)
        </Text>
        <DisciplineRow
          icon={<Zap size={20} color={palette.orange} />}
          title="Legal & Term Sheet Calibration"
          subtitle="5 Scenarios · Convertible notes & SAFE diligence"
          progressPercent={80}
          onPress={() => {}}
        />
        <DisciplineRow
          icon={<Code size={20} color={palette.orange} />}
          title="Technical Architecture & Scale"
          subtitle="4 Scenarios · High throughput systems"
          isNew={true}
          onPress={() => {}}
        />

        {/* FeaturedChallengeCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          FeaturedChallengeCard (Daily Case Simulation)
        </Text>
        <FeaturedChallengeCard
          tagLabel="CASE SIMULATION #42"
          categoryLabel="Seed Round Diligence"
          title="Would you accept this 2x Liquidation Preference on a $4M SAFE?"
          description="An opportunistic lead investor offers quick capital with complex downside clauses. Diagnose the terms before signing."
          metaChips={['Angel Diligence', 'Intermediate', '6 mins read', '+50 Points']}
          onStartPress={() => alert('Start Challenge tapped')}
        />

        {/* QuickQuizCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          QuickQuizCard (Rapid Calibration)
        </Text>
        <QuickQuizCard
          eyebrow="RAPID CALIBRATION"
          title="Founder Diligence & Board Dynamics"
          description="Quick 4-minute diagnostic scenario covering governance and voting rights."
          scenariosCount={5}
          minutes={4}
          points={25}
          onBeginPress={() => alert('Begin Quiz tapped')}
        />

        {/* BadgeRow */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          BadgeRow (Fellow Accreditations)
        </Text>
        <BadgeRow
          title="Term Sheet Diligence Certified"
          description="Completed all 10 simulation modules on SAFEs and cap tables."
        />

        {/* VentureCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          VentureCard (Founder Portfolio Project)
        </Text>
        <VentureCard
          tagLabel="PROJECT 01"
          title="Synthetix Intelligence"
          description="Autonomous agent infrastructure for venture deal diligence and portfolio telemetry."
          tags={['B2B AI', 'Seed Stage', 'Cohort IX']}
          onOpenLink={() => alert('External link tapped')}
        />

        {/* MilestoneCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          MilestoneCard (Founder Milestone)
        </Text>
        <MilestoneCard
          eyebrow="FOUNDER MILESTONE"
          badgeLabel="Active Sprint"
          goal="Reach $25k MRR and close seed syndication round"
          targetDate="Target: Q4 2026 · Week 8 of 12"
          progressPercent={65}
        />

        {/* PostCard (Network v1.5) */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          PostCard (Network v1.5 Teardown)
        </Text>
        <PostCard
          authorName="Alex Rivera"
          authorRole="Founder @ Synthetix"
          timeAgo="2h ago"
          postType="Teardown"
          title="Why we pivoted from API wrapping to agent infrastructure"
          body="Margins were getting squeezed and retention was under 40%. Here is the exact telemetry shift that took our NDR to 128% in 90 days."
          metricLabel="Net Dollar Retention"
          metricValue="128% (+34% MoM)"
        />

        {/* RoundRobinCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          RoundRobinCard (Collective Thread)
        </Text>
        <RoundRobinCard
          question="How are technical founders evaluating inference cost per active user in late 2026?"
          responsesCount={21}
          onJoinThread={() => alert('Join thread tapped')}
        />

        {/* TrendingRow */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          TrendingRow (Community Graph)
        </Text>
        <Card variant="white" style={styles.sectionCard}>
          <TrendingRow
            rank={1}
            title="SAFE vs Priced Seed Rounds"
            repliesCount={84}
            detail="Term Sheets"
          />
          <TrendingRow
            rank={2}
            title="Evaluating LLM Latency on Edge"
            repliesCount={62}
            detail="AI Infra"
          />
        </Card>

        {/* QuoteCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          QuoteCard (Testimonial & Methodology)
        </Text>
        <QuoteCard
          quote="The discipline of daily tactical calibration took us from an idea to a $3M seed lead in 6 months."
          author="Elena Rostova"
          authorRole="Founder @ Lattice Bio · Class of '25"
          onCitePress={() => alert('Cite tapped')}
        />

        {/* NewsletterCard */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          NewsletterCard (Saturday Dispatch)
        </Text>
        <NewsletterCard onSubmitEmail={(email) => alert(`Subscribed with: ${email}`)} />

        {/* TopTabs */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>TopTabs Component</Text>
        <TopTabs
          tabs={[
            { key: 'courses', label: 'My Courses', count: 3 },
            { key: 'saved', label: 'Saved Articles' },
            { key: 'completed', label: 'Certificates' },
          ]}
          activeTab={activeTopTab}
          onTabChange={setActiveTopTab}
          style={{ marginBottom: spacing.md }}
        />

        {/* Inputs */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          Input Fields (Default, Search, Error)
        </Text>
        <Card variant="white" style={styles.sectionCard}>
          <Input
            label="Founder Company"
            placeholder="e.g. Acme Intelligence"
            containerStyle={{ marginBottom: spacing.sm }}
          />
          <Input
            label="Password Field"
            placeholder="Enter secure password"
            secureTextEntry
            containerStyle={{ marginBottom: spacing.sm }}
          />
          <Input
            label="Error Validation State"
            value="invalid-email"
            error="Please enter a valid venture email address."
          />
        </Card>

        {/* ListRow */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>ListRow Components</Text>
        <Card variant="white" padding={0} style={{ marginBottom: spacing.md }}>
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

        {/* Standalone QuoteBox */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>QuoteBox Component</Text>
        <QuoteBox
          quote="Focus on high-leverage problems. Momentum is everything."
          author="Marc Andreessen"
          onDark={false}
          style={{ marginBottom: spacing.md }}
        />

        {/* SearchBar */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          SearchBar with Filter Icon Button
        </Text>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          onFilterPress={() => alert('Filter button tapped')}
          style={{ marginBottom: spacing.lg }}
        />

        {/* Avatars and AvatarStack */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          Avatars (24, 32, 44, 96 + Verified & Ring)
        </Text>
        <Card variant="white" style={styles.sectionCard}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginBottom: spacing.md,
            }}
          >
            <Avatar size={24} name="Reid Hoffman" />
            <Avatar size={32} name="Peter Thiel" hasOrangeRing />
            <Avatar size={44} name="Sara Blakely" isVerified hasOrangeRing />
            <Avatar size={96} name="Founder Alex" isVerified hasOrangeRing />
          </View>

          <Text style={[typography.caption, styles.subLabel]}>AvatarStack with +N Overflow</Text>
          <AvatarStack
            avatars={[
              { name: 'Reid H' },
              { name: 'Peter T' },
              { name: 'Elena R' },
              { name: 'Sam A' },
              { name: 'Marc A' },
            ]}
            size={32}
            maxVisible={3}
          />
        </Card>

        {/* ========================================================
            7. UTILITY & FEEDBACK
        ======================================================== */}
        <SectionHeader title="7. Utility & Feedback" hasOrangeBar />
        <OfflineBanner style={{ borderRadius: 12, marginBottom: spacing.md }} />

        {/* Skeletons */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          Skeletons (Text, Card & Row Placeholders)
        </Text>
        <Card variant="white" style={styles.sectionCard}>
          <Skeleton height={20} width="65%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
          <Skeleton height={14} width="40%" />
        </Card>
        <SkeletonCard style={{ marginBottom: spacing.md }} />
        <SkeletonRow style={{ marginBottom: spacing.md }} />

        {/* Overlays: BottomSheet & Toasts */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          Overlays & Feedback Triggers
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }}>
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
            Success Toast
          </Button>
          <Button
            variant="destructive"
            size="md"
            onPress={() => {
              setToastType('error');
              setToastVisible(true);
            }}
          >
            Error Toast
          </Button>
        </View>

        {/* Empty & Error States */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>Empty & Error States</Text>
        <Card variant="white" style={{ marginBottom: spacing.md }}>
          <EmptyState
            title="No Bookmarked Playbooks"
            description="Explore the SOFE Blog and bookmark teardowns for offline flight reading."
            actionLabel="Browse Dispatches"
            onAction={() => {}}
          />
        </Card>
        <Card variant="white" style={{ marginBottom: spacing.xxl }}>
          <ErrorState
            message="Unable to reach the curriculum server. Please check your network connection."
            onRetry={() => alert('Retrying...')}
          />
        </Card>

        {/* Global TabBar Demo */}
        <Text style={[typography.bodyStrong, styles.componentLabel]}>
          Global Navy TabBar (5 Tabs)
        </Text>
        <TabBar
          activeKey={activeTabKey}
          onTabPress={setActiveTabKey}
          tabs={[
            {
              key: 'home',
              label: 'Home',
              icon: ({ color, size }) => <Home size={size} color={color} />,
            },
            {
              key: 'learn',
              label: 'Learn',
              icon: ({ color, size }) => <BookOpen size={size} color={color} />,
            },
            {
              key: 'blog',
              label: 'Blog',
              icon: ({ color, size }) => <Globe size={size} color={color} />,
            },
            {
              key: 'practise',
              label: 'Practise',
              icon: ({ color, size }) => <Zap size={size} color={color} />,
            },
            {
              key: 'profile',
              label: 'Profile',
              icon: ({ color, size }) => <User size={size} color={color} />,
            },
          ]}
          style={{ borderRadius: 16, marginBottom: spacing.xxl }}
        />
      </ScrollView>

      {/* Interactive BottomSheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Curriculum Filter Sheet"
      >
        <Text style={[typography.body, { color: palette.mutedOnLight, marginBottom: spacing.lg }]}>
          Filter by stage, sector, and founder track. Built from tokens with top radius 28 and drag
          handle.
        </Text>
        <Button variant="primary" size="lg" fullWidth onPress={() => setSheetVisible(false)}>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
  },
  themeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 80,
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  componentLabel: {
    color: palette.navy,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  subLabel: {
    color: palette.mutedOnLight,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
});
