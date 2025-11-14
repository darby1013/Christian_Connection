import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

/**
 * Enterprise Permission Guard Component
 * Checks if user has required permissions before rendering children
 */
export function PermissionGuard({ 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback,
  showError = true,
  children 
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const { data: userPermissions = [] } = useQuery({
    queryKey: ['userPermissions', user?.id],
    queryFn: async () => {
      // Get direct user permissions
      const directPerms = await base44.entities.UserPermission.filter({ user_id: user.id });
      
      // Get role-based permissions
      const userRoles = await base44.entities.Role.filter({ slug: user.custom_role });
      const roleIds = userRoles.map(r => r.id);
      
      const rolePerms = [];
      for (const roleId of roleIds) {
        const perms = await base44.entities.RolePermission.filter({ role_id: roleId });
        rolePerms.push(...perms);
      }

      return {
        direct: directPerms.map(p => p.permission_name),
        fromRoles: rolePerms.map(p => p.permission_name)
      };
    },
    enabled: !!user && user.role !== 'admin',
    initialData: { direct: [], fromRoles: [] }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return showError ? (
      <Alert className="bg-red-900/20 border-red-500/30">
        <Lock className="w-4 h-4 text-red-400" />
        <AlertDescription className="text-red-300">
          Please log in to access this content.
        </AlertDescription>
      </Alert>
    ) : fallback || null;
  }

  // Admins have all permissions
  if (user.role === 'admin') {
    return children;
  }

  // Check permissions
  const allUserPermissions = [
    ...userPermissions.direct,
    ...userPermissions.fromRoles
  ];

  const requiredPermissions = permission ? [permission] : permissions;
  
  const hasPermission = requireAll
    ? requiredPermissions.every(p => allUserPermissions.includes(p))
    : requiredPermissions.some(p => allUserPermissions.includes(p));

  if (!hasPermission) {
    return showError ? (
      <Alert className="bg-amber-900/20 border-amber-500/30">
        <Shield className="w-4 h-4 text-amber-400" />
        <AlertDescription className="text-amber-300">
          <p className="font-bold mb-2">Insufficient Permissions</p>
          <p className="text-sm">You need: {requiredPermissions.join(', ')}</p>
          <Button
            size="sm"
            onClick={() => window.location.href = createPageUrl('Home')}
            className="mt-3 bg-amber-500 hover:bg-amber-600"
          >
            Go Home
          </Button>
        </AlertDescription>
      </Alert>
    ) : fallback || null;
  }

  return children;
}

/**
 * Hook to check permissions programmatically
 */
export function usePermissions(userId) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not authenticated');
      }
    };
    fetchUser();
  }, []);

  const { data: permissions = { direct: [], fromRoles: [] } } = useQuery({
    queryKey: ['userPermissions', userId || user?.id],
    queryFn: async () => {
      const targetUser = userId || user;
      if (!targetUser) return { direct: [], fromRoles: [] };

      const directPerms = await base44.entities.UserPermission.filter({ user_id: targetUser.id });
      const userRoles = await base44.entities.Role.filter({ slug: targetUser.custom_role });
      const roleIds = userRoles.map(r => r.id);
      
      const rolePerms = [];
      for (const roleId of roleIds) {
        const perms = await base44.entities.RolePermission.filter({ role_id: roleId });
        rolePerms.push(...perms);
      }

      return {
        direct: directPerms.map(p => p.permission_name),
        fromRoles: rolePerms.map(p => p.permission_name)
      };
    },
    enabled: !!user || !!userId,
    initialData: { direct: [], fromRoles: [] }
  });

  const allPermissions = [...permissions.direct, ...permissions.fromRoles];

  const hasPermission = (permission) => {
    if (user?.role === 'admin') return true;
    return allPermissions.includes(permission);
  };

  const hasAnyPermission = (perms) => {
    if (user?.role === 'admin') return true;
    return perms.some(p => allPermissions.includes(p));
  };

  const hasAllPermissions = (perms) => {
    if (user?.role === 'admin') return true;
    return perms.every(p => allPermissions.includes(p));
  };

  return {
    permissions: allPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.role === 'admin'
  };
}

export default PermissionGuard;