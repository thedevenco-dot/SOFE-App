import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Chip } from '../../src/components/Chip';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useLearnerAuth } from '../../src/lib/learner-auth-context';

const MANIFESTATION_WORDS = [
  'RELENTLESS',
  'DISCIPLINE',
  'CLARITY',
  'EXECUTE',
  'IMPACT',
  'CONVICTION',
  'RESILIENCE',
  'FOCUS',
];

interface CuratedQuote {
  text: string;
  author: string;
}

const CURATED_QUOTES: CuratedQuote[] = [
  {
    text: 'Action is the foundational key to all success.',
    author: 'Pablo Picasso',
  },
  {
    text: 'Stay hungry, stay foolish.',
    author: 'Steve Jobs',
  },
  {
    text: 'Make something people want.',
    author: 'Paul Graham',
  },
  {
    text: 'If you are not embarrassed by the first version of your product, you launched too late.',
    author: 'Reid Hoffman',
  },
];

export default function PersonaliseScreen() {
  const { colors, palette, spacing, radius } = useTheme();
  const { user, updateProfile } = useLearnerAuth();

  const [selectedWord, setSelectedWord] = useState<string>(user?.manifestationWord || 'RELENTLESS');
  const [customWord, setCustomWord] = useState<string>('');
  const [isCustomWordActive, setIsCustomWordActive] = useState<boolean>(false);

  const [selectedQuote, setSelectedQuote] = useState<CuratedQuote>(
    user?.quote
      ? { text: user.quote.text, author: user.quote.author || 'Founder' }
      : CURATED_QUOTES[0],
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const activeWord =
    isCustomWordActive && customWord.trim().length > 0
      ? customWord.trim().toUpperCase()
      : selectedWord;

  const handleSelectWord = (word: string) => {
    setIsCustomWordActive(false);
    setSelectedWord(word);
    setError(null);
  };

  const handleSelectQuote = (quote: CuratedQuote) => {
    setSelectedQuote(quote);
    setError(null);
  };

  const handleNext = async () => {
    if (!activeWord) {
      setError('Please choose or enter a manifestation word.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        manifestationWord: activeWord,
        quote: {
          text: selectedQuote.text,
          author: selectedQuote.author,
          source: 'library',
        },
      });
      router.push('/(onboarding)/permissions');
    } catch {
      setError('Failed to save personal preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await updateProfile({
        manifestationWord: 'RELENTLESS',
        quote: {
          text: CURATED_QUOTES[0].text,
          author: CURATED_QUOTES[0].author,
          source: 'library',
        },
      });
      router.push('/(onboarding)/permissions');
    } catch {
      router.push('/(onboarding)/permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl * 2 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={[typography.micro, { color: palette.orange, letterSpacing: 2, fontWeight: '700' }]}
        >
          STEP 3 OF 4
        </Text>
        <Text style={[typography.title1, { color: colors.text, marginTop: spacing.xs }]}>
          Your North Star
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Fuel your daily founder loop with a manifestation word and an anchoring quote.
        </Text>
      </View>

      {/* Manifestation Word Section */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[typography.title3, { color: colors.text, marginBottom: spacing.xs }]}>
          Daily Manifestation Word
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
          Shown every morning at the top of your dashboard.
        </Text>

        <View style={styles.chipsContainer}>
          {MANIFESTATION_WORDS.map((word) => {
            const isSelected = !isCustomWordActive && selectedWord === word;
            return (
              <Chip
                key={word}
                label={word}
                selected={isSelected}
                onPress={() => handleSelectWord(word)}
                variant="filter"
                style={styles.chip}
              />
            );
          })}
        </View>

        {/* Custom Word Input */}
        <View
          style={[
            styles.customInputContainer,
            {
              borderColor: isCustomWordActive ? palette.orange : colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              marginTop: spacing.sm,
            },
          ]}
        >
          <TextInput
            placeholder="Or type a custom word (e.g. UNSTOPPABLE)"
            placeholderTextColor={colors.textMuted}
            value={customWord}
            onChangeText={(txt) => {
              setCustomWord(txt);
              setIsCustomWordActive(true);
            }}
            onFocus={() => setIsCustomWordActive(true)}
            style={[
              typography.body,
              {
                color: colors.text,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          />
        </View>
      </View>

      {/* Guiding Quote Section */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[typography.title3, { color: colors.text, marginBottom: spacing.xs }]}>
          Guiding Founder Quote
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
          Your perspective anchor when overcoming hard days.
        </Text>

        <View style={{ gap: spacing.md }}>
          {CURATED_QUOTES.map((q, idx) => {
            const isSelected = selectedQuote.text === q.text;
            return (
              <Card
                key={idx}
                onPress={() => handleSelectQuote(q)}
                style={[
                  styles.quoteCard,
                  {
                    borderColor: isSelected ? palette.orange : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    backgroundColor: isSelected ? colors.surfaceRaised : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.text,
                      fontStyle: 'italic',
                      lineHeight: 22,
                    },
                  ]}
                >
                  "{q.text}"
                </Text>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? palette.orange : colors.textMuted,
                      marginTop: spacing.xs,
                      fontWeight: '600',
                    },
                  ]}
                >
                  — {q.author}
                </Text>
              </Card>
            );
          })}
        </View>
      </View>

      {/* Error display */}
      {error && (
        <Text style={[typography.caption, { color: colors.error, marginBottom: spacing.md }]}>
          {error}
        </Text>
      )}

      {/* Actions */}
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Button variant="primary" size="lg" loading={loading} onPress={handleNext}>
          Next: Notification Settings
        </Button>
        <Button variant="ghost" size="md" disabled={loading} onPress={handleSkip}>
          Skip for now
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  customInputContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  quoteCard: {
    padding: 14,
  },
});
