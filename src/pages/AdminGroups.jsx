import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Users, Plus, Search, TrendingUp, Eye, Edit, Trash2,
  Lock, Globe, Crown, MessageSquare, Calendar, BarChart3
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

export default function AdminGroups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    privacy: 'public',
    category: '',
    header_image: '',
    profile_image: ''
  });

  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
    initialData: [],
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['groupMembers'],
    queryFn: () => base44.entities.GroupMember.list(),
    initialData: [],
  });

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.Group.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Group.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id) => base44.entities.Group.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const handleSubmit = () => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupForm });
    } else {
      createGroupMutation.mutate({ ...groupForm, member_count: 0 });
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setGroupForm(group);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this group?')) {
      deleteGroupMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setGroupForm({
      name: '',
      description: '',
      privacy: 'public',
      category: '',
      header_image: '',
      profile_image: ''
    });
    setEditingGroup(null);
  };

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);
  const publicGroups = groups.filter(g => g.privacy === 'public').length;
  const privateGroups = groups.filter(g => g.privacy === 'private').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Group Management</h2>
          <p className="text-slate-400 font-semibold">Manage community groups and members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Group Name *</Label>
                <Input
                  placeholder="Group name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  placeholder="Group description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Privacy</Label>
                  <select
                    value={groupForm.privacy}
                    onChange={(e) => setGroupForm({...groupForm, privacy: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Category</Label>
                  <Input
                    placeholder="e.g., Fellowship"
                    value={groupForm.category}
                    onChange={(e) => setGroupForm({...groupForm, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!groupForm.name} className="bg-cyan-500 hover:bg-cyan-600">
                {editingGroup ? 'Update' : 'Create'} Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{groups.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{groups.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Groups</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalMembers}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Members</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{publicGroups}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{publicGroups}</p>
            <p className="text-slate-400 text-sm font-semibold">Public</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{privateGroups}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{privateGroups}</p>
            <p className="text-slate-400 text-sm font-semibold">Private</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const memberCount = groupMembers.filter(m => m.group_id === group.id).length;
          
          return (
            <Card key={group.id} className="bg-[#1a1f3a] border-slate-700">
              <div className="relative h-32 bg-gradient-to-br from-purple-600 to-cyan-600">
                {group.header_image && (
                  <img src={group.header_image} alt={group.name} className="w-full h-full object-cover" />
                )}
                <Badge className={`absolute top-3 right-3 ${group.privacy === 'public' ? 'bg-green-500' : 'bg-amber-500'}`}>
                  {group.privacy === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                  {group.privacy}
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg mb-1 truncate">{group.name}</h3>
                    {group.category && (
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                        {group.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{group.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Users className="w-4 h-4" />
                    {group.member_count || memberCount} members
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(group)} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(group.id)}
                    className="border-red-500/30 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Groups</h3>
            <p className="text-slate-400 mb-6">Create your first community group</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}