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
import { QuoteBox } from '../../src/components/QuoteBox';
import { homeApi } from '../../src/lib/home-api';

interface LibraryQuote {
  _id?: string;
  id?: string;
  text: string;
  author: string;
  tags?: string[];
}

export default function QuoteScreen() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<LibraryQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<LibraryQuote | null>(null);
  const [customText, setCustomText] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    homeApi
      .getQuotes()
      .then((data) => {
        if (mounted) {
          setQuotes((data as LibraryQuote[]) || []);
          if (data && (data as LibraryQuote[]).length > 0) {
            setSelectedQuote((data as LibraryQuote[])[0]);
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
    Alert.alert('Manifesto Updated', 'Your founder manifesto has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.title1, styles.heading]}>Founder Manifesto</Text>
      <Text style={[typography.body, styles.subheading]}>
        Calibrate your executive mindset with principles from veteran venture builders.
      </Text>

      {/* Active Selection Preview */}
      <View style={styles.previewContainer}>
        <Text style={[typography.eyebrow, styles.sectionEyebrow]}>ACTIVE MANIFESTO</Text>
        <QuoteBox
          quote={
            isCustomMode && customText
              ? customText
              : selectedQuote?.text || 'Stay focused on relentless execution.'
          }
          author={
            isCustomMode && customAuthor
              ? customAuthor
              : selectedQuote?.author || 'Founder Discipline'
          }
        />
      </View>

      {/* Mode Toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, !isCustomMode && styles.tabButtonActive]}
          onPress={() => setIsCustomMode(false)}
        >
          <Text
            style={[typography.bodyStrong, !isCustomMode ? styles.tabTextActive : styles.tabText]}
          >
            Curated Library
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, isCustomMode && styles.tabButtonActive]}
          onPress={() => setIsCustomMode(true)}
        >
          <Text
            style={[typography.bodyStrong, isCustomMode ? styles.tabTextActive : styles.tabText]}
          >
            Custom Manifesto
          </Text>
        </TouchableOpacity>
      </View>

      {isCustomMode ? (
        <View style={styles.customContainer}>
          <Text style={[typography.caption, styles.inputLabel]}>Manifesto Text</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your personal operating principle..."
            placeholderTextColor={palette.slate}
            value={customText}
            onChangeText={setCustomText}
            multiline
            numberOfLines={4}
          />
          <Text style={[typography.caption, styles.inputLabel]}>Author / Attributed</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Personal Mnemonic, Andy Grove"
            placeholderTextColor={palette.slate}
            value={customAuthor}
            onChangeText={setCustomAuthor}
          />
        </View>
      ) : loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={palette.orange} size="small" />
        </View>
      ) : (
        <View style={styles.quotesList}>
          {quotes.map((q, idx) => {
            const isSelected = selectedQuote?.text === q.text;
            return (
              <TouchableOpacity
                key={q.id || q._id || idx}
                activeOpacity={0.8}
                style={[styles.quoteCard, isSelected && styles.quoteCardSelected]}
                onPress={() => setSelectedQuote(q)}
              >
                <Text style={[typography.body, styles.quoteCardText]}>“{q.text}”</Text>
                <Text style={[typography.caption, styles.quoteCardAuthor]}>— {q.author}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <Button variant="primary" onPress={handleApply}>
          Set as Daily Manifesto
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
  previewContainer: {
    marginBottom: spacing.lg,
  },
  sectionEyebrow: {
    color: palette.orangeDeep,
    marginBottom: spacing.xs,
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
    height: 100,
    textAlignVertical: 'top',
  },
  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  quotesList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quoteCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.soft,
  },
  quoteCardSelected: {
    borderColor: palette.orange,
    borderWidth: 2,
    backgroundColor: palette.white,
  },
  quoteCardText: {
    color: palette.navy,
    fontFamily: 'Newsreader_400Regular',
    lineHeight: 22,
  },
  quoteCardAuthor: {
    color: palette.orangeDeep,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.md,
  },
});
