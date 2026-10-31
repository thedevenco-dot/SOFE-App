import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  const { colors, palette, spacing } = useTheme();

  return (
    <View testID={testID} style={[styles.container, { padding: spacing.xxl }]}>
      <View style={[styles.iconContainer, { marginBottom: spacing.lg }]}>
        {icon || <Inbox size={48} color={palette.orange} strokeWidth={1.5} />}
      </View>

      <Text style={[typography.title3, { color: colors.text, textAlign: 'center' }]}>{title}</Text>

      {description && (
        <Text
          style={[
            typography.body,
            { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="md"
          onPress={onAction}
          style={{ marginTop: spacing.xl, minWidth: 160 }}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
