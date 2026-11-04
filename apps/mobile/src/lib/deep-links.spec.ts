import { resolveDeepLink, handleDeepLink } from './deep-links';

describe('resolveDeepLink (Task T3.10)', () => {
  it('handles null and undefined', () => {
    expect(resolveDeepLink(null)).toEqual({ route: null, handled: false });
    expect(resolveDeepLink(undefined)).toEqual({ route: null, handled: false });
    expect(resolveDeepLink('')).toEqual({ route: null, handled: false });
  });

  it('handles direct relative route', () => {
    expect(resolveDeepLink('/notifications')).toEqual({
      route: '/notifications',
      handled: true,
    });
  });

  it('resolves practise links', () => {
    expect(resolveDeepLink('sofe://practise')).toEqual({
      route: '/(tabs)/practise',
      handled: true,
    });
    expect(resolveDeepLink('sofe://practise/points')).toEqual({
      route: '/practise/points',
      handled: true,
    });
    expect(resolveDeepLink('sofe://practise/streak')).toEqual({
      route: '/practise/streak',
      handled: true,
    });
  });

  it('resolves course links', () => {
    expect(resolveDeepLink('sofe://course/react-native-101')).toEqual({
      route: '/learn/course/react-native-101',
      handled: true,
    });
    expect(resolveDeepLink('sofe://learn')).toEqual({
      route: '/(tabs)/learn',
      handled: true,
    });
  });

  it('resolves article links', () => {
    expect(resolveDeepLink('sofe://article/future-of-ai')).toEqual({
      route: '/startup-world/article/future-of-ai',
      handled: true,
    });
  });

  it('resolves settings notification link', () => {
    expect(resolveDeepLink('sofe://settings/notifications')).toEqual({
      route: '/settings/notifications',
      handled: true,
    });
  });

  it('executes handleDeepLink via router push', () => {
    const router = { push: jest.fn() };
    const handled = handleDeepLink('sofe://practise/points', router);
    expect(handled).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/practise/points');
  });
});
