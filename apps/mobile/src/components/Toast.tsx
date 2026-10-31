import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  autoDismissMs?: number;
  testID?: string;
}

export function Toast({
  visible,
  message,
  type = 'info',
  onDismiss,
  autoDismissMs = 3000,
  testID,
}: ToastProps) {
  const { colors, palette, radius, spacing, isDark } = useTheme();

  useEffect(() => {
    if (!visible || autoDismissMs <= 0) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, onDismiss]);

  if (!visible) return null;

  let backgroundColor: string = colors.surfaceRaised;
  let iconColor: string = palette.orange;

  if (type === 'success') {
    backgroundColor = isDark ? '#0E3A28' : '#E8F5E9';
    iconColor = colors.success;
  } else if (type === 'error') {
    backgroundColor = isDark ? '#3D1414' : '#FFEBEE';
    iconColor = colors.error;
  } else {
    backgroundColor = isDark ? palette.slate : palette.cream;
    iconColor = palette.orange;
  }

  return (
    <View testID={testID} style={styles.positionWrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          {type === 'success' ? (
            <CheckCircle size={18} color={iconColor} />
          ) : type === 'error' ? (
            <AlertCircle size={18} color={iconColor} />
          ) : (
            <Info size={18} color={iconColor} />
          )}
        </View>

        <Text style={[styles.message, typography.caption, { color: colors.text }]}>{message}</Text>

        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  positionWrapper: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontWeight: '600',
  },
});
