import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { GradientOverlay } from './GradientOverlay';
import { EyebrowLabel } from './EyebrowLabel';
import { QuoteBox } from './QuoteBox';

export interface HeroImageCardProps {
  imageUri?: string;
  imageSource?: ImageSourcePropType;
  eyebrow?: string;
  title: string;
  body?: string;
  quote?: {
    text: string;
    author: string;
  };
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Full-bleed Hero Card with dark gradient overlay, eyebrow, serif title, body, and optional quote box.
 * Matches Home Curator's Manifesto card and lead features.
 */
export function HeroImageCard({
  imageUri,
  imageSource,
  eyebrow,
  title,
  body,
  quote,
  onPress,
  style,
}: HeroImageCardProps) {
  const content = (
    <View style={[styles.card, style]}>
      {/* Background Image */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : imageSource ? (
        <Image source={imageSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.slate }]} />
      )}

      {/* Dark Gradient Overlay for 100% Text Readability */}
      <GradientOverlay bottomOpacity={0.92} />

      {/* Card Content */}
      <View style={styles.content}>
        {eyebrow ? (
          <EyebrowLabel onDark style={{ marginBottom: spacing.xs }}>
            {eyebrow}
          </EyebrowLabel>
        ) : null}

        <Text style={[typography.title1, styles.title]}>{title}</Text>

        {body ? <Text style={[typography.body, styles.bodyText]}>{body}</Text> : null}

        {quote ? <QuoteBox quote={quote.text} author={quote.author} onDark /> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 280,
    borderRadius: radius.card,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    ...shadows.soft,
  },
  content: {
    padding: spacing.lg,
    zIndex: 2,
  },
  title: {
    color: palette.white,
    marginBottom: spacing.xs,
  },
  bodyText: {
    color: palette.mutedOnDark,
    marginBottom: spacing.sm,
  },
});
