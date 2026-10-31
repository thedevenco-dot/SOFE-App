import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components';

export default function ProfileScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.text }]}>Profile</Text>

        {/* Profile Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.xl,
            },
          ]}
        >
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: palette.navy,
                  borderColor: palette.orange,
                  borderWidth: 2,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[typography.title2, { color: palette.orange }]}>F</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={[typography.title3, { color: colors.text }]}>Founder Learner</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Building in stealth
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Stats */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Text style={[typography.title3, { color: colors.text }]}>Learning Progress</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
            0 lessons completed • 0 hours logged
          </Text>
        </View>

        {/* Developer / Design System Link */}
        <Button
          variant="secondary"
          size="md"
          style={{ marginTop: spacing.xl }}
          onPress={() => router.push('/gallery')}
        >
          Open Component Gallery
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  card: {
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCol: {
    marginLeft: 16,
  },
});
