import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';
import { AvatarStack } from './Avatar';
import { Button } from './Button';

export interface RoundRobinCardProps {
  eyebrow?: string;
  question: string;
  participants?: Array<{ name?: string; url?: string }>;
  responsesCount?: number;
  onJoinThread?: () => void;
  style?: ViewStyle;
}

/**
 * Community Discussion Card matching DESIGN_V2.md.
 * 1px orange outline on cream, eyebrow with icon, serif question, AvatarStack, response count, "Join thread →".
 */
export function RoundRobinCard({
  eyebrow = 'FOUNDER ROUND ROBIN',
  question,
  participants = [{ name: 'Alex' }, { name: 'Sarah' }, { name: 'Dev' }],
  responsesCount = 21,
  onJoinThread,
  style,
}: RoundRobinCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Eyebrow with Icon */}
      <View style={styles.eyebrowRow}>
        <MessageCircle size={14} color={palette.orangeDeep} />
        <EyebrowLabel style={{ marginLeft: 4 }}>{eyebrow}</EyebrowLabel>
      </View>

      {/* Serif Question */}
      <Text style={[typography.title2, styles.question]}>{question}</Text>

      {/* Participants Stack & Count */}
      <View style={styles.footerRow}>
        <View style={styles.participantsRow}>
          <AvatarStack avatars={participants} size={24} />
          <Text style={[typography.caption, styles.responsesText]}>
            +{responsesCount} responses
          </Text>
        </View>

        <Button variant="ghost" size="sm" showTrailingArrow onPress={onJoinThread}>
          Join thread
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cream,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.orange,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  question: {
    color: palette.navy,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responsesText: {
    color: palette.mutedOnLight,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});
