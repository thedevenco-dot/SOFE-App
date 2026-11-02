import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';
import { Button } from './Button';

export interface QuoteCardProps {
  eyebrow?: string;
  quote: string;
  author: string;
  authorRole?: string;
  onCitePress?: () => void;
  style?: ViewStyle;
}

/**
 * Editorial Quote Card matching DESIGN_V2.md.
 * Tinted card with serif italic quote, author attribution and optional "Cite" action.
 */
export function QuoteCard({
  eyebrow = 'THE SOFE METHODOLOGY',
  quote,
  author,
  authorRole,
  onCitePress,
  style,
}: QuoteCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Eyebrow */}
      <EyebrowLabel style={{ marginBottom: spacing.xs }}>{eyebrow}</EyebrowLabel>

      {/* Serif Italic Quote */}
      <Text style={[typography.title2, styles.quoteText]}>“{quote}”</Text>

      {/* Author Row + Cite Action */}
      <View style={styles.footerRow}>
        <View style={styles.authorCol}>
          <Text style={[typography.bodyStrong, styles.authorText]}>{author}</Text>
          {authorRole ? (
            <Text style={[typography.caption, styles.roleText]}>{authorRole}</Text>
          ) : null}
        </View>

        {onCitePress ? (
          <Button variant="ghost" size="sm" onPress={onCitePress}>
            Cite
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.peachTint,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  quoteText: {
    color: palette.navy,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  authorCol: {
    flex: 1,
  },
  authorText: {
    color: palette.navy,
  },
  roleText: {
    color: palette.mutedOnLight,
    marginTop: 2,
  },
});
