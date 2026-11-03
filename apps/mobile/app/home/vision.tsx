import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Trash2, Edit3 } from 'lucide-react-native';
import { palette, colorRoles, radius, shadows, spacing, type VisionBoardItem } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { homeApi } from '../../src/lib/home-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

export default function VisionBoardScreen() {
  const router = useRouter();
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVisionBoard = useCallback(async () => {
    try {
      const data = await homeApi.getVisionBoard();
      setItems(data || []);
    } catch {
      // Ignore or show toast
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVisionBoard();
    }, [fetchVisionBoard]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVisionBoard();
  };

  const handleDelete = (item: VisionBoardItem) => {
    Alert.alert('Remove Vision Card', `Remove "${item.caption || 'item'}" from your board?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await homeApi.deleteVisionBoardItem(item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          } catch {
            Alert.alert('Error', 'Failed to remove vision card');
          }
        },
      },
    ]);
  };

  const isFull = items.length >= 12;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <Text style={[typography.title1, styles.title]}>Founder Vision Board</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Curate visual anchors of your venture milestones and personal ambition ({items.length}
            /12).
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={palette.orange} size="large" />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            title="Your Vision Board is Empty"
            description="Add visual anchors, milestone goals, and product aspirations to guide your daily discipline."
            actionLabel="Add First Vision Card"
            onAction={() => router.push('/home/vision-edit')}
          />
        ) : (
          <View style={styles.grid}>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardFooter}>
                  <Text style={[typography.caption, styles.caption]} numberOfLines={2}>
                    {item.caption || 'Milestone goal'}
                  </Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/home/vision-edit',
                          params: {
                            id: item.id,
                            imageUrl: item.imageUrl,
                            caption: item.caption,
                            order: item.order,
                          },
                        })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.actionBtn}
                    >
                      <Edit3 size={15} color={palette.navy} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.actionBtn}
                    >
                      <Trash2 size={15} color={colorRoles.errorOnLight} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {!isFull && (
        <View style={styles.fabContainer}>
          <Button variant="primary" onPress={() => router.push('/home/vision-edit')}>
            Add Vision Card
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: palette.navy,
  },
  subtitle: {
    color: palette.slate,
    marginTop: spacing.xs,
  },
  center: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
    ...shadows.soft,
  },
  cardImage: {
    width: '100%',
    height: COLUMN_WIDTH * 1.1,
    backgroundColor: palette.peachTint,
  },
  cardFooter: {
    padding: spacing.sm,
  },
  caption: {
    color: palette.navy,
    fontWeight: '500',
    minHeight: 32,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  actionBtn: {
    padding: 2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
});
