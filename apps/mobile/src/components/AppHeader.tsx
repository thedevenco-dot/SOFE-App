import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { LogoTile } from './LogoTile';
import { Avatar } from './Avatar';

export type AppHeaderVariant = 'home' | 'title' | 'blog' | 'default';

export interface AppHeaderProps {
  variant?: AppHeaderVariant;
  sectionName?: string;
  title?: string;
  subtitle?: string;
  greetingName?: string;
  hasUnreadNotifications?: boolean;
  userAvatarUrl?: string;
  userInitials?: string;
  onNotificationsPress?: () => void;
  onSearchPress?: () => void;
  onAvatarPress?: () => void;
  style?: ViewStyle;
}

/**
 * Standard Navy AppHeader matching DESIGN_V2.md Section 5.
 * Left: 28px LogoTile + Serif "SOFE" wordmark (+ optional section name)
 * Right: Bell with optional orange unread dot, Avatar (orange ring / initials)
 * Variants:
 * - home: Displays greeting block below header ("Good morning, {name}")
 * - title: Screen title and subtitle below
 * - blog: Includes search action icon
 * - default: Standard top bar
 */
export function AppHeader({
  variant = 'default',
  sectionName,
  title,
  subtitle,
  greetingName = 'Founder',
  hasUnreadNotifications = false,
  userAvatarUrl,
  userInitials = 'AL',
  onNotificationsPress,
  onSearchPress,
  onAvatarPress,
  style,
}: AppHeaderProps) {
  return (
    <View style={[styles.headerContainer, style]}>
      {/* Top Bar Row */}
      <View style={styles.topBar}>
        {/* Left: Logo & Wordmark */}
        <View style={styles.leftGroup}>
          <LogoTile size={28} />
          <Text style={[typography.title3, styles.wordmark]}>
            SOFE
            {sectionName ? (
              <Text style={styles.sectionSubtitle}> · {sectionName.toUpperCase()}</Text>
            ) : null}
          </Text>
        </View>

        {/* Right: Actions */}
        <View style={styles.rightGroup}>
          {variant === 'blog' && onSearchPress ? (
            <TouchableOpacity
              onPress={onSearchPress}
              accessibilityLabel="Search blog"
              style={styles.iconBtn}
            >
              <Search size={20} color={palette.white} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={onNotificationsPress}
            accessibilityLabel="Notifications"
            style={styles.iconBtn}
          >
            <Bell size={20} color={palette.white} />
            {hasUnreadNotifications ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>

          <TouchableOpacity onPress={onAvatarPress} accessibilityLabel="Profile avatar">
            <Avatar
              size={32}
              name={greetingName || userInitials}
              url={userAvatarUrl}
              hasOrangeRing
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Variant-specific Bottom Zones */}
      {variant === 'home' ? (
        <View style={styles.bottomBlock}>
          <Text style={[typography.display, styles.titleText]}>Good morning, {greetingName}.</Text>
          {subtitle ? <Text style={[typography.body, styles.subtitleText]}>{subtitle}</Text> : null}
        </View>
      ) : variant === 'title' && title ? (
        <View style={styles.bottomBlock}>
          <Text style={[typography.display, styles.titleText]}>{title}</Text>
          {subtitle ? <Text style={[typography.body, styles.subtitleText]}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    color: palette.white,
    marginLeft: spacing.sm + 2,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: palette.mutedOnDark,
    fontWeight: '600',
    fontSize: 13,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: palette.orange,
  },
  bottomBlock: {
    marginTop: spacing.lg,
  },
  titleText: {
    color: palette.white,
  },
  subtitleText: {
    color: palette.mutedOnDark,
    marginTop: 4,
  },
});
