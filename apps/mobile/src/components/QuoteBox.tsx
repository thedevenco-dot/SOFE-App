import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface QuoteBoxProps {
  quote: string;
  author: string;
  onDark?: boolean;
  style?: ViewStyle;
}

/**
 * Bordered quote panel inside hero cards and dispatches.
 * Serif italic quote text with right-aligned author attribution.
 */
export function QuoteBox({ quote, author, onDark = true, style }: QuoteBoxProps) {
  return (
    <View
      style={[
        styles.box,
        {
          borderColor: onDark ? 'rgba(255, 255, 255, 0.2)' : palette.line,
          backgroundColor: onDark ? 'rgba(6, 30, 48, 0.4)' : palette.peachTint,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.title3,
          styles.quoteText,
          { color: onDark ? palette.white : palette.navy },
        ]}
      >
        “{quote}”
      </Text>
      <Text
        style={[
          typography.caption,
          styles.authorText,
          { color: onDark ? palette.orange : palette.orangeDeep },
        ]}
      >
        — {author}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    marginVertical: spacing.sm,
  },
  quoteText: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  authorText: {
    textAlign: 'right',
    marginTop: spacing.xs,
    fontWeight: '700',
  },
});
