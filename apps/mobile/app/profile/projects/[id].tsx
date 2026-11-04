import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../src/theme/theme-context';
import { typography } from '../../../src/theme/typography';
import { Button } from '../../../src/components';
import { profileApi } from '../../../src/lib/profile-api';
import type { ProjectDto } from '@sofe/shared';

interface ProjectWithAuthor extends ProjectDto {
  author?: {
    id: string;
    name: string;
    headline?: string;
    avatarUrl?: string;
    username?: string;
  };
}

export default function ProjectDetailScreen() {
  const { colors, palette, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [project, setProject] = useState<ProjectWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const p = await profileApi.getProject(id);
        setProject(p);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { borderBottomColor: colors.border, padding: spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[typography.bodyStrong, { color: palette.orange }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[typography.title3, { color: colors.text }]} numberOfLines={1}>
          Project Details
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/profile/projects/edit',
              params: { id },
            })
          }
        >
          <Text style={[typography.bodyStrong, { color: palette.orange }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : project ? (
        <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
          {/* Cover Image or Fallback Header */}
          {project.coverUrl ? (
            <Image
              source={{ uri: project.coverUrl }}
              style={[
                styles.coverImage,
                { borderRadius: radius.lg, backgroundColor: colors.surface },
              ]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.coverPlaceholder,
                {
                  backgroundColor: palette.peachTint,
                  borderRadius: radius.lg,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[typography.display, { color: palette.orange }]}>
                {project.title.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Title and Badges */}
          <Text style={[typography.title1, { color: colors.text, marginTop: spacing.md }]}>
            {project.title}
          </Text>

          <View style={[styles.badgeRow, { marginTop: spacing.sm }]}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    project.status === 'published' ? palette.peachTint : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionStrong,
                  {
                    color: project.status === 'published' ? palette.orange : colors.textMuted,
                  },
                ]}
              >
                {project.status.toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
                {project.visibility.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Author Byline */}
          {project.author ? (
            <View
              style={[
                styles.authorCard,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginTop: spacing.md,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.authorRow}>
                <View
                  style={[
                    styles.authorAvatar,
                    {
                      backgroundColor: palette.navy,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={[typography.title3, { color: palette.orange }]}>
                    {project.author.name?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
                <View style={styles.authorInfo}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {project.author.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {project.author.headline || 'Founder'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Tags */}
          {project.tags && project.tags.length > 0 ? (
            <View style={[styles.tagRow, { marginTop: spacing.md }]}>
              {project.tags.map((tag, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tagChip,
                    { backgroundColor: colors.surface, borderRadius: radius.sm },
                  ]}
                >
                  <Text style={[typography.captionStrong, { color: palette.orange }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Summary / Description */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginTop: spacing.md,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[typography.title3, { color: colors.text }]}>Overview & Milestone</Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textMuted,
                  marginTop: spacing.sm,
                  lineHeight: 22,
                },
              ]}
            >
              {project.summary}
            </Text>
          </View>

          {/* Links Section */}
          {project.links && project.links.length > 0 ? (
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginTop: spacing.md,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[typography.title3, { color: colors.text }]}>Project Links</Text>
              <View style={{ marginTop: spacing.sm }}>
                {project.links.map((link, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => openUrl(link)}
                    style={[
                      styles.linkItem,
                      {
                        backgroundColor: colors.background,
                        borderRadius: radius.md,
                        padding: spacing.md,
                        marginTop: spacing.xs,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[typography.bodyStrong, { color: palette.orange }]}
                    >
                      🔗 {link}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Attached Files Section */}
          {project.files && project.files.length > 0 ? (
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginTop: spacing.md,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[typography.title3, { color: colors.text }]}>Attached Documents</Text>
              <View style={{ marginTop: spacing.sm }}>
                {project.files.map((file, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => openUrl(file.url)}
                    style={[
                      styles.linkItem,
                      {
                        backgroundColor: colors.background,
                        borderRadius: radius.md,
                        padding: spacing.md,
                        marginTop: spacing.xs,
                      },
                    ]}
                  >
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>
                      📄 {file.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {Math.round(file.size / 1024)} KB
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <Button
            variant="secondary"
            size="md"
            style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}
            onPress={() =>
              router.push({
                pathname: '/profile/projects/edit',
                params: { id },
              })
            }
          >
            Edit This Project
          </Button>
        </ScrollView>
      ) : (
        <View style={styles.centerBox}>
          <Text style={[typography.body, { color: colors.textMuted }]}>Project not found.</Text>
        </View>
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
  coverImage: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  authorCard: {
    width: '100%',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    marginLeft: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionCard: {
    width: '100%',
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
