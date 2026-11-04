export interface DeepLinkResolution {
  route: string | null;
  handled: boolean;
}

/**
 * Resolves a sofe:// or relative URL to an internal expo-router path.
 */
export function resolveDeepLink(url: string | undefined | null): DeepLinkResolution {
  if (!url || typeof url !== 'string') {
    return { route: null, handled: false };
  }

  const clean = url.trim();
  if (!clean) {
    return { route: null, handled: false };
  }

  // Direct internal route
  if (clean.startsWith('/')) {
    return { route: clean, handled: true };
  }

  // Strip custom scheme sofe:// or https://sofe.app/
  let path = clean;
  if (path.startsWith('sofe://')) {
    path = path.slice('sofe://'.length);
  } else if (path.startsWith('https://sofe.app/')) {
    path = path.slice('https://sofe.app/'.length);
  } else if (path.startsWith('http://sofe.app/')) {
    path = path.slice('http://sofe.app/'.length);
  }

  // Strip leading slash
  if (path.startsWith('/')) {
    path = path.slice(1);
  }

  // Remove query or hash for route matching
  const [routePart] = path.split(/[?#]/);
  const segments = routePart.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { route: '/(tabs)/home', handled: true };
  }

  const primary = segments[0];

  // Practise routing
  if (primary === 'practise' || primary === 'practice') {
    if (segments[1] === 'points') return { route: '/practise/points', handled: true };
    if (segments[1] === 'streak') return { route: '/practise/streak', handled: true };
    if (segments[1] === 'rewards') return { route: '/practise/rewards', handled: true };
    if (segments[1] === 'daily') return { route: '/practise/daily', handled: true };
    return { route: '/(tabs)/practise', handled: true };
  }

  // Course routing
  if (primary === 'course') {
    const slug = segments[1];
    return { route: slug ? `/learn/course/${slug}` : '/(tabs)/learn', handled: true };
  }
  if (primary === 'learn') {
    if (segments[1] === 'course' && segments[2]) {
      return { route: `/learn/course/${segments[2]}`, handled: true };
    }
    return { route: '/(tabs)/learn', handled: true };
  }

  // Article routing
  if (primary === 'article') {
    const slug = segments[1];
    return {
      route: slug ? `/startup-world/article/${slug}` : '/(tabs)/startup-world',
      handled: true,
    };
  }
  if (primary === 'startup-world') {
    if (segments[1] === 'article' && segments[2]) {
      return { route: `/startup-world/article/${segments[2]}`, handled: true };
    }
    return { route: '/(tabs)/startup-world', handled: true };
  }

  // Notifications
  if (primary === 'notifications') {
    return { route: '/notifications', handled: true };
  }

  // Settings
  if (primary === 'settings') {
    if (segments[1] === 'notifications') {
      return { route: '/settings/notifications', handled: true };
    }
    return { route: '/(tabs)/profile', handled: true };
  }

  // Profile
  if (primary === 'profile') {
    if (segments[1] === 'stats') return { route: '/profile/stats', handled: true };
    if (segments[1] === 'edit') return { route: '/profile/edit', handled: true };
    if (segments[1] === 'projects') return { route: '/profile/projects', handled: true };
    return { route: '/(tabs)/profile', handled: true };
  }

  if (primary === 'home') {
    return { route: '/(tabs)/home', handled: true };
  }

  // Fallback to home if unknown sofe link
  return { route: '/(tabs)/home', handled: false };
}

/**
 * Executes navigation to the resolved deep link path.
 */
export function handleDeepLink(
  url: string | undefined | null,
  router: { push: (route: string) => void },
): boolean {
  const { route, handled } = resolveDeepLink(url);
  if (route) {
    router.push(route);
    return true;
  }
  return handled;
}
