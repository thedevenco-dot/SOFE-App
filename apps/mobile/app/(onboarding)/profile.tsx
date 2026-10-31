import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Avatar } from '../../src/components/Avatar';
import { useLearnerAuth } from '../../src/lib/learner-auth-context';

export default function ProfileSetupScreen() {
  const { colors, palette, spacing } = useTheme();
  const { user, updateProfile } = useLearnerAuth();

  const [name, setName] = useState(user?.name || 'Rohan Mehta');
  const [headline, setHeadline] = useState(user?.headline || 'Founder in Residence');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!name || name.trim().length < 2) {
      setError('Please provide your full founder name (at least 2 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        name: name.trim(),
        headline: headline.trim() || undefined,
      });
      router.push('/(onboarding)/goals');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      {/* Header */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={[typography.micro, { color: palette.orange, letterSpacing: 2, fontWeight: '700' }]}
        >
          STEP 1 OF 4
        </Text>
        <Text style={[typography.title1, { color: colors.text, marginTop: spacing.xs }]}>
          Your Founder Profile
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          How you will be recognized across peer playbooks and discussions.
        </Text>
      </View>

      {/* Avatar Preview */}
      <View style={styles.avatarContainer}>
        <Avatar name={name || 'Founder'} size={96} />
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Initials generated automatically
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <Input
          label="Full Name *"
          placeholder="e.g. Rohan Mehta"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (error) setError(null);
          }}
          error={error || undefined}
        />

        <View style={{ marginTop: spacing.md }}>
          <Input
            label="Founder Headline (Optional)"
            placeholder="e.g. Building AI agents for logistics"
            value={headline}
            onChangeText={setHeadline}
          />
        </View>

        <Button
          variant="primary"
          size="lg"
          onPress={handleNext}
          loading={loading}
          style={{ marginTop: spacing.xl }}
        >
          Continue to Goals
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
});
