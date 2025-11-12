
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Shield, Plus, Edit2, Trash2, Users, Lock, CheckCircle,
  AlertTriangle, Database, FileText, ShoppingBag, MessageSquare,
  Settings, BarChart3, Eye, Podcast, Video
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PERMISSION_GROUPS, DEFAULT_ROLES } from "../../components/utils/permissions";

export default function AdminRoles() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    slug: '',
    description: '',
    permissions: [],
    priority: 0,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list('-priority'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
      alert('✅ Role created successfully!');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
      alert('✅ Role updated successfully!');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      alert('✅ Role deleted successfully!');
    },
  });

  const handleSubmit = () => {
    if (!roleForm.name || !roleForm.slug) {
      alert('Please fill in required fields');
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: roleForm });
    } else {
      createRoleMutation.mutate(roleForm);
    }
  };

  const resetForm = () => {
    setRoleForm({
      name: '',
      slug: '',
      description: '',
      permissions: [],
      priority: 0,
      is_active: true,
    });
    setEditingRole(null);
    setShowDialog(false);
  };

  const editRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions || [],
      priority: role.priority || 0,
      is_active: role.is_active !== false,
    });
    setShowDialog(true);
  };

  const deleteRole = (id) => {
    if (confirm('Delete this role? Users with this role will lose permissions.')) {
      deleteRoleMutation.mutate(id);
    }
  };

  const applyTemplate = (templateKey) => {
    const template = DEFAULT_ROLES[templateKey];
    setRoleForm({
      ...roleForm,
      name: template.name,
      slug: template.name.toLowerCase().replace(/\s+/g, '_'),
      description: template.description,
      permissions: template.permissions,
    });
  };

  const togglePermission = (permission) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const togglePermissionGroup = (group) => {
    const allGroupPerms = PERMISSION_GROUPS[group].permissions;
    const hasAll = allGroupPerms.every(p => roleForm.permissions.includes(p));
    
    if (hasAll) {
      setRoleForm(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !allGroupPerms.includes(p)),
      }));
    } else {
      setRoleForm(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...allGroupPerms])],
      }));
    }
  };

  const getUsersWithRole = (roleSlug) => {
    return users.filter(u => u.custom_role === roleSlug).length;
  };

  const getGroupIcon = (groupKey) => {
    switch(groupKey) {
      case 'ANALYTICS': return <BarChart3 className="w-4 h-4" />;
      case 'DATABASE': return <Database className="w-4 h-4" />;
      case 'CONTENT': return <FileText className="w-4 h-4" />;
      case 'BLOG': return <FileText className="w-4 h-4" />;
      case 'PODCAST': return <Podcast className="w-4 h-4" />;
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'USERS': return <Users className="w-4 h-4" />;
      case 'COMMERCE': return <ShoppingBag className="w-4 h-4" />;
      case 'COMMUNITY': return <MessageSquare className="w-4 h-4" />;
      case 'SYSTEM': return <Settings className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Roles & Permissions</h2>
          <p className="text-slate-400 font-semibold">Granular role-based access control system</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{roles.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{roles.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Custom Roles</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{users.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{users.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{Object.keys(PERMISSION_GROUPS).length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{Object.keys(PERMISSION_GROUPS).length}</p>
            <p className="text-slate-400 text-sm font-semibold">Permission Groups</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{roles.filter(r => r.is_active).length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{roles.filter(r => r.is_active).length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Built-in Roles Info */}
      <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Built-in Admin Role</h3>
              <p className="text-cyan-200 text-sm mb-3">
                The default "admin" role has full system access and cannot be modified. Custom roles allow you to create specialized permissions for different team members.
              </p>
              <div className="flex gap-2">
                <Badge className="bg-cyan-500">Admins: {users.filter(u => u.role === 'admin').length}</Badge>
                <Badge className="bg-green-500">All Permissions Granted</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Custom Roles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {roles.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No Custom Roles Yet</h3>
              <p className="text-slate-400 mb-6">Create specialized roles with specific permissions</p>
              <Button onClick={() => setShowDialog(true)} className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Create First Role
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {roles.map((role) => {
                const userCount = getUsersWithRole(role.slug);
                return (
                  <div key={role.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-bold text-lg">{role.name}</h3>
                          <Badge className={role.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge className="bg-purple-500">
                            <Users className="w-3 h-3 mr-1" />
                            {userCount} user{userCount !== 1 ? 's' : ''}
                          </Badge>
                          <Badge className="bg-cyan-500">
                            <Lock className="w-3 h-3 mr-1" />
                            {role.permissions?.length || 0} permissions
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{role.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                            const hasAny = group.permissions.some(p => role.permissions?.includes(p));
                            if (!hasAny) return null;
                            
                            const hasAll = group.permissions.every(p => role.permissions?.includes(p));
                            
                            return (
                              <Badge key={key} className={`${hasAll ? 'bg-green-500' : 'bg-blue-500'} text-xs`}>
                                {getGroupIcon(key)}
                                <span className="ml-1">{group.name}</span>
                                {!hasAll && ' (Partial)'}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => editRole(role)} className="bg-cyan-500 hover:bg-cyan-600">
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => deleteRole(role.id)} variant="outline" className="border-red-500/30 text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowDialog(open); }}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Define custom permissions for specialized team members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Templates */}
            {!editingRole && (
              <div>
                <Label className="text-white font-bold mb-2 block">Quick Start Templates</Label>
                <div className="grid md:grid-cols-3 gap-2">
                  {Object.entries(DEFAULT_ROLES).map(([key, template]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant="outline"
                      onClick={() => applyTemplate(key)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 h-auto py-3 flex-col items-start"
                    >
                      <span className="font-bold text-white">{template.name}</span>
                      <span className="text-xs text-slate-400 mt-1">{template.permissions.length} permissions</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Role Name *</Label>
                <Input
                  placeholder="e.g., Content Manager"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white font-bold mb-2 block">Slug *</Label>
                <Input
                  placeholder="content_manager"
                  value={roleForm.slug}
                  onChange={(e) => setRoleForm({...roleForm, slug: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block">Description</Label>
              <Textarea
                placeholder="What can users with this role do?"
                value={roleForm.description}
                onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-20"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Priority</Label>
                <Input
                  type="number"
                  value={roleForm.priority}
                  onChange={(e) => setRoleForm({...roleForm, priority: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-slate-500 text-xs mt-1">Higher priority = more privileges in conflicts</p>
              </div>
              <div className="flex items-center gap-3 pt-8">
                <Checkbox
                  checked={roleForm.is_active}
                  onCheckedChange={(checked) => setRoleForm({...roleForm, is_active: checked})}
                />
                <Label className="text-white font-semibold">Role is active</Label>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white font-bold">Permissions</Label>
                <Badge className="bg-cyan-500">
                  {roleForm.permissions.length} selected
                </Badge>
              </div>

              <div className="space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                  const allGroupPerms = group.permissions;
                  const selectedCount = allGroupPerms.filter(p => roleForm.permissions.includes(p)).length;
                  const allSelected = selectedCount === allGroupPerms.length;
                  
                  return (
                    <Card key={key} className="bg-slate-900/50 border-slate-700">
                      <CardHeader className="py-3 px-4 border-b border-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => togglePermissionGroup(key)}
                            />
                            <Label className="text-white font-bold flex items-center gap-2 cursor-pointer">
                              {getGroupIcon(key)}
                              {group.name}
                            </Label>
                          </div>
                          <Badge className={allSelected ? 'bg-green-500' : selectedCount > 0 ? 'bg-blue-500' : 'bg-slate-600'}>
                            {selectedCount}/{allGroupPerms.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid md:grid-cols-2 gap-3">
                          {allGroupPerms.map((permission) => (
                            <label key={permission} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                              <Checkbox
                                checked={roleForm.permissions.includes(permission)}
                                onCheckedChange={() => togglePermission(permission)}
                              />
                              <span className="text-slate-300 text-sm">
                                {permission.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-cyan-500 hover:bg-cyan-600">
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
