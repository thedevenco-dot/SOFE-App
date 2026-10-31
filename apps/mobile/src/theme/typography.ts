import { TextStyle } from 'react-native';

/**
 * Standard typography tokens matching docs/DESIGN.md.
 */
export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  title1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  title3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
} as const;
