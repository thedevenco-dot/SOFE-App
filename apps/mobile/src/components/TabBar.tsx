import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface TabBarItem {
  key: string;
  label: string;
  icon: (props: { color: string; focused: boolean; size: number }) => React.ReactNode;
}

export interface TabBarProps {
  tabs: TabBarItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  style?: ViewStyle;
}

/**
 * Global Navy TabBar matching DESIGN_V2.md.
 * Navy background, uppercase 10pt labels, active orange filled icon, inactive mutedOnDark.
 */
export function TabBar({ tabs, activeKey, onTabPress, style }: TabBarProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const color = isActive ? palette.orange : palette.mutedOnDark;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.8}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            {tab.icon({ color, focused: isActive, size: 22 })}
            <Text style={[typography.tab, styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: palette.navy,
    borderTopColor: palette.slate,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 64,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  label: {
    marginTop: 4,
  },
});
