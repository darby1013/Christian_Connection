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
import {
  MessageSquare, Plus, Lock, Globe, Users, Crown, Shield,
  UserPlus, Settings as SettingsIcon, Search
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

export default function Chatrooms() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatroomForm, setChatroomForm] = useState({
    name: '',
    description: '',
    type: 'public',
    category: '',
    rules: '',
    max_members: 1000
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

  const { data: chatrooms = [] } = useQuery({
    queryKey: ['chatrooms'],
    queryFn: () => base44.entities.Chatroom.filter({ is_active: true }, '-created_date'),
    initialData: [],
  });

  const createChatroomMutation = useMutation({
    mutationFn: (chatroomData) => base44.entities.Chatroom.create({
      ...chatroomData,
      creator_id: user.id,
      creator_name: user.full_name,
      admins: [user.id],
      member_count: 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatrooms'] });
      setDialogOpen(false);
      setChatroomForm({ name: '', description: '', type: 'public', category: '', rules: '', max_members: 1000 });
    },
  });

  const filteredChatrooms = chatrooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!chatroomForm.name.trim()) {
      alert('Please enter a chatroom name');
      return;
    }
    createChatroomMutation.mutate(chatroomForm);
  };

  const publicRooms = filteredChatrooms.filter(r => r.type === 'public');
  const privateRooms = filteredChatrooms.filter(r => r.type === 'private');

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Chatrooms</h1>
            <p className="text-lg text-slate-400">Real-time conversations on various topics</p>
          </div>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Chatroom
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Create Chatroom</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Start a new conversation space for your community
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label className="text-white mb-2 block">Chatroom Name *</Label>
                    <Input
                      placeholder="e.g., Prayer Warriors"
                      value={chatroomForm.name}
                      onChange={(e) => setChatroomForm({...chatroomForm, name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Description</Label>
                    <Textarea
                      placeholder="What's this chatroom about?"
                      value={chatroomForm.description}
                      onChange={(e) => setChatroomForm({...chatroomForm, description: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white h-20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Type</Label>
                      <select
                        value={chatroomForm.type}
                        onChange={(e) => setChatroomForm({...chatroomForm, type: e.target.value})}
                        className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="invite_only">Invite Only</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-white mb-2 block">Category</Label>
                      <Input
                        placeholder="e.g., Fellowship"
                        value={chatroomForm.category}
                        onChange={(e) => setChatroomForm({...chatroomForm, category: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Rules (Optional)</Label>
                    <Textarea
                      placeholder="Chat guidelines..."
                      value={chatroomForm.rules}
                      onChange={(e) => setChatroomForm({...chatroomForm, rules: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white h-20"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createChatroomMutation.isPending} className="bg-cyan-500 hover:bg-cyan-600">
                    {createChatroomMutation.isPending ? 'Creating...' : 'Create Chatroom'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search chatrooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-green-400" />
              Public Chatrooms
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicRooms.map((room) => (
                <Card key={room.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-green-500">
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{room.name}</h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{room.description}</p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="w-4 h-4" />
                        {room.member_count || 0}
                      </div>
                      {room.category && (
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                          {room.category}
                        </Badge>
                      )}
                    </div>
                    <Link to={createPageUrl(`ChatroomView?id=${room.id}`)}>
                      <Button className="w-full bg-green-500 hover:bg-green-600">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Chat
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {privateRooms.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-400" />
                Private Chatrooms
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {privateRooms.map((room) => (
                  <Card key={room.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-amber-500">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{room.name}</h3>
                      <p className="text-slate-300 text-sm mb-4">Members-only chatroom</p>
                      <Button className="w-full bg-amber-500 hover:bg-amber-600" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Request Access
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {!user && (
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 mt-12">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-white font-black text-2xl mb-3">Join the Conversation</h3>
              <p className="text-slate-300 mb-6">Sign in to create and join chatrooms</p>
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}