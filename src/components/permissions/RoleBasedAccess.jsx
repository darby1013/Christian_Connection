import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Simplified role-based access control
 * Shows/hides content based on user role
 */
export function RoleBasedAccess({ 
  allowedRoles = [], 
  requireAdmin = false,
  fallback = null,
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

  if (loading) return null;
  if (!user) return fallback;

  // Check admin requirement
  if (requireAdmin && user.role !== 'admin') {
    return fallback;
  }

  // Check if user has required role
  if (allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role) || 
                   allowedRoles.includes(user.custom_role);
    
    if (!hasRole && user.role !== 'admin') {
      return fallback;
    }
  }

  return children;
}

/**
 * Hook for programmatic role checking
 */
export function useRole() {
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

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role || user.custom_role === role;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role) || roles.includes(user.custom_role);
  };

  return {
    user,
    hasRole,
    isAdmin,
    hasAnyRole,
    currentRole: user?.role,
    customRole: user?.custom_role
  };
}

export default RoleBasedAccess;