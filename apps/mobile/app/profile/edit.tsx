import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components';
import { profileApi } from '../../src/lib/profile-api';

export default function EditProfileScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [goalsText, setGoalsText] = useState('');

  useEffect(() => {
    async function fetchMe() {
      try {
        const me = await profileApi.getMyProfile();
        setName(me.name || '');
        setHeadline(me.headline || '');
        setBio(me.bio || '');
        setLocation(me.location || '');
        setAvatarUrl(me.avatarUrl || '');
        setInterestsText((me.interests || []).join(', '));
        setGoalsText((me.goals || []).join(', '));
      } catch {
        // Fallback default
      }
    }
    fetchMe();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }

    setSaving(true);
    try {
      const interests = interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const goals = goalsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await profileApi.updateMyProfile({
        name: name.trim(),
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        interests: interests.length > 0 ? interests : undefined,
        goals: goals.length > 0 ? goals : undefined,
      });

      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { borderBottomColor: colors.border, padding: spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[typography.bodyStrong, { color: colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[typography.title3, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={palette.orange} />
          ) : (
            <Text style={[typography.bodyStrong, { color: palette.orange }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatarPlaceholder,
              {
                backgroundColor: palette.navy,
                borderRadius: radius.pill,
                borderColor: palette.orange,
                borderWidth: 2,
              },
            ]}
          >
            <Text style={[typography.title1, { color: palette.orange }]}>
              {name ? name.charAt(0).toUpperCase() : 'F'}
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={[styles.formGroup, { marginTop: spacing.lg }]}>
          <Text style={[typography.captionStrong, { color: colors.textMuted }]}>FULL NAME *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Maya Chen"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              typography.body,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          />
        </View>

        <View style={[styles.formGroup, { marginTop: spacing.md }]}>
          <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
            HEADLINE (Max 160 chars)
          </Text>
          <TextInput
            value={headline}
            onChangeText={setHeadline}
            maxLength={160}
            placeholder="e.g. Founder & CEO at StealthAI"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              typography.body,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          />
        </View>

        <View style={[styles.formGroup, { marginTop: spacing.md }]}>
          <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
            BIO (Max 1000 chars)
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            maxLength={1000}
            multiline
            numberOfLines={4}
            placeholder="Tell your founder journey..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.inputMultiline,
              typography.body,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          />
        </View>

        <View style={[styles.formGroup, { marginTop: spacing.md }]}>
          <Text style={[typography.captionStrong, { color: colors.textMuted }]}>LOCATION</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. San Francisco, USA or Bengaluru, India"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              typography.body,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          />
        </View>

        <View style={[styles.formGroup, { marginTop: spacing.md }]}>
          <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
            AVATAR IMAGE URL
          </Text>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              typography.body,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          />
        </View>

        <View style={[styles.formGroup, { marginTop: spacing.md }]}>
          <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
            INTERESTS (Comma separated)
          </Text>
          <TextInput
            value={interestsText}
            onChangeText={setInterestsText}
            placeholder="B2B SaaS, Generative AI, Fintech"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              typography.body,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          />
        </View>

        <View style={[styles.formGroup, { marginTop: spacing.md }]}>
          <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
            GOALS (Comma separated)
          </Text>
          <TextInput
            value={goalsText}
            onChangeText={setGoalsText}
            placeholder="Raise Seed Round, Launch MVP"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              typography.body,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          />
        </View>

        <Button
          variant="primary"
          size="lg"
          style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}
          loading={saving}
          onPress={handleSave}
        >
          Save Profile
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  content: {
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
  },
  inputMultiline: {
    borderWidth: 1,
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
