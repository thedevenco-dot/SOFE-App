/**
 * SOFE design tokens. Single source of truth for colour, type, spacing, radius.
 * Contrast ratios noted here were calculated by hand: verify with a contrast checker before release.
 */

export const palette = {
  navy: '#061E30', // Deep Navy Blue: main background
  slate: '#142D42', // Slate Navy: bottom nav, borders, secondary surfaces
  cream: '#FFF5E9', // Warm Ivory: course cards, search bar, light screens
  orange: '#FF8429', // Founder Orange: buttons, active tabs, highlights
  gold: '#D99045', // Muted Gold: logo accents, premium details
  white: '#FFFFFF', // Pure White: headings, icons on dark
  // Additions (not in the original palette) to keep orange accessible on light surfaces
  orangeDeep: '#B84A00', // orange text/icons on cream or white (about 4.9:1 on cream)
  line: '#E6D9C6', // borders on cream
  mutedOnDark: '#A9B8C6', // secondary text on navy and slate (about 7:1 or better)
  mutedOnLight: '#5B6B7A', // secondary text on cream (about 5:1)
} as const;

// Semantic status colours are PLACEHOLDERS until the "Additional colours" palette is final.
export const status = {
  successOnDark: '#3DD68C',
  successOnLight: '#1E7A4C',
  errorOnDark: '#FF6B6B',
  errorOnLight: '#C62828',
  warning: palette.gold,
  info: '#4C9BE8',
} as const;

export type ThemeName = 'dark' | 'light';

export const themes = {
  dark: {
    background: palette.navy,
    surface: palette.slate,
    surfaceRaised: '#1B3852',
    border: palette.slate,
    text: palette.white,
    textMuted: palette.mutedOnDark,
    primary: palette.orange,
    onPrimary: palette.navy, // navy text on orange is about 7:1; white on orange is only about 2.4:1 (fails)
    accentText: palette.orange, // orange on navy is about 7:1
    premium: palette.gold,
    tabBar: palette.slate,
    tabActive: palette.orange,
    tabInactive: palette.mutedOnDark,
    success: status.successOnDark,
    error: status.errorOnDark,
  },
  light: {
    background: palette.cream,
    surface: palette.white,
    surfaceRaised: palette.white,
    border: palette.line,
    text: palette.navy,
    textMuted: palette.mutedOnLight,
    primary: palette.orange,
    onPrimary: palette.navy,
    accentText: palette.orangeDeep, // never plain orange for text on light
    premium: palette.orangeDeep,
    tabBar: palette.slate,
    tabActive: palette.orange,
    tabInactive: palette.mutedOnDark,
    success: status.successOnLight,
    error: status.errorOnLight,
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const fonts = {
  // Proposed. Confirm against the Figma file. Load with expo-font / next/font.
  heading: 'PlayfairDisplay_700Bold', // serif for screen titles and hero text
  headingRegular: 'PlayfairDisplay_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const typeScale = {
  display: { size: 32, line: 38, font: 'heading' },
  title1: { size: 26, line: 32, font: 'heading' },
  title2: { size: 22, line: 28, font: 'heading' },
  title3: { size: 18, line: 24, font: 'bodySemibold' },
  body: { size: 15, line: 22, font: 'body' },
  bodyStrong: { size: 15, line: 22, font: 'bodySemibold' },
  caption: { size: 13, line: 18, font: 'body' },
  micro: { size: 11, line: 14, font: 'bodyMedium' },
} as const;

export const motion = { fast: 150, base: 250, slow: 400 } as const;
export const minTouchTarget = 44;
