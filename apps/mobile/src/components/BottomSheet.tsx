import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  testID?: string;
}

export function BottomSheet({ visible, onClose, title, children, testID }: BottomSheetProps) {
  const { colors, radius, spacing, isDark } = useTheme();

  return (
    <Modal
      testID={testID}
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  paddingHorizontal: spacing.xl,
                  paddingBottom: spacing.xxl,
                  paddingTop: spacing.md,
                  borderTopWidth: isDark ? 0 : 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              {/* Drag Handle */}
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    {
                      backgroundColor: colors.border,
                      borderRadius: radius.pill,
                    },
                  ]}
                />
              </View>

              {/* Header */}
              {title && (
                <View style={[styles.header, { marginBottom: spacing.md }]}>
                  <Text style={[typography.title3, { color: colors.text }]}>{title}</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Content */}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 48, 0.65)', // Semi-transparent navy backdrop
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
