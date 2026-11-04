import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, CheckCircle2, Zap, ArrowRight } from 'lucide-react-native';
import { colorRoles, palette, radius, spacing } from '@sofe/shared';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { practiseApi, type ReflectionPromptInfo } from '../../src/lib/practise-api';

export default function DailyReflectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promptData, setPromptData] = useState<ReflectionPromptInfo | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(20);

  const loadPrompt = useCallback(async () => {
    try {
      const data = await practiseApi.getTodayReflection();
      setPromptData(data);
    } catch {
      // Fallback
      setPromptData({
        id: 'default_reflection',
        prompt:
          'What was your most critical strategic decision today and what cognitive bias might have influenced it?',
        category: 'strategy',
        dateKey: 'today',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  const handleSubmit = async () => {
    if (!responseText.trim()) {
      Alert.alert('Empty Reflection', 'Please write a brief synthesis before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await practiseApi.submitReflection({
        responseText: responseText.trim(),
        promptId: promptData?.id,
      });

      setPointsAwarded(result.pointsAwarded ?? 20);
      setSubmitted(true);
    } catch {
      Alert.alert('Submission Error', 'Failed to submit reflection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = responseText.trim() ? responseText.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={40} color={colorRoles.successOnLight} />
          </View>

          <Text style={[typography.title1, styles.successTitle, { color: palette.navy }]}>
            Synthesis Recorded
          </Text>

          <Text style={[typography.body, styles.successSub, { color: palette.mutedOnLight }]}>
            Your executive reflection has been committed to your journal and your daily practice
            slot is complete.
          </Text>

          <View
            style={[
              styles.rewardChip,
              { backgroundColor: palette.cream, borderColor: palette.line },
            ]}
          >
            <Zap size={16} color={palette.gold} fill={palette.gold} />
            <Text
              style={[
                typography.caption,
                { color: palette.navy, fontWeight: '600', marginLeft: spacing.xs },
              ]}
            >
              +{pointsAwarded} pts credited
            </Text>
          </View>

          <Button
            variant="primary"
            size="lg"
            pill
            onPress={() => router.replace('/(tabs)/practise' as never)}
            style={styles.continueButton}
          >
            <Text style={[typography.body, { color: palette.cream, fontWeight: '600' }]}>
              Return to Practise
            </Text>
            <ArrowRight size={16} color={palette.cream} style={{ marginLeft: spacing.xs }} />
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
          {/* Eyebrow */}
          <View style={styles.eyebrowRow}>
            <Sparkles size={16} color={palette.gold} />
            <Text
              style={[
                typography.caption,
                { color: palette.gold, marginLeft: spacing.xs, fontWeight: '700' },
              ]}
            >
              DAILY EXECUTIVE SYNTHESIS · +20 PTS
            </Text>
          </View>

          {/* Prompt Card */}
          <Card variant="outlined" padding={spacing.md} style={styles.promptCard}>
            <Text
              style={[
                typography.caption,
                { color: palette.mutedOnLight, marginBottom: spacing.xs },
              ]}
            >
              TODAY&apos;S PROMPT · {promptData?.category?.toUpperCase() || 'STRATEGY'}
            </Text>
            <Text style={[typography.title2, styles.promptText, { color: palette.navy }]}>
              {promptData?.prompt}
            </Text>
          </Card>

          {/* Synthesis Input Card */}
          <View
            style={[
              styles.inputContainer,
              { borderColor: palette.line, backgroundColor: palette.white },
            ]}
          >
            <TextInput
              style={[typography.body, styles.textInput, { color: palette.navy }]}
              placeholder="Synthesize your operational insight, bias check, or hypothesis test..."
              placeholderTextColor={palette.mutedOnLight}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={responseText}
              onChangeText={setResponseText}
            />

            <View style={styles.inputMetaRow}>
              <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                {wordCount} words
              </Text>
              <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                Min recommended: 20 words
              </Text>
            </View>
          </View>

          {/* Submit Action */}
          <Button
            variant="primary"
            size="lg"
            pill
            disabled={wordCount === 0 || submitting}
            loading={submitting}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Submit Synthesis
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  promptCard: {
    backgroundColor: palette.cream,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  promptText: {
    lineHeight: 28,
  },
  inputContainer: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  textInput: {
    minHeight: 160,
    lineHeight: 24,
  },
  inputMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  submitButton: {
    marginBottom: spacing.xxl,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    marginBottom: spacing.xs,
  },
  successSub: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  continueButton: {
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
