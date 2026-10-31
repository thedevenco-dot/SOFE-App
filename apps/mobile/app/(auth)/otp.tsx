import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { useLearnerAuth } from '../../src/lib/learner-auth-context';

export default function OtpScreen() {
  const { colors, palette, spacing } = useTheme();
  const { phoneToVerify, verifyPhoneOtp } = useLearnerAuth();

  const [code, setCode] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextRoute = await verifyPhoneOtp(code);
      router.replace(nextRoute);
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setError(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      {/* Header */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={[typography.micro, { color: palette.orange, letterSpacing: 2, fontWeight: '700' }]}
        >
          VERIFICATION
        </Text>
        <Text style={[typography.title1, { color: colors.text, marginTop: spacing.xs }]}>
          Enter Security Code
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          We sent a 6-digit code to{' '}
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {phoneToVerify || '+91 98765 43210'}
          </Text>
        </Text>
      </View>

      {/* Code Input */}
      <View style={styles.form}>
        <Input
          label="6-Digit OTP"
          placeholder="000000"
          value={code}
          onChangeText={(val) => {
            const numeric = val.replace(/\D/g, '').slice(0, 6);
            setCode(numeric);
            if (error) setError(null);
          }}
          keyboardType="number-pad"
          error={error || undefined}
        />

        <Button
          variant="primary"
          size="lg"
          onPress={handleVerify}
          loading={loading}
          style={{ marginTop: spacing.lg }}
        >
          Verify & Continue
        </Button>

        {/* Resend Timer */}
        <View style={styles.resendContainer}>
          {resendTimer > 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Resend code in{' '}
              <Text style={{ color: palette.orange, fontWeight: '700' }}>{resendTimer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={[typography.caption, { color: palette.orange, fontWeight: '700' }]}>
                Resend Verification Code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back Link */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: spacing.xl, alignSelf: 'center' }}
        >
          <Text style={[typography.caption, { color: colors.textMuted }]}>Change phone number</Text>
        </TouchableOpacity>
      </View>
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
});
