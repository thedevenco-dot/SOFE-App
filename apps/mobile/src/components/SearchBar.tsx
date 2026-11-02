import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Filter, Search, X } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFilterPress?: () => void;
  hasFilterButton?: boolean;
  style?: ViewStyle;
}

/**
 * Standard SearchBar matching DESIGN_V2.md Section 5.
 * White input container with border, search icon, clear button,
 * paired with an icon button for filters.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search courses, playbooks, founders...',
  onClear,
  onFilterPress,
  hasFilterButton = true,
  style,
}: SearchBarProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Search Field Box */}
      <View style={styles.inputBox}>
        <Search size={18} color={palette.mutedOnLight} style={styles.leadingIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.mutedOnLight}
          style={styles.textInput}
        />
        {value.length > 0 && onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={palette.mutedOnLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Button */}
      {hasFilterButton && onFilterPress ? (
        <TouchableOpacity
          onPress={onFilterPress}
          accessibilityLabel="Open filters"
          style={styles.filterBtn}
        >
          <Filter size={18} color={palette.navy} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  leadingIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: palette.navy,
    fontSize: 14,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
