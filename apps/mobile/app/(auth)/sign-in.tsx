import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { useLearnerAuth } from '../../src/lib/learner-auth-context';

export default function SignInScreen() {
  const { colors, palette, spacing } = useTheme();
  const { setPhoneToVerify, signInWithGoogle, signInWithApple, signInDemo } = useLearnerAuth();

  const [phone, setPhone] = useState('9876543210');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhoneContinue = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneError(null);
    setPhoneToVerify(`+91${cleaned.slice(-10)}`);
    router.push('/(auth)/otp');
  };

  const handleSocialGoogle = async () => {
    setLoading(true);
    try {
      const nextRoute = await signInWithGoogle();
      router.replace(nextRoute);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialApple = async () => {
    setLoading(true);
    try {
      const nextRoute = await signInWithApple();
      router.replace(nextRoute);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (
    scenario: 'new' | 'mid_goals' | 'mid_personalise' | 'completed',
  ) => {
    setLoading(true);
    try {
      const nextRoute = await signInDemo(scenario);
      router.replace(nextRoute);
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
          JOIN SOFE
        </Text>
        <Text style={[typography.title1, { color: colors.text, marginTop: spacing.xs }]}>
          Build Your Foundation
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Deliberate daily practice, expert playbooks, and peer founders.
        </Text>
      </View>

      {/* Phone Auth */}
      <View style={styles.form}>
        <Input
          label="Mobile Number"
          placeholder="98765 43210"
          value={phone}
          onChangeText={(val) => {
            setPhone(val);
            if (phoneError) setPhoneError(null);
          }}
          keyboardType="phone-pad"
          error={phoneError || undefined}
        />

        <Button
          variant="primary"
          size="lg"
          onPress={handlePhoneContinue}
          style={{ marginTop: spacing.md }}
        >
          Continue with Phone
        </Button>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text
            style={[typography.micro, { color: colors.textMuted, marginHorizontal: spacing.md }]}
          >
            OR CONTINUE WITH
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Social Buttons */}
        <View style={{ gap: spacing.sm }}>
          <Button variant="secondary" size="md" onPress={handleSocialGoogle} loading={loading}>
            Continue with Google
          </Button>
          <Button variant="secondary" size="md" onPress={handleSocialApple} loading={loading}>
            Continue with Apple
          </Button>
        </View>

        {/* Demo Fast Track for Evaluation */}
        <View
          style={[styles.demoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text
            style={[
              typography.micro,
              { color: palette.orange, fontWeight: '700', marginBottom: 6 },
            ]}
          >
            TEST SCENARIOS (EVALUATION BYPASS)
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <TouchableOpacity
              onPress={() => handleQuickDemo('new')}
              style={[styles.demoPill, { borderColor: colors.border }]}
            >
              <Text style={[typography.micro, { color: colors.text }]}>New (ON5)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickDemo('mid_goals')}
              style={[styles.demoPill, { borderColor: colors.border }]}
            >
              <Text style={[typography.micro, { color: colors.text }]}>Resume ON6</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickDemo('mid_personalise')}
              style={[styles.demoPill, { borderColor: colors.border }]}
            >
              <Text style={[typography.micro, { color: colors.text }]}>Resume ON7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickDemo('completed')}
              style={[styles.demoPill, { borderColor: colors.border }]}
            >
              <Text style={[typography.micro, { color: colors.text }]}>Home (HM1)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer Legal */}
      <Text
        style={[
          typography.micro,
          { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
        ]}
      >
        By continuing, you agree to SOFE's Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  demoCard: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
});
