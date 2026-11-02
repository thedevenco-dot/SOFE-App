import { TextStyle, Platform } from 'react-native';
import { typeScale } from '@sofe/shared';

/**
 * Standard typography tokens matching docs/DESIGN_V2.md Section 3.
 * Uses Playfair Display (Serif) for display/titles/numeric, and Inter (Sans) for UI/body/eyebrow/buttons.
 */

// Cross-platform font family resolution with system fallbacks
const serifBold = Platform.select({
  ios: 'PlayfairDisplay-Bold',
  android: 'PlayfairDisplay_700Bold',
  default: 'Playfair Display, Georgia, serif',
});

const serifSemibold = Platform.select({
  ios: 'PlayfairDisplay-SemiBold',
  android: 'PlayfairDisplay_600SemiBold',
  default: 'Playfair Display, Georgia, serif',
});

const sansRegular = Platform.select({
  ios: 'Inter-Regular',
  android: 'Inter_400Regular',
  default: 'Inter, -apple-system, Roboto, sans-serif',
});

const sansMedium = Platform.select({
  ios: 'Inter-Medium',
  android: 'Inter_500Medium',
  default: 'Inter, -apple-system, Roboto, sans-serif',
});

const sansSemibold = Platform.select({
  ios: 'Inter-SemiBold',
  android: 'Inter_600SemiBold',
  default: 'Inter, -apple-system, Roboto, sans-serif',
});

const sansBold = Platform.select({
  ios: 'Inter-Bold',
  android: 'Inter_700Bold',
  default: 'Inter, -apple-system, Roboto, sans-serif',
});

export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: typeScale.display.size,
    lineHeight: typeScale.display.line,
    fontWeight: '700',
    fontFamily: serifBold,
  },
  title1: {
    fontSize: typeScale.title1.size,
    lineHeight: typeScale.title1.line,
    fontWeight: '700',
    fontFamily: serifBold,
  },
  title2: {
    fontSize: typeScale.title2.size,
    lineHeight: typeScale.title2.line,
    fontWeight: '700',
    fontFamily: serifBold,
  },
  title3: {
    fontSize: typeScale.title3.size,
    lineHeight: typeScale.title3.line,
    fontWeight: '600',
    fontFamily: serifSemibold,
  },
  body: {
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.line,
    fontWeight: '400',
    fontFamily: sansRegular,
  },
  bodyStrong: {
    fontSize: typeScale.bodyStrong.size,
    lineHeight: typeScale.bodyStrong.line,
    fontWeight: '600',
    fontFamily: sansSemibold,
  },
  caption: {
    fontSize: typeScale.caption.size,
    lineHeight: typeScale.caption.line,
    fontWeight: '400',
    fontFamily: sansRegular,
  },
  eyebrow: {
    fontSize: typeScale.eyebrow.size,
    lineHeight: typeScale.eyebrow.line,
    fontWeight: '600',
    fontFamily: sansSemibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  numeric: {
    fontSize: typeScale.numeric.size,
    lineHeight: typeScale.numeric.line,
    fontWeight: '700',
    fontFamily: serifBold,
  },
  button: {
    fontSize: typeScale.button.size,
    lineHeight: typeScale.button.line,
    fontWeight: '700',
    fontFamily: sansBold,
  },
  tab: {
    fontSize: typeScale.tab.size,
    lineHeight: typeScale.tab.line,
    fontWeight: '600',
    fontFamily: sansSemibold,
    textTransform: 'uppercase',
  },
  // Backward compatibility alias for micro labels
  micro: {
    fontSize: typeScale.micro.size,
    lineHeight: typeScale.micro.line,
    fontWeight: '500',
    fontFamily: sansMedium,
  },
} as const;
