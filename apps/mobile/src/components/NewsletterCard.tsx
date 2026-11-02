import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';
import { Button } from './Button';

export interface NewsletterCardProps {
  eyebrow?: string;
  headline?: string;
  body?: string;
  buttonLabel?: string;
  onSubmitEmail?: (email: string) => void;
  style?: ViewStyle;
}

/**
 * Editorial Newsletter Subscription Card (Blog screen).
 * Dark navy card, eyebrow, serif headline, body description, email input, full-width orange button.
 */
export function NewsletterCard({
  eyebrow = 'THE SATURDAY DISPATCH',
  headline = 'Tactical playbooks for venture founders.',
  body = 'Join 12,000+ founders receiving our weekly teardown dispatches every Saturday morning.',
  buttonLabel = 'Subscribe to Dispatch',
  onSubmitEmail,
  style,
}: NewsletterCardProps) {
  const [email, setEmail] = useState('');

  return (
    <View style={[styles.card, style]}>
      {/* Eyebrow */}
      <EyebrowLabel onDark style={{ marginBottom: spacing.xs }}>
        {eyebrow}
      </EyebrowLabel>

      {/* Serif Headline */}
      <Text style={[typography.title2, styles.headline]}>{headline}</Text>

      {/* Body */}
      <Text style={[typography.body, styles.bodyText]}>{body}</Text>

      {/* Email Input */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="founder@venture.com"
        placeholderTextColor={palette.mutedOnDark}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      {/* Full-width Orange Button */}
      <Button variant="primary" size="lg" fullWidth onPress={() => onSubmitEmail?.(email)}>
        {buttonLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.navy,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headline: {
    color: palette.white,
    marginBottom: spacing.xs,
  },
  bodyText: {
    color: palette.mutedOnDark,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: palette.slate,
    borderRadius: radius.button,
    height: 48,
    paddingHorizontal: spacing.md,
    color: palette.white,
    fontSize: 14,
    marginBottom: spacing.md,
  },
});
