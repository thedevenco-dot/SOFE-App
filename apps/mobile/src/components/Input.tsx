import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff, Search, X } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  isSearch?: boolean;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Input({
  label,
  error,
  isSearch = false,
  value,
  onChangeText,
  onClear,
  secureTextEntry,
  placeholder,
  containerStyle,
  style,
  testID,
  ...rest
}: InputProps) {
  const { colors, palette, radius, spacing, isDark } = useTheme();
  const [isSecure, setIsSecure] = useState(Boolean(secureTextEntry));

  const hasValue = Boolean(value && value.length > 0);
  const borderColor = error ? colors.error : isDark ? colors.border : palette.line;
  const backgroundColor = isDark ? colors.surface : palette.cream;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            typography.caption,
            { color: colors.text, marginBottom: spacing.xs, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor,
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          },
          style,
        ]}
      >
        {isSearch && (
          <Search size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
        )}

        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          style={[styles.textInput, typography.body, { color: colors.text }]}
          {...rest}
        />

        {hasValue && onClear && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: spacing.sm }}
          >
            {isSecure ? (
              <Eye size={18} color={colors.textMuted} />
            ) : (
              <EyeOff size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
  },
});
