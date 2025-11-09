import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, Plus, Search, Lock, Globe, TrendingUp, Star, Crown
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

export default function Groups() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    privacy: 'public',
    category: '',
    tags: []
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
    initialData: [],
  });

  const createGroupMutation = useMutation({
    mutationFn: (groupData) => base44.entities.Group.create({
      ...groupData,
      creator_id: user.id,
      creator_name: user.full_name,
      creator_image: user.profile_image,
      member_count: 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setDialogOpen(false);
      setGroupForm({ name: '', description: '', privacy: 'public', category: '', tags: [] });
    },
  });

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!groupForm.name.trim()) {
      alert('Please enter a group name');
      return;
    }
    createGroupMutation.mutate(groupForm);
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Groups</h1>
            <p className="text-lg text-slate-400">Connect with communities that share your interests</p>
          </div>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Create New Group</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Build a community around shared interests and values
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label className="text-white mb-2 block">Group Name *</Label>
                    <Input
                      placeholder="e.g., Young Adults Fellowship"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Description</Label>
                    <Textarea
                      placeholder="What's this group about?"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white h-24"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Category</Label>
                      <Input
                        placeholder="e.g., Fellowship"
                        value={groupForm.category}
                        onChange={(e) => setGroupForm({...groupForm, category: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>
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
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createGroupMutation.isPending} className="bg-cyan-500 hover:bg-cyan-600">
                    {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search groups by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Groups</TabsTrigger>
            <TabsTrigger value="popular" className="data-[state=active]:bg-cyan-500">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="mygroups" className="data-[state=active]:bg-cyan-500">My Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
                  <div className="relative h-32 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-t-lg">
                    {group.header_image && (
                      <img src={group.header_image} alt={group.name} className="w-full h-full object-cover rounded-t-lg" />
                    )}
                    <Badge className={`absolute top-3 right-3 ${group.privacy === 'public' ? 'bg-green-500' : 'bg-amber-500'}`}>
                      {group.privacy === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                      {group.privacy}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        {group.profile_image ? (
                          <img src={group.profile_image} alt={group.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
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
                        {group.member_count || 0} members
                      </div>
                      <span className="text-slate-500 text-xs">by {group.creator_name}</span>
                    </div>
                    <Link to={createPageUrl(`GroupDetail?id=${group.id}`)}>
                      <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                        View Group
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...filteredGroups]
                .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
                .slice(0, 9)
                .map((group) => (
                  <Card key={group.id} className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1629] border-2 border-cyan-500/30">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{group.name}</h4>
                          <Badge className="bg-amber-500 text-white text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold">{group.member_count || 0} members</span>
                        <Link to={createPageUrl(`GroupDetail?id=${group.id}`)}>
                          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">Join</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="mygroups" className="mt-6">
            {user ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Join Your First Group</h3>
                <p className="text-slate-500 mb-6">Start connecting with communities that share your interests</p>
                <Button className="bg-cyan-500 hover:bg-cyan-600">Explore Groups</Button>
              </div>
            ) : (
              <div className="text-center py-20">
                <Lock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Sign In Required</h3>
                <p className="text-slate-500 mb-6">Please sign in to view your groups</p>
                <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600">
                  Sign In
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}