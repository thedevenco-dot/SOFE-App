import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export interface TopTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TopTabs({ tabs, activeTab, onTabChange, style, testID }: TopTabsProps) {
  const { colors, palette, spacing } = useTheme();

  return (
    <View testID={testID} style={[styles.container, { borderBottomColor: colors.border }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const textColor = isActive ? colors.accentText : colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onTabChange(tab.key)}
              style={[
                styles.tab,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderBottomColor: isActive ? palette.orange : 'transparent',
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  typography.bodyStrong,
                  {
                    color: textColor,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
                {tab.count !== undefined ? ` (${tab.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
  },
  scroll: {
    flexDirection: 'row',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
