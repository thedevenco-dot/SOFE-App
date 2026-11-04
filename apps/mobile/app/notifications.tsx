import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Flame,
  Award,
  BookOpen,
  FileText,
  CheckCircle,
  Megaphone,
  Bell,
  CheckCheck,
} from 'lucide-react-native';
import { colorRoles, palette, type NotificationItemDto } from '@sofe/shared';
import { useTheme } from '../src/theme/theme-context';
import { typography } from '../src/theme/typography';
import { EmptyState } from '../src/components/EmptyState';
import { notificationsApi } from '../src/lib/notifications-api';
import { handleDeepLink } from '../src/lib/deep-links';

interface GroupedNotifications {
  sectionTitle: string;
  items: NotificationItemDto[];
}

function getRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  const now = Date.now();
  const time = new Date(isoString).getTime();
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function groupNotifications(items: NotificationItemDto[]): GroupedNotifications[] {
  const today: NotificationItemDto[] = [];
  const yesterday: NotificationItemDto[] = [];
  const older: NotificationItemDto[] = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;

  for (const item of items) {
    const timestamp = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
    if (timestamp >= startOfToday) {
      today.push(item);
    } else if (timestamp >= startOfYesterday) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  }

  const result: GroupedNotifications[] = [];
  if (today.length > 0) result.push({ sectionTitle: 'Today', items: today });
  if (yesterday.length > 0) result.push({ sectionTitle: 'Yesterday', items: yesterday });
  if (older.length > 0) result.push({ sectionTitle: 'Older', items: older });
  return result;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, spacing: s, radius: r } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getNotifications({ page: 1, limit: 50 });
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // gracefully fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markRead({ all: true });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleItemPress = async (item: NotificationItemDto) => {
    if (!item.readAt) {
      notificationsApi.markRead({ ids: [item.id] }).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (item.data?.deepLink) {
      handleDeepLink(item.data.deepLink, router);
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'streak_reminder':
        return <Flame size={18} color={palette.orange} />;
      case 'points_earned':
        return <Award size={18} color={palette.gold} />;
      case 'new_course':
        return <BookOpen size={18} color={palette.white} />;
      case 'new_article':
        return <FileText size={18} color={colorRoles.successOnDark} />;
      case 'purchase_confirmed':
        return <CheckCircle size={18} color={colorRoles.successOnDark} />;
      case 'announcement':
      default:
        return <Megaphone size={18} color={palette.orange} />;
    }
  };

  const grouped = groupNotifications(notifications);

  return (
    <SafeAreaView
      testID="notifications-screen"
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: palette.slate,
            paddingHorizontal: s.lg,
            paddingVertical: s.md,
          },
        ]}
      >
        <TouchableOpacity
          testID="notifications-back-btn"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: palette.slate, borderRadius: r.pill }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={20} color={palette.white} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[typography.title2, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: palette.orange, borderRadius: r.pill },
              ]}
            >
              <Text style={[typography.micro, { color: palette.white }]}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            testID="mark-all-read-btn"
            onPress={handleMarkAllRead}
            style={styles.markAllButton}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
          >
            <CheckCheck size={16} color={palette.orange} />
            <Text style={[typography.caption, { color: palette.orange, marginLeft: s.xs }]}>
              Mark read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          testID="notifications-empty-state"
          title="All caught up!"
          description="You don't have any notifications right now. Keep learning to earn badges and streak milestones."
          icon={<Bell size={40} color={palette.orange} strokeWidth={1.5} />}
          actionLabel="Explore Courses"
          onAction={() => router.push('/(tabs)/learn')}
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(section) => section.sectionTitle}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.orange}
            />
          }
          contentContainerStyle={{ paddingBottom: s.xxl }}
          renderItem={({ item: section }) => (
            <View style={{ marginTop: s.md }}>
              <View style={[styles.sectionHeader, { paddingHorizontal: s.lg, marginBottom: s.xs }]}>
                <Text style={[typography.eyebrow, { color: palette.mutedOnDark }]}>
                  {section.sectionTitle}
                </Text>
              </View>

              {section.items.map((notification) => {
                const isUnread = !notification.readAt;
                return (
                  <TouchableOpacity
                    key={notification.id}
                    testID={`notification-item-${notification.id}`}
                    onPress={() => handleItemPress(notification)}
                    style={[
                      styles.notificationRow,
                      {
                        backgroundColor: isUnread ? palette.slate : colors.background,
                        borderBottomColor: palette.slate,
                        paddingHorizontal: s.lg,
                        paddingVertical: s.md,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={notification.title}
                  >
                    <View
                      style={[
                        styles.iconTile,
                        {
                          backgroundColor: isUnread ? palette.navy : palette.slate,
                          borderRadius: r.md,
                          marginRight: s.md,
                        },
                      ]}
                    >
                      {renderTypeIcon(notification.type)}
                    </View>

                    <View style={styles.textColumn}>
                      <View style={styles.rowTopLine}>
                        <Text
                          style={[
                            typography.bodyStrong,
                            { color: colors.text, flex: 1, marginRight: s.xs },
                          ]}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        <Text style={[typography.micro, { color: palette.mutedOnDark }]}>
                          {getRelativeTime(notification.createdAt)}
                        </Text>
                      </View>

                      <Text
                        style={[
                          typography.caption,
                          { color: palette.mutedOnDark, marginTop: s.xs },
                        ]}
                        numberOfLines={2}
                      >
                        {notification.body}
                      </Text>
                    </View>

                    {isUnread && (
                      <View
                        style={[
                          styles.unreadDot,
                          {
                            backgroundColor: palette.orange,
                            borderRadius: r.pill,
                            marginLeft: s.sm,
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerPlaceholder: {
    width: 36,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  iconTile: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadDot: {
    width: 8,
    height: 8,
  },
});
