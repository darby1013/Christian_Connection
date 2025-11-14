import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield, Plus, Edit2, Trash2, Users, Crown, Key,
  Settings, FileText, ShoppingBag, BarChart3, Database,
  Globe, Award, Zap, CheckCircle, XCircle, Search,
  AlertCircle, Lock, Unlock, UserPlus, Activity
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminRolesEnhanced() {
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newRole, setNewRole] = useState({
    name: '',
    slug: '',
    description: '',
    priority: 50,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list('-created_date'),
    initialData: [],
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.Permission.list(),
    initialData: [],
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: () => base44.entities.RolePermission.list(),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const createRoleMutation = useMutation({
    mutationFn: (roleData) => base44.entities.Role.create(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateRole(false);
      setNewRole({
        name: '',
        slug: '',
        description: '',
        priority: 50,
        is_active: true
      });
      alert('✅ Role created!');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId) => base44.entities.Role.delete(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      alert('✅ Role deleted!');
    },
  });

  const filteredRoles = roles.filter(r =>
    !searchQuery ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRolePermissions = (roleId) => {
    return rolePermissions.filter(rp => rp.role_id === roleId);
  };

  const getUsersWithRole = (roleName) => {
    return users.filter(u => u.custom_role === roleName || u.role === roleName).length;
  };

  // Pre-defined role templates
  const roleTemplates = [
    {
      name: 'Content Editor',
      slug: 'content_editor',
      description: 'Can create and edit blog posts, videos, and podcasts',
      permissions: ['create_blog_posts', 'edit_blog_posts', 'create_videos', 'create_podcasts']
    },
    {
      name: 'Community Manager',
      slug: 'community_manager',
      description: 'Manages groups, forums, and community engagement',
      permissions: ['manage_groups', 'moderate_forums', 'manage_events', 'view_analytics']
    },
    {
      name: 'Support Staff',
      slug: 'support_staff',
      description: 'Handles customer inquiries and support tickets',
      permissions: ['view_users', 'manage_orders', 'send_emails', 'view_analytics']
    },
    {
      name: 'Product Manager',
      slug: 'product_manager',
      description: 'Manages store products and inventory',
      permissions: ['manage_products', 'manage_inventory', 'view_orders', 'manage_coupons']
    },
    {
      name: 'Analytics Viewer',
      slug: 'analytics_viewer',
      description: 'Can view reports and analytics',
      permissions: ['view_analytics', 'export_reports']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Role & Permission Management</h2>
          <p className="text-slate-400 font-semibold">Enterprise-grade access control with granular permissions</p>
        </div>
        <Button onClick={() => setShowCreateRole(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <Crown className="w-8 md:w-10 h-8 md:h-10 text-purple-400 mb-2 md:mb-3" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{roles.length}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Custom Roles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <Key className="w-8 md:w-10 h-8 md:h-10 text-cyan-400 mb-2 md:mb-3" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{permissions.length}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Permissions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <Users className="w-8 md:w-10 h-8 md:h-10 text-green-400 mb-2 md:mb-3" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{users.length}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <Award className="w-8 md:w-10 h-8 md:h-10 text-amber-400 mb-2 md:mb-3" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{rolePermissions.length}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      {/* Roles List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map(role => {
          const assignedPerms = getRolePermissions(role.id);
          const userCount = getUsersWithRole(role.slug);
          
          return (
            <Card key={role.id} className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700 hover:border-cyan-500 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <Badge className={role.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                      {role.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-white font-black text-lg mb-2">{role.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{role.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Permissions:</span>
                    <span className="text-white font-bold">{assignedPerms.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Users:</span>
                    <span className="text-white font-bold">{userCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Priority:</span>
                    <span className="text-white font-bold">{role.priority}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-300">
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400"
                    onClick={() => {
                      if (confirm(`Delete role "${role.name}"?`)) {
                        deleteRoleMutation.mutate(role.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Role Templates */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardHeader className="border-b border-purple-500/30">
          <CardTitle className="text-purple-300 font-bold">⚡ Quick Role Templates</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleTemplates.map(template => (
              <Card key={template.slug} className="bg-slate-900/50 border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <h4 className="text-white font-bold mb-2">{template.name}</h4>
                  <p className="text-slate-400 text-xs mb-3">{template.description}</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewRole({
                        name: template.name,
                        slug: template.slug,
                        description: template.description,
                        priority: 50,
                        is_active: true
                      });
                      setShowCreateRole(true);
                    }}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateRole(false)}>
          <Card className="bg-[#1a1f3a] border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Create Custom Role</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Role Name</Label>
                  <Input
                    placeholder="e.g., Content Editor"
                    value={newRole.name}
                    onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Slug (URL-friendly)</Label>
                  <Input
                    placeholder="e.g., content_editor"
                    value={newRole.slug}
                    onChange={(e) => setNewRole({...newRole, slug: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Description</Label>
                <Input
                  placeholder="Describe what this role can do..."
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Priority (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newRole.priority}
                  onChange={(e) => setNewRole({...newRole, priority: parseInt(e.target.value) || 50})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">Higher priority = more privileges</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={newRole.is_active}
                  onCheckedChange={(checked) => setNewRole({...newRole, is_active: checked})}
                />
                <span className="text-slate-300">Active (users can be assigned this role)</span>
              </label>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCreateRole(false)} variant="outline" className="flex-1 border-slate-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => createRoleMutation.mutate(newRole)}
                  disabled={!newRole.name || !newRole.slug}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Create Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}