import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';
import { Button } from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  testID?: string;
}

export function ErrorState({
  message = 'Something went wrong while loading this content.',
  onRetry,
  retryLabel = 'Try Again',
  testID,
}: ErrorStateProps) {
  const { colors, spacing } = useTheme();

  return (
    <View testID={testID} style={[styles.container, { padding: spacing.xxl }]}>
      <View style={[styles.iconContainer, { marginBottom: spacing.lg }]}>
        <AlertTriangle size={48} color={colors.error} strokeWidth={1.5} />
      </View>

      <Text style={[typography.title3, { color: colors.text, textAlign: 'center' }]}>
        Unable to Load
      </Text>

      <Text
        style={[
          typography.body,
          { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
        ]}
      >
        {message}
      </Text>

      {onRetry && (
        <Button
          variant="primary"
          size="md"
          onPress={onRetry}
          style={{ marginTop: spacing.xl, minWidth: 160 }}
        >
          {retryLabel}
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
