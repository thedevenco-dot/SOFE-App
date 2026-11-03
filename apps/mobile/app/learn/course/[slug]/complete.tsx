import React, { useState, useEffect } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Award, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../../../src/theme/typography';
import { Button, Card } from '../../../../src/components';
import { learnApi, ApiCourse } from '../../../../src/lib/learn-api';

export default function CourseCompleteScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [course, setCourse] = useState<ApiCourse | null>(null);

  useEffect(() => {
    if (!slug) return;
    learnApi
      .getCourseBySlug(slug)
      .then((c) => {
        if (c) setCourse(c);
      })
      .catch(() => null);
  }, [slug]);

  const courseTitle = course?.title || 'Foundations of High-Growth Venture Building';
  const certificateId = 'SOFE-CERT-2026-F9472';
  const issueDate = 'November 3, 2026';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just completed the "${courseTitle}" masterclass on SOFE! Verification Code: ${certificateId}. Verified by SOFE Institute of Venture Excellence.`,
        title: 'Masterclass Certification Earned',
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const handleDownloadCertificate = () => {
    Alert.alert(
      'Download Certificate',
      `Certificate ${certificateId} generated.\n\nOpening verifiable PDF document.`,
      [
        {
          text: 'Open PDF',
          onPress: () => {
            Linking.openURL('https://cdn.sofe.io/certificates/sample-completion.pdf').catch(
              () => null,
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.push('/learn' as never)}
          style={styles.closeButton}
          accessibilityLabel="Close and return to learn home"
        >
          <X size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title3, styles.navTitle]}>Course Completed</Text>
        <View style={styles.navButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Celebration Hero */}
        <View style={styles.celebrationHero}>
          <View style={styles.trophyGlow}>
            <View style={styles.trophyEmblem}>
              <Award size={48} color={palette.gold} />
            </View>
          </View>

          <View style={styles.heroTextWrap}>
            <View style={styles.congratsRow}>
              <Sparkles size={16} color={palette.orangeDeep} />
              <Text style={[typography.eyebrow, styles.heroEyebrow]}>MASTERCLASS COMPLETED</Text>
              <Sparkles size={16} color={palette.orangeDeep} />
            </View>
            <Text style={[typography.title1, styles.heroTitle]}>Congratulations, Founder!</Text>
            <Text style={[typography.body, styles.heroSubtitle]}>
              You have completed all modules, required diagnostic checks, and verified operator
              cases for this masterclass.
            </Text>
          </View>
        </View>

        {/* Certificate Card */}
        <Card style={styles.certificateCard}>
          <View style={styles.certInnerBorder}>
            {/* Certificate Header */}
            <View style={styles.certHeader}>
              <View style={styles.sealWrap}>
                <Award size={24} color={palette.gold} />
              </View>
              <Text style={[typography.eyebrow, styles.certInstitution]}>
                SOFE INSTITUTE OF VENTURE EXCELLENCE
              </Text>
              <Text style={[typography.title2, styles.certHeading]}>CERTIFICATE OF MASTERY</Text>
            </View>

            {/* Recipient Notice */}
            <View style={styles.certBody}>
              <Text style={[typography.caption, styles.certPreamble]}>
                This official credential certifies that
              </Text>
              <Text style={[typography.title3, styles.certRecipient]}>Founder Practitioner</Text>
              <Text style={[typography.caption, styles.certPreamble]}>
                has rigorously fulfilled all curriculum benchmarks and practical assessments in
              </Text>
              <Text style={[typography.bodyStrong, styles.certCourse]}>{courseTitle}</Text>
            </View>

            {/* Verification Metadata */}
            <View style={styles.certMetaRow}>
              <View style={styles.certMetaCol}>
                <Text style={[typography.caption, styles.certMetaLabel]}>ISSUE DATE</Text>
                <Text style={[typography.bodyStrong, styles.certMetaValue]}>{issueDate}</Text>
              </View>
              <View style={styles.certMetaCol}>
                <Text style={[typography.caption, styles.certMetaLabel]}>CREDENTIAL ID</Text>
                <Text style={[typography.bodyStrong, styles.certMetaValue]}>{certificateId}</Text>
              </View>
            </View>

            {/* Signature & Security Seal */}
            <View style={styles.certFooter}>
              <View style={styles.verifiedRow}>
                <ShieldCheck size={16} color={palette.orangeDeep} />
                <Text style={[typography.caption, styles.verifiedText]}>
                  Cryptographically Verified
                </Text>
              </View>
              <View style={styles.signatureWrap}>
                <Text style={[typography.bodyStrong, styles.signatureName]}>Naveen Jain</Text>
                <Text style={[typography.caption, styles.signatureTitle]}>
                  Managing Director, SOFE
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Key Competencies Mastered */}
        <Card style={styles.competenciesCard}>
          <Text style={[typography.eyebrow, styles.compEyebrow]}>COMPETENCIES VERIFIED</Text>
          <View style={styles.compList}>
            <View style={styles.compItem}>
              <CheckCircle2 size={18} color={palette.orangeDeep} />
              <Text style={[typography.bodySmall, styles.compText]}>
                Problem-Solution Validation & Budget Reallocation Diagnostics
              </Text>
            </View>
            <View style={styles.compItem}>
              <CheckCircle2 size={18} color={palette.orangeDeep} />
              <Text style={[typography.bodySmall, styles.compText]}>
                CAC Payback, Contribution Margins & Burn Multiple Modeling
              </Text>
            </View>
            <View style={styles.compItem}>
              <CheckCircle2 size={18} color={palette.orangeDeep} />
              <Text style={[typography.bodySmall, styles.compText]}>
                Core Executive Hiring & 0-to-1 PMF Signal Architecture
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <Button variant="primary" fullWidth onPress={handleDownloadCertificate}>
            Download Certificate (PDF) ↓
          </Button>

          <Button variant="secondary" fullWidth onPress={handleShare}>
            Share Achievement ↗
          </Button>

          <TouchableOpacity
            style={styles.curriculumLinkButton}
            onPress={() => router.push(`/learn/course/${slug}/curriculum` as never)}
            accessibilityRole="button"
          >
            <Text style={[typography.labelSmall, styles.curriculumLinkText]}>
              Review Course Curriculum
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  navTitle: {
    color: palette.navy,
  },
  navButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.huge,
  },
  celebrationHero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  trophyGlow: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.gold,
    ...shadows.soft,
  },
  trophyEmblem: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  congratsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroEyebrow: {
    color: palette.orangeDeep,
  },
  heroTitle: {
    color: palette.navy,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: palette.slate,
    textAlign: 'center',
  },
  certificateCard: {
    backgroundColor: palette.white,
    padding: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: palette.navy,
    ...shadows.soft,
  },
  certInnerBorder: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  certHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    paddingBottom: spacing.md,
  },
  sealWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  certInstitution: {
    color: palette.orangeDeep,
    textAlign: 'center',
  },
  certHeading: {
    color: palette.navy,
    textAlign: 'center',
  },
  certBody: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  certPreamble: {
    color: palette.mutedOnLight,
    textAlign: 'center',
  },
  certRecipient: {
    color: palette.navy,
    textAlign: 'center',
  },
  certCourse: {
    color: palette.navy,
    textAlign: 'center',
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.line,
  },
  certMetaCol: {
    gap: spacing.xs,
  },
  certMetaLabel: {
    color: palette.mutedOnLight,
  },
  certMetaValue: {
    color: palette.navy,
  },
  certFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifiedText: {
    color: palette.orangeDeep,
  },
  signatureWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  signatureName: {
    color: palette.navy,
  },
  signatureTitle: {
    color: palette.mutedOnLight,
  },
  competenciesCard: {
    backgroundColor: palette.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  compEyebrow: {
    color: palette.navy,
  },
  compList: {
    gap: spacing.sm,
  },
  compItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  compText: {
    flex: 1,
    color: palette.slate,
  },
  actionGroup: {
    gap: spacing.md,
  },
  curriculumLinkButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curriculumLinkText: {
    color: palette.navy,
    textDecorationLine: 'underline',
  },
});
