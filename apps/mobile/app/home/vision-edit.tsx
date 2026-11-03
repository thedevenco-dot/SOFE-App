import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/Button';
import { homeApi } from '../../src/lib/home-api';

const PRESET_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    label: 'Global Headquarters',
  },
  {
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    label: 'Engineering Team',
  },
  {
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    label: 'IPO Ringing Bell',
  },
  {
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    label: 'Keynote Stage',
  },
];

export default function VisionEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    caption?: string;
    order?: string;
  }>();

  const isEditing = Boolean(params.id);
  const [imageUrl, setImageUrl] = useState(params.imageUrl || PRESET_IMAGES[0].url);
  const [caption, setCaption] = useState(params.caption || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!imageUrl.trim()) {
      Alert.alert('Image Required', 'Please enter or select an image URL for your vision card.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && params.id) {
        await homeApi.updateVisionBoardItem(params.id, {
          caption: caption.trim(),
        });
      } else {
        await homeApi.createVisionBoardItem({
          imageUrl: imageUrl.trim(),
          caption: caption.trim(),
        });
      }
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save vision card';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[typography.title1, styles.title]}>
        {isEditing ? 'Edit Vision Card' : 'New Vision Card'}
      </Text>
      <Text style={[typography.body, styles.subtitle]}>
        Visualise your breakthrough outcome with a concrete, tangible milestone card.
      </Text>

      {/* Image Preview */}
      <View style={styles.previewCard}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={[styles.previewImage, styles.previewPlaceholder]} />
        )}
        <View style={styles.previewOverlay}>
          <Text style={[typography.bodyStrong, styles.previewCaption]}>
            {caption || 'Add your ambitious milestone caption...'}
          </Text>
        </View>
      </View>

      {/* Preset Inspiration */}
      {!isEditing && (
        <View style={styles.section}>
          <Text style={[typography.caption, styles.sectionTitle]}>CHOOSE INSPIRATION PRESET</Text>
          <View style={styles.presetRow}>
            {PRESET_IMAGES.map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.presetThumb, imageUrl === preset.url && styles.presetThumbSelected]}
                onPress={() => {
                  setImageUrl(preset.url);
                  if (!caption) setCaption(preset.label);
                }}
              >
                <Image source={{ uri: preset.url }} style={styles.presetImg} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.form}>
        <Text style={[typography.caption, styles.label]}>IMAGE URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={palette.slate}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
          editable={!isEditing}
        />

        <Text style={[typography.caption, styles.label]}>CAPTION / MILESTONE GOAL</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. 1,000 enterprise customers, Series A term sheet, etc."
          placeholderTextColor={palette.slate}
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={3}
          maxLength={120}
        />
        <Text style={[typography.caption, styles.charCount]}>{caption.length}/120</Text>
      </View>

      <View style={styles.actions}>
        <Button variant="primary" onPress={handleSave} disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Pin to Vision Board'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: palette.navy,
  },
  subtitle: {
    color: palette.slate,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  previewCard: {
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.peachTint,
    marginBottom: spacing.lg,
    ...shadows.hover,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    backgroundColor: palette.slate,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 15, 30, 0.7)',
    padding: spacing.md,
  },
  previewCaption: {
    color: palette.cream,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: palette.orangeDeep,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetThumb: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetThumbSelected: {
    borderColor: palette.orange,
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  form: {
    marginBottom: spacing.lg,
  },
  label: {
    color: palette.navy,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.navy,
    fontFamily: 'Inter_400Regular',
    marginBottom: spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.xs,
  },
  charCount: {
    textAlign: 'right',
    color: palette.slate,
    marginBottom: spacing.md,
  },
  actions: {
    marginTop: spacing.md,
  },
});
