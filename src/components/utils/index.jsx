/**
 * Central Utilities Export Hub
 */

export function createPageUrl(pageName) {
  return `/${pageName.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2')}`;
}

export {
  PERMISSION_GROUPS,
  DEFAULT_ROLES,
  PAGE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessAdminPage,
  getAllUserPermissions,
} from './permissions.js';

export { default as NotificationService } from './notificationService.js';