/**
 * Comprehensive Permission System with Inheritance
 */

export const PERMISSION_GROUPS = {
  ANALYTICS: {
    name: 'Analytics & Reporting',
    permissions: ['view_analytics', 'export_analytics', 'view_user_analytics', 'view_sales_analytics'],
  },
  DATABASE: {
    name: 'Database Management',
    permissions: ['view_database', 'query_database', 'export_database', 'modify_schema', 'manage_backups'],
  },
  CONTENT: {
    name: 'Content Management',
    permissions: ['view_content', 'create_content', 'edit_content', 'delete_content', 'publish_content', 'moderate_content'],
  },
  BLOG: {
    name: 'Blog Management',
    permissions: ['view_blog', 'create_blog', 'edit_blog', 'delete_blog', 'publish_blog', 'moderate_blog_comments'],
  },
  PODCAST: {
    name: 'Podcast Management',
    permissions: ['view_podcast', 'create_podcast', 'edit_podcast', 'delete_podcast', 'publish_podcast', 'manage_podcast_monetization', 'view_podcast_analytics'],
  },
  VIDEO: {
    name: 'Video Management',
    permissions: ['view_video', 'create_video', 'edit_video', 'delete_video', 'publish_video', 'manage_livestreams'],
  },
  USERS: {
    name: 'User Management',
    permissions: ['view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_user_activity'],
  },
  COMMERCE: {
    name: 'E-Commerce',
    permissions: ['view_products', 'create_products', 'edit_products', 'delete_products', 'manage_inventory', 'view_orders', 'manage_orders', 'manage_shipping', 'manage_coupons', 'view_sales'],
  },
  COMMUNITY: {
    name: 'Community Management',
    permissions: ['view_community', 'moderate_community', 'manage_groups', 'manage_forums', 'manage_events', 'ban_users'],
  },
  SYSTEM: {
    name: 'System Settings',
    permissions: ['view_settings', 'edit_settings', 'manage_integrations', 'manage_payments', 'view_logs'],
  },
};

export const DEFAULT_ROLES = {
  CONTENT_MANAGER: {
    name: 'Content Manager',
    description: 'Can create and manage all content (blog, podcasts, videos)',
    permissions: ['view_content', 'create_content', 'edit_content', 'delete_content', 'publish_content', 'view_blog', 'create_blog', 'edit_blog', 'delete_blog', 'publish_blog', 'view_podcast', 'create_podcast', 'edit_podcast', 'delete_podcast', 'publish_podcast', 'view_video', 'create_video', 'edit_video', 'delete_video', 'publish_video', 'view_analytics'],
    priority: 50,
  },
  MODERATOR: {
    name: 'Community Moderator',
    description: 'Can moderate community content and manage forums',
    permissions: ['view_community', 'moderate_community', 'manage_forums', 'ban_users', 'moderate_content', 'moderate_blog_comments', 'view_content', 'view_blog', 'view_users'],
    priority: 40,
  },
  STORE_MANAGER: {
    name: 'Store Manager',
    description: 'Can manage products, inventory, and orders',
    permissions: ['view_products', 'create_products', 'edit_products', 'delete_products', 'manage_inventory', 'view_orders', 'manage_orders', 'manage_shipping', 'manage_coupons', 'view_sales', 'view_sales_analytics'],
    priority: 60,
  },
  ANALYST: {
    name: 'Data Analyst',
    description: 'Can view and export analytics across the platform',
    permissions: ['view_analytics', 'export_analytics', 'view_user_analytics', 'view_sales_analytics', 'view_podcast_analytics', 'view_content', 'view_users', 'view_products', 'view_orders'],
    priority: 30,
  },
  SUPPORT_STAFF: {
    name: 'Support Staff',
    description: 'Can view users and help with basic support tasks',
    permissions: ['view_users', 'view_user_activity', 'view_orders', 'view_content', 'view_community', 'view_products'],
    priority: 20,
  },
  DATABASE_ADMIN: {
    name: 'Database Administrator',
    description: 'Can manage database operations and backups',
    permissions: ['view_database', 'query_database', 'export_database', 'modify_schema', 'manage_backups', 'view_logs', 'view_analytics'],
    priority: 70,
  },
};

/**
 * Get role with inherited permissions
 * @param {Object} role - Role object
 * @param {Object[]} allRoles - All available roles
 * @returns {Object} Role with inherited permissions
 */
export function getRoleWithInheritance(role, allRoles = []) {
  if (!role) return null;
  
  let inheritedPermissions = [...(role.permissions || [])];
  
  // If role has parent_role_id, inherit from parent
  if (role.parent_role_id) {
    const parentRole = allRoles.find(r => r.id === role.parent_role_id);
    if (parentRole) {
      const parentWithInheritance = getRoleWithInheritance(parentRole, allRoles);
      inheritedPermissions = [...new Set([...inheritedPermissions, ...(parentWithInheritance.permissions || [])])];
    }
  }
  
  return {
    ...role,
    permissions: inheritedPermissions,
    inherited_from: role.parent_role_id ? role.parent_role_id : null,
  };
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.includes(permission) || false;
}

export function hasAnyPermission(user, permissions) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.some(p => user.permissions?.includes(p));
}

export function hasAllPermissions(user, permissions) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.every(p => user.permissions?.includes(p));
}

export const PAGE_PERMISSIONS = {
  AdminDashboard: [],
  AdminAnalytics: ['view_analytics'],
  AdminSiteSettings: ['view_settings', 'edit_settings'],
  AdminDatabaseDashboard: ['view_database'],
  AdminSQLEditor: ['query_database'],
  AdminSchemaViewer: ['view_database'],
  AdminQueryBuilder: ['query_database'],
  AdminDataImportExport: ['view_database', 'export_database'],
  AdminBackupManager: ['manage_backups'],
  AdminRelationshipMapper: ['view_database'],
  AdminDatabaseExport: ['export_database'],
  AdminMigrationStudio: ['modify_schema'],
  AdminPerformanceMonitor: ['view_database', 'view_logs'],
  AdminDataIntegrity: ['view_database'],
  AdminConnectionPoolMonitor: ['view_database'],
  AdminBroadcastStudio: ['manage_livestreams'],
  AdminLiveStreams: ['view_video', 'manage_livestreams'],
  AdminPodcastLive: ['create_podcast', 'publish_podcast'],
  AdminAIScriptGenerator: ['create_content'],
  AdminPodcasts: ['view_podcast'],
  AdminPodcastMarketing: ['edit_podcast', 'view_podcast_analytics'],
  AdminPodcastAnalytics: ['view_podcast_analytics'],
  AdminVideos: ['view_video'],
  AdminBlog: ['view_blog'],
  AdminCourses: ['view_content'],
  AdminCourseReviews: ['view_content', 'moderate_content'],
  AdminGroups: ['view_community', 'manage_groups'],
  AdminForum: ['view_community', 'manage_forums'],
  AdminEvents: ['view_community', 'manage_events'],
  AdminProducts: ['view_products'],
  AdminDigitalProducts: ['view_products'],
  AdminProductVariants: ['view_products', 'edit_products'],
  AdminProductBundles: ['view_products', 'edit_products'],
  AdminBulkPricing: ['view_products', 'edit_products'],
  AdminPreOrders: ['view_orders', 'manage_orders'],
  AdminGiftCards: ['view_products', 'edit_products'],
  AdminLoyaltyProgram: ['view_sales', 'edit_settings'],
  AdminOrders: ['view_orders'],
  AdminOrderFulfillment: ['manage_orders', 'manage_shipping'],
  AdminInventoryManagement: ['manage_inventory'],
  AdminShippingMethods: ['manage_shipping'],
  AdminTaxConfiguration: ['edit_settings'],
  AdminCouponManager: ['manage_coupons'],
  AdminStoreAnalytics: ['view_sales_analytics'],
  AdminSubscriptions: ['view_sales'],
  AdminDonations: ['view_sales'],
  AdminPaymentGateways: ['manage_payments'],
  AdminAIContentSuite: ['create_content', 'edit_content'],
  AdminAISEOOptimizer: ['edit_products'],
  AdminAIPricing: ['edit_products', 'view_sales_analytics'],
  AdminContentModeration: ['moderate_content'],
  AdminUsers: ['view_users'],
  AdminRoles: ['manage_roles'],
};

export function canAccessAdminPage(user, pageName) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const requiredPermissions = PAGE_PERMISSIONS[pageName];
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return hasAnyPermission(user, requiredPermissions);
}

export function getAllUserPermissions(user) {
  if (!user) return [];
  if (user.role === 'admin') {
    return Object.values(PERMISSION_GROUPS).flatMap(group => group.permissions);
  }
  return user.permissions || [];
}

/**
 * Job title to suggested permissions mapping
 */
export const JOB_TITLE_SUGGESTIONS = {
  'content creator': ['CONTENT', 'BLOG', 'VIDEO'],
  'social media manager': ['CONTENT', 'BLOG', 'PODCAST', 'VIDEO'],
  'community manager': ['COMMUNITY', 'USERS'],
  'moderator': ['COMMUNITY'],
  'analyst': ['ANALYTICS'],
  'data analyst': ['ANALYTICS', 'DATABASE'],
  'store manager': ['COMMERCE'],
  'product manager': ['COMMERCE'],
  'inventory manager': ['COMMERCE'],
  'customer support': ['USERS', 'COMMERCE'],
  'tech support': ['USERS', 'SYSTEM'],
  'developer': ['DATABASE', 'SYSTEM'],
  'database admin': ['DATABASE'],
  'system admin': ['SYSTEM', 'DATABASE'],
};

/**
 * Suggest role permissions based on job title
 * @param {string} jobTitle - Job title or department
 * @returns {string[]} Suggested permission keys
 */
export function suggestPermissionsByJobTitle(jobTitle) {
  if (!jobTitle) return [];
  
  const normalized = jobTitle.toLowerCase().trim();
  
  // Direct match
  if (JOB_TITLE_SUGGESTIONS[normalized]) {
    return JOB_TITLE_SUGGESTIONS[normalized];
  }
  
  // Fuzzy match - check if job title contains keywords
  const suggestions = [];
  for (const [title, groups] of Object.entries(JOB_TITLE_SUGGESTIONS)) {
    if (normalized.includes(title) || title.includes(normalized)) {
      suggestions.push(...groups);
    }
  }
  
  return [...new Set(suggestions)];
}