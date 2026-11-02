import React from 'react';
import { Bookmark, Heart, MessageSquare, Repeat } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { Avatar } from './Avatar';
import { TagChip } from './TagChip';

export type PostType = 'Essay' | 'Teardown' | 'Showcase';

export interface PostCardProps {
  authorName: string;
  authorRole: string;
  authorAvatarUrl?: string;
  timeAgo: string;
  postType?: PostType;
  title: string;
  body: string;
  mediaUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  bookmarksCount?: number;
  metricLabel?: string;
  metricValue?: string;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onRepostPress?: () => void;
  onBookmarkPress?: () => void;
  style?: ViewStyle;
}

/**
 * Community and Network Post Card matching DESIGN_V2.md Section 5.
 * Types: Essay, Teardown, Showcase.
 */
export function PostCard({
  authorName,
  authorRole,
  authorAvatarUrl,
  timeAgo,
  postType = 'Essay',
  title,
  body,
  mediaUrl,
  likesCount = 42,
  commentsCount = 12,
  repostsCount = 5,
  bookmarksCount = 18,
  metricLabel,
  metricValue,
  onLikePress,
  onCommentPress,
  onRepostPress,
  onBookmarkPress,
  style,
}: PostCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Header: Author + Post Type Tag */}
      <View style={styles.headerRow}>
        <View style={styles.authorLeft}>
          <Avatar size={44} name={authorName} url={authorAvatarUrl} isVerified />
          <View style={styles.authorTextCol}>
            <Text style={[typography.bodyStrong, styles.authorName]}>{authorName}</Text>
            <Text style={[typography.caption, styles.authorRole]}>
              {authorRole} · {timeAgo}
            </Text>
          </View>
        </View>

        {postType ? <TagChip label={postType} variant="orange" /> : null}
      </View>

      {/* Title & Body */}
      <Text style={[typography.title2, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.bodyText]}>{body}</Text>

      {/* Optional Media */}
      {mediaUrl ? (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
      ) : null}

      {/* Optional Metric Strip (e.g. Teardown metrics) */}
      {metricLabel && metricValue ? (
        <View style={styles.metricStrip}>
          <Text style={[typography.caption, styles.metricLabel]}>{metricLabel}</Text>
          <Text style={[typography.bodyStrong, styles.metricValue]}>{metricValue}</Text>
        </View>
      ) : null}

      {/* Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={onLikePress} style={styles.actionBtn}>
          <Heart size={16} color={palette.mutedOnLight} />
          <Text style={[typography.caption, styles.actionCount]}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onCommentPress} style={styles.actionBtn}>
          <MessageSquare size={16} color={palette.mutedOnLight} />
          <Text style={[typography.caption, styles.actionCount]}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRepostPress} style={styles.actionBtn}>
          <Repeat size={16} color={palette.mutedOnLight} />
          <Text style={[typography.caption, styles.actionCount]}>{repostsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBookmarkPress} style={styles.actionBtn}>
          <Bookmark size={16} color={palette.mutedOnLight} />
          <Text style={[typography.caption, styles.actionCount]}>{bookmarksCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorTextCol: {
    marginLeft: spacing.sm + 2,
  },
  authorName: {
    color: palette.navy,
  },
  authorRole: {
    color: palette.mutedOnLight,
  },
  title: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  bodyText: {
    color: palette.mutedOnLight,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  mediaContainer: {
    height: 180,
    width: '100%',
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: palette.slate,
    marginBottom: spacing.md,
  },
  metricStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.peachTint,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  metricLabel: {
    color: palette.navy,
  },
  metricValue: {
    color: palette.orangeDeep,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    color: palette.mutedOnLight,
    marginLeft: 4,
    fontSize: 12,
  },
});
