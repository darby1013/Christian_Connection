import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield, Plus, Edit2, Trash2, Users, Settings, Database,
  FileText, ShoppingBag, BarChart3, Lock, Unlock, Search,
  CheckCircle, XCircle, Key, Crown, Award, Globe, Zap
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPermissionManager() {
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [showAssignPermissions, setShowAssignPermissions] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newPermission, setNewPermission] = useState({
    name: '',
    display_name: '',
    description: '',
    category: 'content',
    resource: '',
    actions: [],
    scope: 'own',
    is_system: false
  });

  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.Permission.list('-created_date'),
    initialData: [],
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list('-created_date'),
    initialData: [],
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: () => base44.entities.RolePermission.list(),
    initialData: [],
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data) => base44.entities.Permission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setShowCreatePermission(false);
      setNewPermission({
        name: '',
        display_name: '',
        description: '',
        category: 'content',
        resource: '',
        actions: [],
        scope: 'own',
        is_system: false
      });
      alert('✅ Permission created!');
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId) => base44.entities.Permission.delete(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      alert('✅ Permission deleted!');
    },
  });

  const assignPermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId, permissionName }) => {
      return await base44.entities.RolePermission.create({
        role_id: roleId,
        permission_id: permissionId,
        permission_name: permissionName,
        granted_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      alert('✅ Permission assigned!');
    },
  });

  const revokePermissionMutation = useMutation({
    mutationFn: async (rolePermissionId) => {
      return await base44.entities.RolePermission.delete(rolePermissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      alert('✅ Permission revoked!');
    },
  });

  const toggleAction = (action) => {
    if (newPermission.actions.includes(action)) {
      setNewPermission({
        ...newPermission,
        actions: newPermission.actions.filter(a => a !== action)
      });
    } else {
      setNewPermission({
        ...newPermission,
        actions: [...newPermission.actions, action]
      });
    }
  };

  const categoryIcons = {
    content: FileText,
    commerce: ShoppingBag,
    community: Users,
    analytics: BarChart3,
    system: Settings,
    users: Users,
    database: Database,
    settings: Settings
  };

  const filteredPermissions = permissions.filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const getRolePermissions = (roleId) => {
    return rolePermissions.filter(rp => rp.role_id === roleId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Permission Manager</h2>
          <p className="text-slate-400 font-semibold">Enterprise-grade granular access control system</p>
        </div>
        <Button onClick={() => setShowCreatePermission(true)} className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Permission
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Key className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{permissions.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Permissions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Crown className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{roles.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Roles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Award className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{rolePermissions.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Assignments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Globe className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{Object.keys(groupedPermissions).length}</p>
            <p className="text-slate-400 text-sm font-semibold">Categories</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="bg-[#1e293b] border border-slate-700 p-1">
          <TabsTrigger value="permissions" className="data-[state=active]:bg-cyan-500">
            <Key className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="assign" className="data-[state=active]:bg-cyan-500">
            <Shield className="w-4 h-4 mr-2" />
            Role Assignments
          </TabsTrigger>
          <TabsTrigger value="matrix" className="data-[state=active]:bg-cyan-500">
            <Database className="w-4 h-4 mr-2" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="mt-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>

          {Object.entries(groupedPermissions).map(([category, perms]) => {
            const CategoryIcon = categoryIcons[category] || Shield;
            return (
              <Card key={category} className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5 text-cyan-400" />
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({perms.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    {perms.map(perm => (
                      <Card key={perm.id} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-white font-bold text-sm mb-1">{perm.display_name}</h4>
                              <p className="text-slate-400 text-xs mb-2">{perm.description}</p>
                              <div className="flex gap-2 flex-wrap">
                                {perm.actions?.map(action => (
                                  <Badge key={action} className="bg-purple-500 text-xs">
                                    {action}
                                  </Badge>
                                ))}
                                <Badge className="bg-blue-500 text-xs">
                                  {perm.scope}
                                </Badge>
                              </div>
                            </div>
                            {!perm.is_system && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm('Delete this permission?')) {
                                    deletePermissionMutation.mutate(perm.id);
                                  }
                                }}
                                className="text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{perm.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Role Assignments Tab */}
        <TabsContent value="assign" className="mt-6 space-y-6">
          {roles.map(role => {
            const assignedPerms = getRolePermissions(role.id);
            return (
              <Card key={role.id} className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white font-bold flex items-center gap-2">
                      <Crown className="w-5 h-5 text-purple-400" />
                      {role.name}
                    </CardTitle>
                    <Badge className="bg-cyan-500">{assignedPerms.length} permissions</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {assignedPerms.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No permissions assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {assignedPerms.map(rp => {
                        const perm = permissions.find(p => p.id === rp.permission_id);
                        if (!perm) return null;
                        return (
                          <Badge key={rp.id} className="bg-purple-500 flex items-center gap-2">
                            {perm.display_name}
                            <XCircle
                              className="w-3 h-3 cursor-pointer hover:text-red-300"
                              onClick={() => {
                                if (confirm(`Revoke ${perm.display_name} from ${role.name}?`)) {
                                  revokePermissionMutation.mutate(rp.id);
                                }
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowAssignPermissions(true);
                    }}
                    size="sm"
                    className="mt-4 bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Assign Permissions
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="matrix" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Permission Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 text-cyan-400 font-bold">Permission</th>
                    {roles.map(role => (
                      <th key={role.id} className="text-center p-3 text-purple-400 font-bold">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.slice(0, 20).map(perm => (
                    <tr key={perm.id} className="border-b border-slate-800">
                      <td className="p-3 text-white">{perm.display_name}</td>
                      {roles.map(role => {
                        const hasPermission = rolePermissions.some(
                          rp => rp.role_id === role.id && rp.permission_id === perm.id
                        );
                        return (
                          <td key={role.id} className="text-center p-3">
                            {hasPermission ? (
                              <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Permission Modal */}
      {showCreatePermission && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreatePermission(false)}>
          <Card className="bg-[#1a1f3a] border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Create New Permission</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Permission Name (code)</Label>
                  <Input
                    placeholder="e.g., create_blog_posts"
                    value={newPermission.name}
                    onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Display Name</Label>
                  <Input
                    placeholder="e.g., Create Blog Posts"
                    value={newPermission.display_name}
                    onChange={(e) => setNewPermission({...newPermission, display_name: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Description</Label>
                <Input
                  placeholder="What this permission allows..."
                  value={newPermission.description}
                  onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Category</Label>
                  <Select value={newPermission.category} onValueChange={(v) => setNewPermission({...newPermission, category: v})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="content" className="text-white">Content</SelectItem>
                      <SelectItem value="commerce" className="text-white">Commerce</SelectItem>
                      <SelectItem value="community" className="text-white">Community</SelectItem>
                      <SelectItem value="analytics" className="text-white">Analytics</SelectItem>
                      <SelectItem value="system" className="text-white">System</SelectItem>
                      <SelectItem value="users" className="text-white">Users</SelectItem>
                      <SelectItem value="database" className="text-white">Database</SelectItem>
                      <SelectItem value="settings" className="text-white">Settings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Resource</Label>
                  <Input
                    placeholder="e.g., BlogPost, Product"
                    value={newPermission.resource}
                    onChange={(e) => setNewPermission({...newPermission, resource: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Scope</Label>
                  <Select value={newPermission.scope} onValueChange={(v) => setNewPermission({...newPermission, scope: v})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="own" className="text-white">Own Only</SelectItem>
                      <SelectItem value="team" className="text-white">Team</SelectItem>
                      <SelectItem value="all" className="text-white">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Allowed Actions</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['create', 'read', 'update', 'delete', 'publish', 'moderate', 'export', 'import'].map(action => (
                    <label key={action} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-800/50">
                      <Checkbox
                        checked={newPermission.actions.includes(action)}
                        onCheckedChange={() => toggleAction(action)}
                      />
                      <span className="text-slate-300 text-sm capitalize">{action}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCreatePermission(false)} variant="outline" className="flex-1 border-slate-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => createPermissionMutation.mutate(newPermission)}
                  disabled={!newPermission.name || !newPermission.display_name}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
                  Create Permission
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Permissions Modal */}
      {showAssignPermissions && selectedRole && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignPermissions(false)}>
          <Card className="bg-[#1a1f3a] border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">
                Assign Permissions to {selectedRole.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => {
                const CategoryIcon = categoryIcons[category] || Shield;
                return (
                  <div key={category}>
                    <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                      <CategoryIcon className="w-4 h-4" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {perms.map(perm => {
                        const isAssigned = rolePermissions.some(
                          rp => rp.role_id === selectedRole.id && rp.permission_id === perm.id
                        );
                        return (
                          <div
                            key={perm.id}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isAssigned
                                ? 'border-green-500 bg-green-900/20'
                                : 'border-slate-700 hover:border-slate-600'
                            }`}
                            onClick={() => {
                              if (isAssigned) {
                                const rp = rolePermissions.find(
                                  r => r.role_id === selectedRole.id && r.permission_id === perm.id
                                );
                                if (rp) revokePermissionMutation.mutate(rp.id);
                              } else {
                                assignPermissionMutation.mutate({
                                  roleId: selectedRole.id,
                                  permissionId: perm.id,
                                  permissionName: perm.name
                                });
                              }
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-white font-semibold text-sm">{perm.display_name}</p>
                                <p className="text-slate-400 text-xs">{perm.description}</p>
                              </div>
                              {isAssigned ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}