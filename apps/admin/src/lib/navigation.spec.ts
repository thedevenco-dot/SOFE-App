import { ADMIN_ROLES, ROLE_PERMISSIONS_MAP } from '@sofe/shared';
import { ADMIN_NAV_GROUPS, filterNavGroupsByPermissions } from './navigation';

describe('Admin Navigation RBAC', () => {
  it('shows all navigation groups and items for super_admin', () => {
    const permissions = ROLE_PERMISSIONS_MAP[ADMIN_ROLES.SUPER_ADMIN];
    const visibleGroups = filterNavGroupsByPermissions(ADMIN_NAV_GROUPS, permissions);

    expect(visibleGroups.length).toBe(ADMIN_NAV_GROUPS.length);

    const groupIds = visibleGroups.map((g) => g.id);
    expect(groupIds).toContain('content-studio');
    expect(groupIds).toContain('practise');
    expect(groupIds).toContain('community');
    expect(groupIds).toContain('business');
    expect(groupIds).toContain('platform');
  });

  it('hides platform and restricted business items for content_editor', () => {
    const permissions = ROLE_PERMISSIONS_MAP[ADMIN_ROLES.CONTENT_EDITOR];
    const visibleGroups = filterNavGroupsByPermissions(ADMIN_NAV_GROUPS, permissions);

    const groupIds = visibleGroups.map((g) => g.id);
    expect(groupIds).toContain('content-studio');
    expect(groupIds).toContain('practise');
    expect(groupIds).not.toContain('platform'); // No admin:manage, user:read, audit:read

    // In business group, content editor has only analytics, not orders or coupons
    const businessGroup = visibleGroups.find((g) => g.id === 'business');
    if (businessGroup) {
      const itemIds = businessGroup.items.map((i) => i.id);
      expect(itemIds).not.toContain('orders');
      expect(itemIds).not.toContain('invoices');
      expect(itemIds).not.toContain('coupons');
    }
  });

  it('restricts finance role to financial and order operations', () => {
    const permissions = ROLE_PERMISSIONS_MAP[ADMIN_ROLES.FINANCE];
    const visibleGroups = filterNavGroupsByPermissions(ADMIN_NAV_GROUPS, permissions);

    const groupIds = visibleGroups.map((g) => g.id);
    expect(groupIds).toContain('business');
    expect(groupIds).not.toContain('practise'); // No quiz, reward, achievement permissions

    const businessGroup = visibleGroups.find((g) => g.id === 'business');
    expect(businessGroup).toBeDefined();
    const itemIds = businessGroup!.items.map((i) => i.id);
    expect(itemIds).toContain('orders');
    expect(itemIds).toContain('invoices');
    expect(itemIds).toContain('coupons');

    // In content-studio, finance only has course:read (for pricing verification), not write/lessons
    const contentGroup = visibleGroups.find((g) => g.id === 'content-studio');
    if (contentGroup) {
      const contentItems = contentGroup.items.map((i) => i.id);
      expect(contentItems).toContain('courses');
      expect(contentItems).not.toContain('lessons'); // media/lesson write restricted
    }
  });

  it('completely removes groups that have zero permitted items', () => {
    // Role with only course:read
    const minimalPermissions = ['course:read'] as const;
    const visibleGroups = filterNavGroupsByPermissions(ADMIN_NAV_GROUPS, minimalPermissions);

    expect(visibleGroups.length).toBe(1);
    expect(visibleGroups[0].id).toBe('content-studio');
    expect(visibleGroups[0].items.map((i) => i.id)).toEqual([
      'courses',
      'categories',
      'instructors',
    ]);
  });
});
