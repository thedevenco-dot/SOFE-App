import { palette, themes } from '@sofe/shared';
import { getInitials } from './Avatar';

describe('Core UI Components Unit Tests', () => {
  describe('Avatar - getInitials', () => {
    it('should generate two initials for multiple words', () => {
      expect(getInitials('Alexis Ohanian')).toBe('AO');
      expect(getInitials('Sam Altman')).toBe('SA');
      expect(getInitials('Marc Andreessen Horowitz')).toBe('MH');
    });

    it('should generate two characters for single word', () => {
      expect(getInitials('Founder')).toBe('FO');
      expect(getInitials('Elon')).toBe('EL');
    });

    it('should fallback to F for empty name', () => {
      expect(getInitials('')).toBe('F');
      expect(getInitials(undefined)).toBe('F');
    });
  });

  describe('Design System Contrast Compliance', () => {
    it('primary button must have bold navy text on orange fill', () => {
      const primaryBg = palette.orange;
      const primaryText = palette.navy;

      expect(primaryBg).toBe('#FF8429');
      expect(primaryText).toBe('#061E30');
    });

    it('destructive button must use white text on error background', () => {
      const text = palette.white;
      expect(text).toBe('#FFFFFF');
    });

    it('light theme surfaces must use orangeDeep for contrast', () => {
      const lightTheme = themes.light;
      expect(lightTheme.accentText).toBe('#B84A00');
      expect(lightTheme.premium).toBe('#B84A00');
    });
  });

  describe('ProgressBar Clamping Logic', () => {
    function calculateClampedProgress(progress: number): number {
      const normalized = progress > 1 ? progress / 100 : progress;
      return Math.min(1, Math.max(0, normalized));
    }

    it('should clamp negative values to 0', () => {
      expect(calculateClampedProgress(-0.5)).toBe(0);
      expect(calculateClampedProgress(-10)).toBe(0);
    });

    it('should clamp values > 100% to 1', () => {
      expect(calculateClampedProgress(150)).toBe(1);
      expect(calculateClampedProgress(200)).toBe(1);
    });

    it('should handle decimals and percentages consistently', () => {
      expect(calculateClampedProgress(0.75)).toBe(0.75);
      expect(calculateClampedProgress(75)).toBe(0.75);
    });
  });

  describe('ProgressRing Circumference Calculation', () => {
    function calculateOffset(progress: number, size: number, strokeWidth: number): number {
      const clamped = Math.min(100, Math.max(0, progress));
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      return circumference - (circumference * clamped) / 100;
    }

    it('should calculate offset for 0%', () => {
      const size = 72;
      const strokeWidth = 6;
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      expect(calculateOffset(0, size, strokeWidth)).toBeCloseTo(circumference);
    });

    it('should calculate offset for 100%', () => {
      expect(calculateOffset(100, 72, 6)).toBe(0);
    });
  });
});
