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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Shield, Plus, Edit2, Trash2, Users, Lock, CheckCircle,
  AlertTriangle, Database, FileText, ShoppingBag, MessageSquare,
  Settings, BarChart3, Eye, Podcast, Video, Clock, UserCheck,
  Sparkles, GitBranch, History, Search, TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSION_GROUPS, DEFAULT_ROLES, getRoleWithInheritance, suggestPermissionsByJobTitle } from "@/components/utils/permissions";

export default function AdminRoles() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [roleForm, setRoleForm] = useState({
    name: '',
    slug: '',
    description: '',
    permissions: [],
    parent_role_id: null,
    priority: 50,
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

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['roleAuditLogs'],
    queryFn: () => base44.entities.RoleAuditLog.list('-created_date', 100),
    initialData: [],
  });

  const createAuditLog = async (roleId, roleName, action, changes = {}) => {
    try {
      await base44.entities.RoleAuditLog.create({
        role_id: roleId,
        role_name: roleName,
        action,
        performed_by: currentUser?.id,
        performer_name: currentUser?.full_name,
        performer_email: currentUser?.email,
        changes,
        metadata: {
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  };

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: async (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      await createAuditLog(newRole.id, newRole.name, 'created', {
        after: newRole,
        fields_changed: ['all']
      });
      resetForm();
      alert('✅ Role created successfully!');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data, before }) => base44.entities.Role.update(id, data).then(updated => ({ updated, before })),
    onSuccess: async ({ updated, before }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      
      const fieldsChanged = Object.keys(updated).filter(key => 
        JSON.stringify(updated[key]) !== JSON.stringify(before[key])
      );
      
      await createAuditLog(updated.id, updated.name, 'updated', {
        before,
        after: updated,
        fields_changed: fieldsChanged
      });
      
      resetForm();
      alert('✅ Role updated successfully!');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.Role.delete(id).then(() => role),
    onSuccess: async (deletedRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      await createAuditLog(deletedRole.id, deletedRole.name, 'deleted', {
        before: deletedRole,
        fields_changed: ['all']
      });
      alert('✅ Role deleted successfully!');
    },
  });

  const handleSubmit = () => {
    if (!roleForm.name || !roleForm.slug) {
      alert('Please fill in required fields');
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate({ 
        id: editingRole.id, 
        data: roleForm,
        before: editingRole 
      });
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
      parent_role_id: null,
      priority: 50,
      is_active: true,
    });
    setEditingRole(null);
    setShowDialog(false);
    setShowSuggestions(false);
    setJobTitle('');
  };

  const editRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions || [],
      parent_role_id: role.parent_role_id || null,
      priority: role.priority || 50,
      is_active: role.is_active !== false,
    });
    setShowDialog(true);
  };

  const deleteRole = (role) => {
    if (confirm(`Delete role "${role.name}"? Users with this role will lose permissions.`)) {
      deleteRoleMutation.mutate({ id: role.id, role });
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
      priority: template.priority || 50,
    });
  };

  const applySuggestions = () => {
    const suggestedGroups = suggestPermissionsByJobTitle(jobTitle);
    const suggestedPermissions = suggestedGroups.flatMap(groupKey => 
      PERMISSION_GROUPS[groupKey]?.permissions || []
    );
    
    setRoleForm({
      ...roleForm,
      permissions: [...new Set([...roleForm.permissions, ...suggestedPermissions])],
    });
    setShowSuggestions(false);
    setJobTitle('');
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
    return users.filter(u => u.custom_role === roleSlug);
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

  const getPriorityColor = (priority) => {
    if (priority >= 70) return 'bg-red-500';
    if (priority >= 50) return 'bg-amber-500';
    if (priority >= 30) return 'bg-blue-500';
    return 'bg-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Roles & Permissions</h2>
          <p className="text-slate-400 font-semibold">Advanced role-based access control with inheritance & auditing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAuditLog(true)} variant="outline" className="border-slate-700 text-slate-300">
            <History className="w-4 h-4 mr-2" />
            Audit Log
          </Button>
          <Button onClick={() => setShowDialog(true)} className="bg-cyan-500 hover:bg-cyan-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>
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
                const usersWithRole = getUsersWithRole(role.slug);
                const roleWithInheritance = getRoleWithInheritance(role, roles);
                const parentRole = roles.find(r => r.id === role.parent_role_id);
                
                return (
                  <div key={role.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-white font-bold text-lg">{role.name}</h3>
                          <Badge className={role.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge className={getPriorityColor(role.priority || 0)}>
                            Priority: {role.priority || 0}
                          </Badge>
                          <Badge className="bg-purple-500 cursor-pointer hover:bg-purple-600" onClick={() => setSelectedRole(role)}>
                            <Users className="w-3 h-3 mr-1" />
                            {usersWithRole.length} user{usersWithRole.length !== 1 ? 's' : ''}
                          </Badge>
                          <Badge className="bg-cyan-500">
                            <Lock className="w-3 h-3 mr-1" />
                            {roleWithInheritance.permissions?.length || 0} permissions
                          </Badge>
                          {parentRole && (
                            <Badge className="bg-blue-500">
                              <GitBranch className="w-3 h-3 mr-1" />
                              Inherits from {parentRole.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{role.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                            const hasAny = group.permissions.some(p => roleWithInheritance.permissions?.includes(p));
                            if (!hasAny) return null;
                            
                            const hasAll = group.permissions.every(p => roleWithInheritance.permissions?.includes(p));
                            
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
                        <Button size="sm" onClick={() => deleteRole(role)} variant="outline" className="border-red-500/30 text-red-400">
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
              Define custom permissions with inheritance and AI-powered suggestions
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="bg-slate-900 border border-slate-700">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
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
                        <span className="text-xs text-slate-400 mt-1">{template.permissions.length} permissions · Priority {template.priority}</span>
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

              <div>
                <Label className="text-white font-bold mb-2 block">Parent Role (Inheritance)</Label>
                <Select value={roleForm.parent_role_id || 'none'} onValueChange={(value) => setRoleForm({...roleForm, parent_role_id: value === 'none' ? null : value})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="No parent (no inheritance)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="none" className="text-white">No parent role</SelectItem>
                    {roles.filter(r => r.id !== editingRole?.id).map(r => (
                      <SelectItem key={r.id} value={r.id} className="text-white">
                        {r.name} ({r.permissions?.length || 0} permissions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-slate-400 text-xs mt-1">
                  <GitBranch className="w-3 h-3 inline mr-1" />
                  Inherit all permissions from parent role
                </p>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">
                  Priority: {roleForm.priority} 
                  <Badge className={`ml-2 ${getPriorityColor(roleForm.priority)}`}>
                    {roleForm.priority >= 70 ? 'Critical' : roleForm.priority >= 50 ? 'High' : roleForm.priority >= 30 ? 'Medium' : 'Low'}
                  </Badge>
                </Label>
                <Slider
                  value={[roleForm.priority]}
                  max={100}
                  step={5}
                  onValueChange={([value]) => setRoleForm({...roleForm, priority: value})}
                  className="mb-2"
                />
                <p className="text-slate-400 text-xs">Higher priority roles override lower ones in conflict situations (0-100)</p>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  checked={roleForm.is_active}
                  onCheckedChange={(checked) => setRoleForm({...roleForm, is_active: checked})}
                />
                <Label className="text-white font-semibold">Role is active</Label>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white font-bold">Permissions</Label>
                <Badge className="bg-cyan-500">
                  {roleForm.permissions.length} selected
                </Badge>
              </div>

              {roleForm.parent_role_id && (
                <Card className="bg-blue-900/20 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <GitBranch className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-300 font-bold mb-1">Permission Inheritance Active</p>
                        <p className="text-blue-200 text-sm">
                          This role will automatically inherit all {roles.find(r => r.id === roleForm.parent_role_id)?.permissions?.length || 0} permissions from its parent role, plus any additional permissions you select below.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-8 h-8 text-purple-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">AI-Powered Permission Suggestions</h3>
                      <p className="text-purple-200 text-sm mb-4">
                        Enter a job title or department to get intelligent permission recommendations based on common role patterns.
                      </p>
                      
                      <div className="space-y-3">
                        <Input
                          placeholder="e.g., Content Creator, Store Manager, Analyst..."
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                        <Button 
                          onClick={applySuggestions}
                          disabled={!jobTitle}
                          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 w-full"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Get AI Suggestions
                        </Button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-slate-400 text-xs mb-2">Common Job Titles:</p>
                        <div className="flex flex-wrap gap-2">
                          {['Content Creator', 'Community Manager', 'Store Manager', 'Data Analyst', 'Customer Support', 'Database Admin'].map(title => (
                            <Badge 
                              key={title}
                              className="bg-slate-700 hover:bg-slate-600 cursor-pointer"
                              onClick={() => setJobTitle(title)}
                            >
                              {title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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

      {/* Users with Role Dialog */}
      <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-purple-400" />
              Users with "{selectedRole?.name}" Role
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getUsersWithRole(selectedRole?.slug || '').map(user => (
              <Card key={user.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{user.full_name}</p>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                  </div>
                  <Badge className="bg-purple-500">
                    {user.role === 'admin' ? 'Admin' : 'Custom Role'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {getUsersWithRole(selectedRole?.slug || '').length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No users assigned to this role yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <History className="w-6 h-6 text-cyan-400" />
              Role Audit Log
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete history of all role changes and assignments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {auditLogs.map(log => (
              <Card key={log.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        log.action === 'created' ? 'bg-green-500' :
                        log.action === 'updated' ? 'bg-blue-500' :
                        log.action === 'deleted' ? 'bg-red-500' :
                        'bg-purple-500'
                      }>
                        {log.action.toUpperCase()}
                      </Badge>
                      <p className="text-white font-bold">{log.role_name}</p>
                    </div>
                    <p className="text-slate-400 text-xs">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(log.created_date).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">
                    by <span className="text-cyan-400">{log.performer_name}</span> ({log.performer_email})
                  </p>
                  {log.changes?.fields_changed?.length > 0 && (
                    <div className="mt-2 p-2 bg-slate-800/50 rounded">
                      <p className="text-slate-400 text-xs mb-1">Fields Changed:</p>
                      <div className="flex flex-wrap gap-1">
                        {log.changes.fields_changed.map(field => (
                          <Badge key={field} className="bg-slate-700 text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No audit logs yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}