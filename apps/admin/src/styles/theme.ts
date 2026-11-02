/**
 * Admin Theme Adapter
 * Imports single-source-of-truth tokens from @sofe/shared and bridges them to admin styles.
 */
import {
  palette,
  colorRoles,
  themes,
  spacing,
  radius,
  shadows,
  fonts,
  typeScale,
} from '@sofe/shared';

export { palette, colorRoles, themes, spacing, radius, shadows, fonts, typeScale };

export const adminTheme = {
  navy: palette.navy,
  slate: palette.slate,
  surfaceRaised: '#1B3852',
  cream: palette.cream,
  orange: palette.orange,
  orangeDeep: palette.orangeDeep,
  gold: palette.gold,
  white: palette.white,
  muted: palette.mutedOnDark,
  border: palette.slate,
  borderSubtle: palette.line,
  success: colorRoles.successOnDark,
  error: colorRoles.errorOnDark,
  info: colorRoles.info,
  warning: colorRoles.warning,
} as const;
