import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, Clock, Sparkles, Users, Flame } from 'lucide-react-native';
import { palette } from '@sofe/shared';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Card } from '../../src/components/Card';
import { profileApi } from '../../src/lib/profile-api';

interface NotificationSettingsState {
  streakReminder: boolean;
  newContent: boolean;
  social: boolean;
  marketing: boolean;
  reminderTime: string;
}

const AVAILABLE_TIMES = ['08:00', '09:00', '12:00', '18:00', '20:00', '21:00'];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colors, spacing: s, radius: r } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState<NotificationSettingsState>({
    streakReminder: true,
    newContent: true,
    social: true,
    marketing: false,
    reminderTime: '09:00',
  });

  const loadPreferences = useCallback(async () => {
    try {
      const profile = await profileApi.getMyProfile();
      const userSettings = (
        profile as unknown as {
          settings?: { notifications?: Partial<NotificationSettingsState>; reminderTime?: string };
        }
      ).settings;
      if (userSettings) {
        setSettings({
          streakReminder: userSettings.notifications?.streakReminder ?? true,
          newContent: userSettings.notifications?.newContent ?? true,
          social: userSettings.notifications?.social ?? true,
          marketing: userSettings.notifications?.marketing ?? false,
          reminderTime: userSettings.reminderTime ?? '09:00',
        });
      }
    } catch {
      // fallback to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const saveSettings = async (next: NotificationSettingsState) => {
    setSettings(next);
    setSaving(true);
    setSavedSuccess(false);

    try {
      await profileApi.updateMyProfile({
        settings: {
          notifications: {
            streakReminder: next.streakReminder,
            newContent: next.newContent,
            social: next.social,
            marketing: next.marketing,
          },
          reminderTime: next.reminderTime,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      // rollback or alert
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (field: keyof Omit<NotificationSettingsState, 'reminderTime'>) => {
    const next = { ...settings, [field]: !settings[field] };
    saveSettings(next);
  };

  const handleSelectTime = (time: string) => {
    const next = { ...settings, reminderTime: time };
    saveSettings(next);
  };

  return (
    <SafeAreaView
      testID="notification-settings-screen"
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
          testID="settings-back-btn"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: palette.slate, borderRadius: r.pill }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={20} color={palette.white} />
        </TouchableOpacity>

        <Text style={[typography.title2, { color: colors.text }]}>Notification Settings</Text>

        <View style={styles.headerRight}>
          {saving ? (
            <ActivityIndicator size="small" color={palette.orange} />
          ) : savedSuccess ? (
            <Text style={[typography.caption, { color: palette.orange }]}>Saved</Text>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: s.lg,
            paddingBottom: s.xxl,
          }}
        >
          <Text style={[typography.eyebrow, { color: palette.mutedOnDark, marginBottom: s.sm }]}>
            Daily Habits
          </Text>

          {/* Streak Reminder Switch */}
          <Card
            variant="default"
            style={{
              marginBottom: s.md,
              backgroundColor: palette.slate,
              borderColor: palette.slate,
              padding: s.md,
            }}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: palette.navy, borderRadius: r.md, marginRight: s.md },
                ]}
              >
                <Flame size={20} color={palette.orange} />
              </View>
              <View style={styles.textColumn}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  Daily Streak Reminder
                </Text>
                <Text style={[typography.caption, { color: palette.mutedOnDark, marginTop: s.xs }]}>
                  Get a timely nudge to practice and protect your streak
                </Text>
              </View>
              <Switch
                testID="toggle-streak-reminder"
                value={settings.streakReminder}
                onValueChange={() => toggleField('streakReminder')}
                trackColor={{ false: palette.navy, true: palette.orange }}
                thumbColor={palette.white}
              />
            </View>

            {/* Reminder Time Picker */}
            {settings.streakReminder && (
              <View
                style={[
                  styles.timePickerContainer,
                  {
                    borderTopColor: palette.navy,
                    borderTopWidth: 1,
                    marginTop: s.md,
                    paddingTop: s.md,
                  },
                ]}
              >
                <View style={[styles.timePickerHeader, { marginBottom: s.sm }]}>
                  <Clock size={16} color={palette.mutedOnDark} />
                  <Text
                    style={[typography.caption, { color: palette.mutedOnDark, marginLeft: s.xs }]}
                  >
                    Reminder Time
                  </Text>
                </View>

                <View style={styles.timePillsRow}>
                  {AVAILABLE_TIMES.map((time) => {
                    const isSelected = settings.reminderTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        testID={`time-picker-${time}`}
                        onPress={() => handleSelectTime(time)}
                        style={[
                          styles.timePill,
                          {
                            backgroundColor: isSelected ? palette.orange : palette.navy,
                            borderRadius: r.sm,
                            paddingHorizontal: s.md,
                            paddingVertical: s.xs,
                            marginRight: s.xs,
                            marginBottom: s.xs,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Select time ${time}`}
                      >
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isSelected ? palette.white : palette.mutedOnDark,
                              fontWeight: isSelected ? '700' : '400',
                            },
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </Card>

          <Text
            style={[
              typography.eyebrow,
              { color: palette.mutedOnDark, marginTop: s.lg, marginBottom: s.sm },
            ]}
          >
            Learning & Community
          </Text>

          {/* New Content Switch */}
          <Card
            variant="default"
            style={{
              marginBottom: s.sm,
              backgroundColor: palette.slate,
              borderColor: palette.slate,
              padding: s.md,
            }}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: palette.navy, borderRadius: r.md, marginRight: s.md },
                ]}
              >
                <Sparkles size={20} color={palette.gold} />
              </View>
              <View style={styles.textColumn}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  New Courses & Lessons
                </Text>
                <Text style={[typography.caption, { color: palette.mutedOnDark, marginTop: s.xs }]}>
                  Be the first to learn when new interactive courses or articles drop
                </Text>
              </View>
              <Switch
                testID="toggle-new-content"
                value={settings.newContent}
                onValueChange={() => toggleField('newContent')}
                trackColor={{ false: palette.navy, true: palette.orange }}
                thumbColor={palette.white}
              />
            </View>
          </Card>

          {/* Social Switch */}
          <Card
            variant="default"
            style={{
              marginBottom: s.sm,
              backgroundColor: palette.slate,
              borderColor: palette.slate,
              padding: s.md,
            }}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: palette.navy, borderRadius: r.md, marginRight: s.md },
                ]}
              >
                <Users size={20} color={palette.white} />
              </View>
              <View style={styles.textColumn}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  Community & Social
                </Text>
                <Text style={[typography.caption, { color: palette.mutedOnDark, marginTop: s.xs }]}>
                  Feedback, likes, and comments on your portfolio projects
                </Text>
              </View>
              <Switch
                testID="toggle-social"
                value={settings.social}
                onValueChange={() => toggleField('social')}
                trackColor={{ false: palette.navy, true: palette.orange }}
                thumbColor={palette.white}
              />
            </View>
          </Card>

          {/* Marketing Digest Switch */}
          <Card
            variant="default"
            style={{
              marginBottom: s.sm,
              backgroundColor: palette.slate,
              borderColor: palette.slate,
              padding: s.md,
            }}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: palette.navy, borderRadius: r.md, marginRight: s.md },
                ]}
              >
                <Bell size={20} color={palette.orange} />
              </View>
              <View style={styles.textColumn}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  Weekly Digest & Tips
                </Text>
                <Text style={[typography.caption, { color: palette.mutedOnDark, marginTop: s.xs }]}>
                  Personalized performance summary and recommended next steps
                </Text>
              </View>
              <Switch
                testID="toggle-marketing"
                value={settings.marketing}
                onValueChange={() => toggleField('marketing')}
                trackColor={{ false: palette.navy, true: palette.orange }}
                thumbColor={palette.white}
              />
            </View>
          </Card>
        </ScrollView>
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
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 36,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    marginRight: 12,
  },
  timePickerContainer: {
    flexDirection: 'column',
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timePill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
