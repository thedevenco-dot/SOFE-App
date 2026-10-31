import { palette, themes } from '@sofe/shared';
import { typography } from './typography';

describe('Design Tokens & Themes (DESIGN.md)', () => {
  it('should define brand palette colors verbatim', () => {
    expect(palette.navy).toBe('#061E30');
    expect(palette.slate).toBe('#142D42');
    expect(palette.cream).toBe('#FFF5E9');
    expect(palette.orange).toBe('#FF8429');
    expect(palette.gold).toBe('#D99045');
    expect(palette.white).toBe('#FFFFFF');
    expect(palette.orangeDeep).toBe('#B84A00');
  });

  it('dark theme must follow contrast rules (navy on primary button, white text)', () => {
    const dark = themes.dark;
    expect(dark.background).toBe(palette.navy);
    expect(dark.surface).toBe(palette.slate);
    expect(dark.text).toBe(palette.white);
    expect(dark.primary).toBe(palette.orange);
    expect(dark.onPrimary).toBe(palette.navy); // Navy text on orange has ~7:1 contrast ratio
    expect(dark.tabBar).toBe(palette.slate);
    expect(dark.tabActive).toBe(palette.orange);
  });

  it('light theme must follow contrast rules (cream background, orangeDeep for text)', () => {
    const light = themes.light;
    expect(light.background).toBe(palette.cream);
    expect(light.surface).toBe(palette.white);
    expect(light.text).toBe(palette.navy);
    expect(light.accentText).toBe(palette.orangeDeep); // Never orange on light (orange on cream is only 2.3:1)
    expect(light.premium).toBe(palette.orangeDeep);
  });

  it('typography styles should strictly follow docs/DESIGN.md scale', () => {
    expect(typography.display.fontSize).toBe(32);
    expect(typography.display.lineHeight).toBe(38);

    expect(typography.title1.fontSize).toBe(26);
    expect(typography.title1.lineHeight).toBe(32);

    expect(typography.title2.fontSize).toBe(22);
    expect(typography.title2.lineHeight).toBe(28);

    expect(typography.title3.fontSize).toBe(18);
    expect(typography.title3.lineHeight).toBe(24);

    expect(typography.body.fontSize).toBe(15);
    expect(typography.body.lineHeight).toBe(22);

    expect(typography.caption.fontSize).toBe(13);
    expect(typography.caption.lineHeight).toBe(18);

    expect(typography.micro.fontSize).toBe(11);
    expect(typography.micro.lineHeight).toBe(14);
  });
});
