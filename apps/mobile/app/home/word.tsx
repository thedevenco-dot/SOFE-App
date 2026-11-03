import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/Button';
import { homeApi } from '../../src/lib/home-api';

interface LibraryWord {
  _id?: string;
  id?: string;
  word: string;
  meaning: string;
}

export default function WordScreen() {
  const router = useRouter();
  const [words, setWords] = useState<LibraryWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<LibraryWord | null>(null);
  const [customWord, setCustomWord] = useState('');
  const [customMeaning, setCustomMeaning] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    homeApi
      .getWords()
      .then((data) => {
        if (mounted) {
          setWords((data as LibraryWord[]) || []);
          if (data && (data as LibraryWord[]).length > 0) {
            setSelectedWord((data as LibraryWord[])[0]);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleApply = () => {
    Alert.alert('Focus Calibrated', 'Your daily focus word has been set.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const activeDisplayWord =
    isCustomMode && customWord ? customWord.toUpperCase() : selectedWord?.word || 'MOMENTUM';
  const activeDisplayMeaning =
    isCustomMode && customMeaning
      ? customMeaning
      : selectedWord?.meaning || 'Continuous forward velocity in execution.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.title1, styles.heading]}>Daily Focus Word</Text>
      <Text style={[typography.body, styles.subheading]}>
        Select a core strategic anchor for today&apos;s decision-making and venture momentum.
      </Text>

      {/* Hero Display Card */}
      <View style={styles.heroCard}>
        <Text style={[typography.eyebrow, styles.heroEyebrow]}>TODAY&apos;S ANCHOR</Text>
        <Text style={[typography.display, styles.heroWord]}>{activeDisplayWord}</Text>
        <Text style={[typography.body, styles.heroMeaning]}>{activeDisplayMeaning}</Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, !isCustomMode && styles.tabButtonActive]}
          onPress={() => setIsCustomMode(false)}
        >
          <Text
            style={[typography.bodyStrong, !isCustomMode ? styles.tabTextActive : styles.tabText]}
          >
            Curated Lexicon
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, isCustomMode && styles.tabButtonActive]}
          onPress={() => setIsCustomMode(true)}
        >
          <Text
            style={[typography.bodyStrong, isCustomMode ? styles.tabTextActive : styles.tabText]}
          >
            Custom Word
          </Text>
        </TouchableOpacity>
      </View>

      {isCustomMode ? (
        <View style={styles.customContainer}>
          <Text style={[typography.caption, styles.inputLabel]}>Focus Word</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ASYMMETRY, VELOCITY, FOCUS"
            placeholderTextColor={palette.slate}
            value={customWord}
            onChangeText={setCustomWord}
            autoCapitalize="characters"
          />
          <Text style={[typography.caption, styles.inputLabel]}>Operating Meaning</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What does this mean for today's decisions?"
            placeholderTextColor={palette.slate}
            value={customMeaning}
            onChangeText={setCustomMeaning}
            multiline
            numberOfLines={3}
          />
        </View>
      ) : loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={palette.orange} size="small" />
        </View>
      ) : (
        <View style={styles.wordsGrid}>
          {words.map((w, idx) => {
            const isSelected = selectedWord?.word === w.word;
            return (
              <TouchableOpacity
                key={w.id || w._id || idx}
                activeOpacity={0.8}
                style={[styles.wordCard, isSelected && styles.wordCardSelected]}
                onPress={() => setSelectedWord(w)}
              >
                <Text style={[typography.title3, styles.wordCardTitle]}>{w.word}</Text>
                <Text style={[typography.caption, styles.wordCardMeaning]} numberOfLines={2}>
                  {w.meaning}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <Button variant="primary" onPress={handleApply}>
          Apply Focus Word
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heading: {
    color: palette.navy,
  },
  subheading: {
    color: palette.slate,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: palette.navy,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  heroEyebrow: {
    color: palette.orange,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  heroWord: {
    color: palette.cream,
    fontFamily: 'Newsreader_700Bold',
    letterSpacing: 3,
    textAlign: 'center',
  },
  heroMeaning: {
    color: palette.peachTint,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: palette.peachTint,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  tabButtonActive: {
    backgroundColor: palette.navy,
  },
  tabText: {
    color: palette.slate,
  },
  tabTextActive: {
    color: palette.cream,
  },
  customContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: palette.navy,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.navy,
    fontFamily: 'Inter_400Regular',
    marginBottom: spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  wordsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  wordCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.soft,
  },
  wordCardSelected: {
    borderColor: palette.orange,
    borderWidth: 2,
  },
  wordCardTitle: {
    color: palette.navy,
    letterSpacing: 1,
  },
  wordCardMeaning: {
    color: palette.slate,
    marginTop: 4,
  },
  actions: {
    marginTop: spacing.md,
  },
});
