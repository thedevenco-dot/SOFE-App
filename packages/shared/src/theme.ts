/**
 * SOFE Design Tokens (DESIGN_V2.md)
 * Single source of truth for colour roles, type scale, spacing, radius, and shadows.
 * Mobile and admin both import from here.
 */

export const palette = {
  navy: '#061E30', // Deep Navy: main background, headers, dark cards, titles on light
  slate: '#142D42', // Slate Navy: chips, raised surfaces on dark, dividers
  cream: '#FFF5E9', // Warm Ivory / Sheet: content sheet background
  orange: '#FF8429', // Founder Orange: primary buttons, progress fill, active tabs
  orangeDeep: '#B84A00', // Deep Orange: accessible orange text on cream and white (~4.9:1)
  gold: '#D99045', // Muted Gold: premium details, badges, streaks
  white: '#FFFFFF', // Pure White: card backgrounds, text on dark
  peachTint: '#FFF0E0', // Peach tint of cream: meta chips, inner tiles, discipline icon tiles
  line: '#E6D9C6', // Subtle border on cream and cards
  track: '#EADFD0', // Progress bar track on light surfaces
  mutedOnDark: '#A9B8C6', // Secondary text on navy and slate (~7:1)
  mutedOnLight: '#5B6B7A', // Secondary text on light surfaces (~5:1)
} as const;

export const colorRoles = {
  bgDark: palette.navy,
  bgDarkRaised: palette.slate,
  bgSheet: palette.cream,
  bgCard: palette.white,
  bgTint: palette.peachTint,
  borderSubtle: palette.line,
  track: palette.track,
  textOnDark: palette.white,
  textMutedOnDark: palette.mutedOnDark,
  textPrimary: palette.navy,
  textMuted: palette.mutedOnLight,
  accentFill: palette.orange,
  accentText: palette.orangeDeep, // Orange text on cream or white (eyebrows, links, "Analyze")
  accentOnDarkText: palette.orange, // Orange text on navy (~7:1)
  premium: palette.gold,
  successOnDark: '#3DD68C',
  successOnLight: '#1E7A4C',
  errorOnDark: '#FF6B6B',
  errorOnLight: '#C62828',
  warning: palette.gold,
  info: '#4C9BE8',
} as const;

export const status = {
  successOnDark: colorRoles.successOnDark,
  successOnLight: colorRoles.successOnLight,
  errorOnDark: colorRoles.errorOnDark,
  errorOnLight: colorRoles.errorOnLight,
  warning: colorRoles.warning,
  info: colorRoles.info,
} as const;

export type ThemeName = 'dark' | 'light';

export const themes = {
  dark: {
    background: palette.navy,
    surface: palette.slate,
    surfaceRaised: '#1B3852',
    border: palette.slate,
    borderSubtle: palette.slate,
    text: palette.white,
    textMuted: palette.mutedOnDark,
    primary: palette.orange,
    onPrimary: palette.navy, // Navy text on orange is ~7:1 (never white on orange)
    accentText: palette.orange, // Orange on dark is ~7:1
    premium: palette.gold,
    tabBar: palette.slate,
    tabActive: palette.orange,
    tabInactive: palette.mutedOnDark,
    sheet: palette.cream,
    card: palette.white,
    cardDark: palette.navy,
    tint: palette.peachTint,
    track: palette.track,
    success: status.successOnDark,
    error: status.errorOnDark,
  },
  light: {
    background: palette.cream,
    surface: palette.white,
    surfaceRaised: palette.white,
    border: palette.line,
    borderSubtle: palette.line,
    text: palette.navy,
    textMuted: palette.mutedOnLight,
    primary: palette.orange,
    onPrimary: palette.navy,
    accentText: palette.orangeDeep, // Deep orange on cream/white (~4.9:1)
    premium: palette.orangeDeep,
    tabBar: palette.slate,
    tabActive: palette.orange,
    tabInactive: palette.mutedOnDark,
    sheet: palette.cream,
    card: palette.white,
    cardDark: palette.navy,
    tint: palette.peachTint,
    track: palette.track,
    success: status.successOnLight,
    error: status.errorOnLight,
  },
} as const;

/** 4 pt spacing grid (DESIGN_V2 Section 4) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 28,
  xxxl: 32,
  huge: 48,
} as const;

/** Shape radii (DESIGN_V2 Section 4) */
export const radius = {
  xs: 4,
  sm: 8,
  smallTile: 12,
  md: 12,
  button: 14,
  card: 16,
  lg: 16,
  xl: 24,
  sheet: 28,
  pill: 999,
} as const;

/** Soft shadows and elevations (DESIGN_V2 Section 4) */
export const shadows = {
  soft: {
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  hover: {
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

/** Typography font family mappings (DESIGN_V2 Section 3) */
export const fonts = {
  headingBold: 'PlayfairDisplay_700Bold', // Serif bold for screen titles, display, hero text
  headingSemibold: 'PlayfairDisplay_600SemiBold', // Serif semibold for card titles and section titles
  headingRegular: 'PlayfairDisplay_500Medium',
  // Backward compatibility alias:
  heading: 'PlayfairDisplay_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Typography scale specifications (DESIGN_V2 Section 3) */
export const typeScale = {
  display: { size: 28, line: 34, font: 'headingBold' },
  title1: { size: 24, line: 30, font: 'headingBold' },
  title2: { size: 20, line: 26, font: 'headingBold' },
  title3: { size: 17, line: 23, font: 'headingSemibold' },
  body: { size: 14, line: 20, font: 'body' },
  bodyStrong: { size: 14, line: 20, font: 'bodySemibold' },
  caption: { size: 12, line: 16, font: 'body' },
  eyebrow: { size: 11, line: 14, font: 'bodySemibold', uppercase: true, letterSpacing: 0.8 },
  numeric: { size: 30, line: 34, font: 'headingBold' },
  button: { size: 15, line: 20, font: 'bodyBold' },
  tab: { size: 10, line: 12, font: 'bodySemibold', uppercase: true },
  micro: { size: 11, line: 14, font: 'bodyMedium' }, // Backward-compatibility
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const minTouchTarget = 44;
