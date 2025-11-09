import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User, Users, Search, Shield, Crown, Ban, Mail, Calendar,
  TrendingUp, Activity, Eye, Edit, UserPlus, Filter, MoreVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const totalUsers = users.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">User Management</h2>
          <p className="text-slate-400 font-semibold">Manage users, roles, and permissions</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalUsers}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{adminCount}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{adminCount}</p>
            <p className="text-slate-400 text-sm font-semibold">Admins</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <User className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{userCount}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{userCount}</p>
            <p className="text-slate-400 text-sm font-semibold">Members</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {users.filter(u => {
                const created = new Date(u.created_date);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return created > weekAgo;
              }).length}
            </p>
            <p className="text-slate-400 text-sm font-semibold">New This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-md bg-[#1a1f3a] border border-slate-700 text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All Users ({totalUsers})
          </TabsTrigger>
          <TabsTrigger value="admins" className="data-[state=active]:bg-cyan-500">
            Admins ({adminCount})
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-cyan-500">
            Members ({userCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">User</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Email</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Role</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Joined</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Status</th>
                    <th className="text-right p-4 text-slate-400 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold">{user.full_name?.[0] || 'U'}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{user.full_name || 'Unnamed User'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 text-sm">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}>
                          {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(user.created_date), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-green-500">Active</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => handleEdit(user)} className="bg-cyan-500 hover:bg-cyan-600">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="border-slate-700">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                className="text-white hover:bg-slate-700"
                              >
                                {user.role === 'admin' ? (
                                  <>
                                    <User className="w-4 h-4 mr-2" />
                                    Make User
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Make Admin
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-slate-700">
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Admin</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Email</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Since</th>
                    <th className="text-right p-4 text-slate-400 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.filter(u => u.role === 'admin').map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-white font-semibold">{user.full_name}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-400">{format(new Date(user.created_date), 'MMM d, yyyy')}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                            Manage
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.filter(u => u.role === 'user').map((user) => (
              <Card key={user.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{user.full_name?.[0] || 'U'}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold">{user.full_name}</h4>
                      <p className="text-slate-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Joined</span>
                      <span className="text-white">{format(new Date(user.created_date), 'MMM yyyy')}</span>
                    </div>
                    <Button size="sm" onClick={() => handleEdit(user)} className="w-full bg-cyan-500 hover:bg-cyan-600">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
                  <h3 className="text-white font-bold text-lg">{editingUser.full_name}</h3>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}