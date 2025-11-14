
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  User,
  Users,
  Shield,
  UserPlus,
  Mail,
  Download,
  Edit,
  Trash2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

// New imports for refactored components
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseStats from '../components/admin/EnterpriseStats';
import EnterpriseTable from '../components/admin/EnterpriseTable';

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditingUser(null);
    },
  });

  const handleDeleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert("User deleted successfully!");
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleRoleChange = (userId, newRole) => {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateUserMutation.mutate({
        id: userId,
        data: { role: newRole }
      });
    }
  };

  const handleDelete = (userId) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      handleDeleteUserMutation.mutate(userId);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const newUsersThisWeekCount = users.filter(u => {
    const created = new Date(u.created_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return created > weekAgo;
  }).length;

  const stats = [
    { title: 'Total Users', value: users.length, icon: Users, color: 'cyan', trend: 'up', trendValue: '+12%' },
    { title: 'Active Today', value: Math.floor(users.length * 0.23), icon: Activity, color: 'green', trend: 'up', trendValue: '+5%' },
    { title: 'New This Week', value: newUsersThisWeekCount, icon: UserPlus, color: 'purple', trend: 'up', trendValue: '+18%' },
    { title: 'Admin Users', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'amber' },
  ];

  const columns = [
    {
      header: 'User',
      key: 'full_name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white">
            {val?.[0] || 'U'}
          </div>
          <div>
            <p className="font-bold text-white">{val || 'Unnamed User'}</p>
            <p className="text-slate-400 text-xs">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      key: 'role',
      render: (val) => (
        <Badge className={val === 'admin' ? 'bg-purple-500' : 'bg-slate-600'}>
          {val?.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Joined',
      key: 'created_date',
      render: (val) => format(new Date(val), 'MMM d, yyyy')
    },
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="User Management"
        subtitle={`${users.length} total users across the platform`}
        icon={Users}
        badge="ENTERPRISE"
        actions={[
          { label: 'Invite User', icon: UserPlus, onClick: () => { console.log('Invite User clicked'); } },
          { label: 'Export CSV', icon: Download, onClick: () => { console.log('Export CSV clicked'); } }
        ]}
      >
        {/* Placeholder for search/filter inputs if EnterpriseHeader doesn't encapsulate them */}
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 bg-[#1a1f3a] border-slate-700 text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 rounded-md bg-[#1a1f3a] border border-slate-700 text-white"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </EnterpriseHeader>

      <EnterpriseStats stats={stats} />

      <EnterpriseTable
        columns={columns}
        data={filteredUsers}
        onRowClick={(row) => handleEdit(row)}
        actions={[
          { label: 'View/Edit', icon: Edit, onClick: (row) => handleEdit(row) },
          { label: 'Delete', icon: Trash2, onClick: (row) => handleDelete(row.id) }
        ]}
      />

      {/* User Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">User Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              View and manage user information
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{editingUser.full_name?.[0] || 'U'}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{editingUser.full_name || 'Unnamed User'}</h3>
                  <p className="text-slate-400">{editingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Role</p>
                  <Badge className={editingUser.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}>
                    {editingUser.role}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Joined</p>
                  <p className="text-white font-semibold">
                    {format(new Date(editingUser.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  onClick={() => handleRoleChange(editingUser.id, editingUser.role === 'admin' ? 'user' : 'admin')}
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                >
                  {editingUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-white hover:bg-slate-700">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
