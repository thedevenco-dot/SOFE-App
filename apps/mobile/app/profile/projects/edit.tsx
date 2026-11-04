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
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../src/theme/theme-context';
import { typography } from '../../../src/theme/typography';
import { Button, FilterChip } from '../../../src/components';
import { profileApi } from '../../../src/lib/profile-api';
import type { Visibility, ProjectStatus } from '@sofe/shared';

export default function EditProjectScreen() {
  const { colors, palette, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [linksText, setLinksText] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [visibility, setVisibility] = useState<Visibility>('public');

  useEffect(() => {
    if (id) {
      async function loadProject() {
        try {
          const p = await profileApi.getProject(id!);
          setTitle(p.title || '');
          setSummary(p.summary || '');
          setCoverUrl(p.coverUrl || '');
          setTagsText((p.tags || []).join(', '));
          setLinksText((p.links || []).join('\n'));
          setStatus(p.status || 'draft');
          setVisibility(p.visibility || 'public');
        } catch {
          Alert.alert('Error', 'Unable to load project');
          router.back();
        } finally {
          setLoading(false);
        }
      }
      loadProject();
    }
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Project title is required.');
      return;
    }
    if (!summary.trim()) {
      Alert.alert('Validation Error', 'Project summary is required.');
      return;
    }

    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const links = linksText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        coverUrl: coverUrl.trim() || undefined,
        tags,
        links,
        status,
        visibility,
        files: [],
      };

      if (isEditing && id) {
        await profileApi.updateProject(id, payload);
      } else {
        await profileApi.createProject(payload);
      }

      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save project. Please check fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await profileApi.deleteProject(id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete project.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { borderBottomColor: colors.border, padding: spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[typography.bodyStrong, { color: colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[typography.title3, { color: colors.text }]}>
          {isEditing ? 'Edit Project' : 'New Project'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={palette.orange} />
          ) : (
            <Text style={[typography.bodyStrong, { color: palette.orange }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
          {/* Status Segment */}
          <View style={styles.formGroup}>
            <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
              PROJECT STATUS
            </Text>
            <View style={[styles.filterRow, { marginTop: spacing.xs }]}>
              <FilterChip
                label="Draft"
                selected={status === 'draft'}
                onPress={() => setStatus('draft')}
              />
              <FilterChip
                label="Published"
                selected={status === 'published'}
                onPress={() => setStatus('published')}
              />
            </View>
          </View>

          {/* Visibility Segment */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[typography.captionStrong, { color: colors.textMuted }]}>VISIBILITY</Text>
            <View style={[styles.filterRow, { marginTop: spacing.xs }]}>
              <FilterChip
                label="Public"
                selected={visibility === 'public'}
                onPress={() => setVisibility('public')}
              />
              <FilterChip
                label="Followers"
                selected={visibility === 'followers'}
                onPress={() => setVisibility('followers')}
              />
              <FilterChip
                label="Private"
                selected={visibility === 'private'}
                onPress={() => setVisibility('private')}
              />
            </View>
          </View>

          {/* Title Field */}
          <View style={[styles.formGroup, { marginTop: spacing.lg }]}>
            <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
              PROJECT TITLE * (Max 120 chars)
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              placeholder="e.g. AI-Powered CRM for Solo Founders"
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

          {/* Summary Field */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
              SUMMARY / CASE STUDY * (Max 2000 chars)
            </Text>
            <TextInput
              value={summary}
              onChangeText={setSummary}
              maxLength={2000}
              multiline
              numberOfLines={6}
              placeholder="Describe the problem, architecture, milestones, and traction..."
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

          {/* Cover Image URL */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
              COVER IMAGE URL
            </Text>
            <TextInput
              value={coverUrl}
              onChangeText={setCoverUrl}
              placeholder="https://example.com/cover.png"
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

          {/* Tags */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
              TAGS (Comma separated)
            </Text>
            <TextInput
              value={tagsText}
              onChangeText={setTagsText}
              placeholder="ai, b2b, saas, nextjs, react-native"
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

          {/* Links */}
          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
              PROJECT LINKS (One URL per line)
            </Text>
            <TextInput
              value={linksText}
              onChangeText={setLinksText}
              multiline
              numberOfLines={3}
              placeholder="https://github.com/my-org/demo&#10;https://my-demo-app.com"
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

          {/* Save Button */}
          <Button
            variant="primary"
            size="lg"
            loading={saving}
            style={{ marginTop: spacing.xl }}
            onPress={handleSave}
          >
            {isEditing ? 'Save Changes' : 'Publish Project'}
          </Button>

          {/* Delete Button if Editing */}
          {isEditing ? (
            <Button
              variant="secondary"
              size="md"
              loading={deleting}
              style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
              onPress={handleDelete}
            >
              Delete Project
            </Button>
          ) : (
            <View style={{ marginBottom: spacing.xl }} />
          )}
        </ScrollView>
      )}
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 1,
  },
  inputMultiline: {
    borderWidth: 1,
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
