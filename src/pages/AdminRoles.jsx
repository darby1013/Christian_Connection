import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Plus, Pencil, Trash2, Users, CheckCircle } from "lucide-react";

export default function AdminRoles() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const queryClient = useQueryClient();

  const [roleForm, setRoleForm] = useState({
    name: "",
    slug: "",
    description: "",
    can_manage_users: false,
    can_manage_content: false,
    can_moderate_comments: false,
    can_manage_groups: false,
    can_manage_forum: false,
    can_view_analytics: false,
    can_manage_products: false,
    can_manage_orders: false,
    priority: 0,
    is_active: true
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['adminRoles'],
    queryFn: () => base44.entities.Role.list('priority'),
    initialData: [],
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      setEditingRole(null);
      resetForm();
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
    },
  });

  const resetForm = () => {
    setRoleForm({
      name: "",
      slug: "",
      description: "",
      can_manage_users: false,
      can_manage_content: false,
      can_moderate_comments: false,
      can_manage_groups: false,
      can_manage_forum: false,
      can_view_analytics: false,
      can_manage_products: false,
      can_manage_orders: false,
      priority: 0,
      is_active: true
    });
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setRoleForm(role);
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: roleForm });
    } else {
      createRoleMutation.mutate(roleForm);
    }
  };

  const permissions = [
    { key: 'can_manage_users', label: 'Manage Users', description: 'Create, edit, delete users' },
    { key: 'can_manage_content', label: 'Manage Content', description: 'Create, edit, delete content' },
    { key: 'can_moderate_comments', label: 'Moderate Comments', description: 'Edit, delete comments' },
    { key: 'can_manage_groups', label: 'Manage Groups', description: 'Create, edit, delete groups' },
    { key: 'can_manage_forum', label: 'Manage Forum', description: 'Moderate forum discussions' },
    { key: 'can_view_analytics', label: 'View Analytics', description: 'Access analytics dashboard' },
    { key: 'can_manage_products', label: 'Manage Products', description: 'Create, edit, delete products' },
    { key: 'can_manage_orders', label: 'Manage Orders', description: 'View, edit orders' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Total Roles</p>
                <p className="text-3xl font-black text-white mt-1">{roles.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Active Roles</p>
                <p className="text-3xl font-black text-white mt-1">
                  {roles.filter(r => r.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Custom Roles</p>
                <p className="text-3xl font-black text-white mt-1">
                  {roles.filter(r => !['admin', 'user'].includes(r.slug)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card className="bg-[#1a1f3a] border-0">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-white font-black text-xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Roles & Permissions
          </CardTitle>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold" onClick={() => { resetForm(); setEditingRole(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold">Role Name</Label>
                    <Input
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      placeholder="e.g., Content Moderator"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold">Slug</Label>
                    <Input
                      value={roleForm.slug}
                      onChange={(e) => setRoleForm({...roleForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      placeholder="content_moderator"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white font-bold">Description</Label>
                  <Textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2 h-20"
                    placeholder="Role description..."
                  />
                </div>

                <div>
                  <Label className="text-white font-bold">Priority Level</Label>
                  <Input
                    type="number"
                    value={roleForm.priority}
                    onChange={(e) => setRoleForm({...roleForm, priority: parseInt(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                  />
                  <p className="text-xs text-slate-400 mt-1">Higher priority = more privileges</p>
                </div>

                <div>
                  <Label className="text-white font-bold mb-3 block">Permissions</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {permissions.map((perm) => (
                      <div key={perm.key} className="flex items-start justify-between p-3 bg-slate-900/50 rounded-lg">
                        <div className="flex-1">
                          <Label className="text-white text-sm font-semibold">{perm.label}</Label>
                          <p className="text-xs text-slate-400">{perm.description}</p>
                        </div>
                        <Switch
                          checked={roleForm[perm.key]}
                          onCheckedChange={(checked) => setRoleForm({...roleForm, [perm.key]: checked})}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <Label className="text-white font-bold">Active Role</Label>
                  <Switch
                    checked={roleForm.is_active}
                    onCheckedChange={(checked) => setRoleForm({...roleForm, is_active: checked})}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold">Role</TableHead>
                <TableHead className="text-slate-400 font-bold">Priority</TableHead>
                <TableHead className="text-slate-400 font-bold">Permissions</TableHead>
                <TableHead className="text-slate-400 font-bold">Status</TableHead>
                <TableHead className="text-slate-400 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const activePermissions = permissions.filter(p => role[p.key]).length;
                return (
                  <TableRow key={role.id} className="border-white/5">
                    <TableCell>
                      <div>
                        <p className="text-white font-semibold">{role.name}</p>
                        <p className="text-xs text-slate-400">{role.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-500">{role.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        {activePermissions} / {permissions.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={role.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(role)}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRoleMutation.mutate(role.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}