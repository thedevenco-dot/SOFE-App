import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';

export interface ContentSheetProps {
  children: React.ReactNode;
  hasDragHandle?: boolean;
  style?: ViewStyle;
}

/**
 * Main Cream Content Sheet matching DESIGN_V2.md.
 * Top radius 28, overlaps header by -24pt, with optional drag handle bar.
 */
export function ContentSheet({ children, hasDragHandle = false, style }: ContentSheetProps) {
  return (
    <View style={[styles.sheet, style]}>
      {hasDragHandle ? (
        <View style={styles.handleContainer}>
          <View style={styles.dragHandle} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    marginTop: -24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
  },
});
