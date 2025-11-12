import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { hasPermission, hasAnyPermission, canAccessAdminPage } from "@/utils/permissions";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Permission Guard Component
 * Wraps content and only shows it if user has required permissions
 */
export function PermissionGuard({ 
  user, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null,
  children 
}) {
  // Admin always has access
  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(user, permission)) {
      return fallback || <NoPermissionFallback />;
    }
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll
      ? permissions.every(p => hasPermission(user, p))
      : hasAnyPermission(user, permissions);
    
    if (!hasAccess) {
      return fallback || <NoPermissionFallback />;
    }
  }

  return <>{children}</>;
}

/**
 * Page Permission Guard
 * Checks if user can access an admin page
 */
export function PagePermissionGuard({ user, pageName, children }) {
  if (!user) {
    return <NoAuthFallback />;
  }

  if (!canAccessAdminPage(user, pageName)) {
    return <NoPermissionFallback pageName={pageName} />;
  }

  return <>{children}</>;
}

/**
 * Button Permission Guard
 * Disables button if user lacks permission
 */
export function PermissionButton({ 
  user, 
  permission, 
  permissions,
  requireAll = false,
  disableOnly = false,
  children,
  ...buttonProps 
}) {
  const hasAccess = user?.role === 'admin' || (
    permission 
      ? hasPermission(user, permission)
      : requireAll
      ? permissions?.every(p => hasPermission(user, p))
      : hasAnyPermission(user, permissions || [])
  );

  if (!hasAccess && !disableOnly) {
    return null;
  }

  return React.cloneElement(children, {
    ...buttonProps,
    disabled: !hasAccess || buttonProps.disabled,
    title: !hasAccess ? 'You do not have permission for this action' : buttonProps.title,
  });
}

/**
 * Default fallback when user doesn't have permission
 */
function NoPermissionFallback({ pageName }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="bg-[#1a1f3a] border-red-500/30 max-w-md">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-3">Access Denied</h2>
          <p className="text-slate-300 mb-6">
            You don't have permission to access {pageName ? `the ${pageName.replace('Admin', '')} page` : 'this content'}.
          </p>
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">
              Contact an administrator if you need access.
            </p>
            <Link to={createPageUrl("AdminDashboard")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Shield className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Fallback when user is not authenticated
 */
function NoAuthFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="bg-[#1a1f3a] border-amber-500/30 max-w-md">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-900/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-3">Authentication Required</h2>
          <p className="text-slate-300 mb-6">
            Please sign in to access this page.
          </p>
          <Button 
            onClick={() => window.location.href = createPageUrl("Home")}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PermissionGuard;