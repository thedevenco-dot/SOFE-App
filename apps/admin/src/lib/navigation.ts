import { ADMIN_PERMISSIONS, AdminPermission } from '@sofe/shared';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  iconName: string;
  requiredPermission: AdminPermission;
  badge?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: 'content-studio',
    title: 'Content Studio',
    items: [
      {
        id: 'courses',
        title: 'Courses',
        href: '/courses',
        iconName: 'GraduationCap',
        requiredPermission: ADMIN_PERMISSIONS.COURSE_READ,
      },
      {
        id: 'categories',
        title: 'Categories',
        href: '/categories',
        iconName: 'Layers',
        requiredPermission: ADMIN_PERMISSIONS.COURSE_READ,
      },
      {
        id: 'instructors',
        title: 'Instructors',
        href: '/instructors',
        iconName: 'UserCheck',
        requiredPermission: ADMIN_PERMISSIONS.COURSE_READ,
      },
      {
        id: 'lessons',
        title: 'Lessons',
        href: '/lessons',
        iconName: 'Layers',
        requiredPermission: ADMIN_PERMISSIONS.LESSON_READ,
      },
      {
        id: 'media-videos',
        title: 'Video Status (Mux)',
        href: '/media/videos',
        iconName: 'Film',
        requiredPermission: ADMIN_PERMISSIONS.LESSON_READ,
      },
      {
        id: 'articles',
        title: 'Articles',
        href: '/articles',
        iconName: 'FileText',
        requiredPermission: ADMIN_PERMISSIONS.ARTICLE_READ,
      },
      {
        id: 'topics',
        title: 'Topics & Tags',
        href: '/topics',
        iconName: 'Hash',
        requiredPermission: ADMIN_PERMISSIONS.TOPIC_READ,
      },
      {
        id: 'authors',
        title: 'Authors',
        href: '/authors',
        iconName: 'Users',
        requiredPermission: ADMIN_PERMISSIONS.AUTHOR_READ,
      },
    ],
  },
  {
    id: 'practise',
    title: 'Practise',
    items: [
      {
        id: 'quizzes',
        title: 'Quizzes',
        href: '/quizzes',
        iconName: 'HelpCircle',
        requiredPermission: ADMIN_PERMISSIONS.QUIZ_READ,
      },
      {
        id: 'schedule',
        title: 'Daily Schedule',
        href: '/practise-schedule',
        iconName: 'Calendar',
        requiredPermission: ADMIN_PERMISSIONS.PRACTISE_SCHEDULE,
      },
      {
        id: 'rewards',
        title: 'Rewards & Store',
        href: '/rewards',
        iconName: 'Gift',
        requiredPermission: ADMIN_PERMISSIONS.REWARD_READ,
      },
      {
        id: 'achievements',
        title: 'Achievements',
        href: '/achievements',
        iconName: 'Award',
        requiredPermission: ADMIN_PERMISSIONS.ACHIEVEMENT_READ,
      },
      {
        id: 'quotes',
        title: 'Quotes & Words',
        href: '/quotes',
        iconName: 'Quote',
        requiredPermission: ADMIN_PERMISSIONS.QUOTE_READ,
      },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    items: [
      {
        id: 'reports',
        title: 'Reports & Flags',
        href: '/reports',
        iconName: 'AlertTriangle',
        requiredPermission: ADMIN_PERMISSIONS.REPORT_READ,
      },
      {
        id: 'support',
        title: 'Support Tickets',
        href: '/support',
        iconName: 'MessageSquare',
        requiredPermission: ADMIN_PERMISSIONS.SUPPORT_READ,
      },
      {
        id: 'moderation',
        title: 'Moderation Rules',
        href: '/moderation',
        iconName: 'Shield',
        requiredPermission: ADMIN_PERMISSIONS.MODERATION_RULES,
      },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    items: [
      {
        id: 'orders',
        title: 'Orders & Refunds',
        href: '/orders',
        iconName: 'CreditCard',
        requiredPermission: ADMIN_PERMISSIONS.ORDER_READ,
      },
      {
        id: 'invoices',
        title: 'Invoices & GST',
        href: '/invoices',
        iconName: 'Receipt',
        requiredPermission: ADMIN_PERMISSIONS.INVOICE_READ,
      },
      {
        id: 'coupons',
        title: 'Coupons',
        href: '/coupons',
        iconName: 'Tag',
        requiredPermission: ADMIN_PERMISSIONS.COUPON_WRITE,
      },
      {
        id: 'leads',
        title: 'Leads Pipeline',
        href: '/leads',
        iconName: 'TrendingUp',
        requiredPermission: ADMIN_PERMISSIONS.LEAD_READ,
      },
      {
        id: 'analytics',
        title: 'Revenue & Funnel',
        href: '/analytics',
        iconName: 'BarChart3',
        requiredPermission: ADMIN_PERMISSIONS.ANALYTICS_READ,
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform',
    items: [
      {
        id: 'users',
        title: 'Learner Users',
        href: '/users',
        iconName: 'Users',
        requiredPermission: ADMIN_PERMISSIONS.USER_READ,
      },
      {
        id: 'admins',
        title: 'Staff & Roles',
        href: '/admins',
        iconName: 'UserCog',
        requiredPermission: ADMIN_PERMISSIONS.ADMIN_MANAGE,
      },
      {
        id: 'audit-logs',
        title: 'Audit Logs',
        href: '/audit-logs',
        iconName: 'Activity',
        requiredPermission: ADMIN_PERMISSIONS.AUDIT_READ,
      },
      {
        id: 'settings',
        title: 'System Settings',
        href: '/settings',
        iconName: 'Settings',
        requiredPermission: ADMIN_PERMISSIONS.CONFIG_WRITE,
      },
    ],
  },
];

/**
 * Filter navigation groups so only items matching the user's active permissions are kept.
 * Groups with 0 permitted items are entirely omitted.
 */
export function filterNavGroupsByPermissions(
  groups: NavGroup[],
  userPermissions: readonly AdminPermission[],
): NavGroup[] {
  const permSet = new Set(userPermissions);

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permSet.has(item.requiredPermission)),
    }))
    .filter((group) => group.items.length > 0);
}
