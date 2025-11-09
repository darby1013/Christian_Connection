import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, MessageSquare, Calendar, Settings as SettingsIcon,
  UserPlus, UserMinus, Heart, Send, Pin, MoreVertical, Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function GroupDetail() {
  const [user, setUser] = useState(null);
  const [postContent, setPostContent] = useState("");
  const [isMember, setIsMember] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');
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

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const groups = await base44.entities.Group.filter({ id: groupId });
      return groups[0];
    },
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId, is_active: true }, '-joined_date'),
    enabled: !!groupId,
    initialData: [],
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', groupId],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: groupId }, '-created_date'),
    enabled: !!groupId,
    initialData: [],
  });

  useEffect(() => {
    if (user && members.length > 0) {
      setIsMember(members.some(m => m.user_id === user.id));
    }
  }, [user, members]);

  const joinGroupMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupMember.create({
        group_id: groupId,
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        user_image: user.profile_image,
        joined_date: new Date().toISOString()
      });
      
      return base44.entities.Group.update(groupId, {
        member_count: (group.member_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      setIsMember(true);
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const membership = members.find(m => m.user_id === user.id);
      if (membership) {
        await base44.entities.GroupMember.delete(membership.id);
      }
      
      return base44.entities.Group.update(groupId, {
        member_count: Math.max(0, (group.member_count || 0) - 1)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      setIsMember(false);
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.GroupPost.create({
      ...postData,
      group_id: groupId,
      author_id: user.id,
      author_name: user.full_name,
      author_image: user.profile_image
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId] });
      setPostContent("");
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId) => {
      const post = posts.find(p => p.id === postId);
      return base44.entities.GroupPost.update(postId, {
        likes: (post.likes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId] });
    },
  });

  const handlePost = () => {
    if (!postContent.trim()) return;
    createPostMutation.mutate({ content: postContent });
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading group...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Header Banner */}
      <div className="relative h-64 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
        {group.header_image && (
          <img src={group.header_image} alt={group.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Group Info Card */}
        <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 -mt-16 border-4 border-[#0a0e27]">
                {group.profile_image ? (
                  <img src={group.profile_image} alt={group.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Users className="w-12 h-12 text-white" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-3xl font-black text-white mb-2">{group.name}</h1>
                    <p className="text-slate-400 mb-3">{group.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge className={group.privacy === 'public' ? 'bg-green-500' : 'bg-amber-500'}>
                        {group.privacy}
                      </Badge>
                      {group.category && (
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                          {group.category}
                        </Badge>
                      )}
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.member_count || 0} members
                      </span>
                    </div>
                  </div>
                  
                  {user && (
                    <div className="flex items-center gap-2">
                      {!isMember ? (
                        <Button
                          onClick={() => joinGroupMutation.mutate()}
                          disabled={joinGroupMutation.isPending}
                          className="bg-cyan-500 hover:bg-cyan-600 font-bold"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join Group
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => leaveGroupMutation.mutate()}
                            disabled={leaveGroupMutation.isPending}
                            variant="outline"
                            className="border-slate-700"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Leave
                          </Button>
                          {group.creator_id === user.id && (
                            <Button variant="ghost" className="text-slate-400">
                              <SettingsIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="discussion" className="w-full">
              <TabsList className="bg-[#1a1f3a] border border-slate-700">
                <TabsTrigger value="discussion" className="data-[state=active]:bg-cyan-500">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discussion
                </TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-cyan-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="about" className="data-[state=active]:bg-cyan-500">
                  About
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussion" className="mt-6 space-y-6">
                {/* Post Creator */}
                {isMember && user && (
                  <Card className="bg-[#1a1f3a] border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-bold">
                            {user.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Share something with the group..."
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="bg-slate-900/50 border-slate-700 text-white mb-3"
                          />
                          <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" className="text-slate-400">
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Add Image
                            </Button>
                            <Button
                              onClick={handlePost}
                              disabled={createPostMutation.isPending || !postContent.trim()}
                              className="bg-cyan-500 hover:bg-cyan-600"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Posts Feed */}
                <div className="space-y-4">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-[#1a1f3a] border-slate-700">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={post.author_image} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-bold">
                                {post.author_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-bold">{post.author_name}</p>
                                  <p className="text-xs text-slate-500">
                                    {format(new Date(post.created_date), 'MMM d, yyyy • h:mm a')}
                                  </p>
                                </div>
                                {post.is_pinned && (
                                  <Badge className="bg-amber-500">
                                    <Pin className="w-3 h-3 mr-1" />
                                    Pinned
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <p className="text-slate-300 mb-4">{post.content}</p>
                          
                          {post.image_url && (
                            <img src={post.image_url} alt="Post" className="w-full rounded-lg mb-4" />
                          )}
                          
                          <div className="flex items-center gap-6 pt-3 border-t border-slate-700">
                            <button
                              onClick={() => likePostMutation.mutate(post.id)}
                              className="flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors"
                            >
                              <Heart className="w-5 h-5" />
                              <span className="text-sm">{post.likes || 0}</span>
                            </button>
                            <button className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                              <MessageSquare className="w-5 h-5" />
                              <span className="text-sm">{post.comments_count || 0}</span>
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {posts.length === 0 && (
                  <Card className="bg-[#1a1f3a] border-slate-700">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-white font-bold text-xl mb-2">No posts yet</h3>
                      <p className="text-slate-400">
                        {isMember ? "Be the first to share something!" : "Join the group to see posts"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-white font-bold text-xl mb-2">No upcoming events</h3>
                    <p className="text-slate-400">Group events will appear here</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6">
                    <h3 className="text-white font-bold text-xl mb-4">About This Group</h3>
                    <p className="text-slate-300 mb-6">{group.description}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Created by</p>
                        <p className="text-white font-semibold">{group.creator_name}</p>
                      </div>
                      
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Created</p>
                        <p className="text-white">{format(new Date(group.created_date), 'MMMM d, yyyy')}</p>
                      </div>
                      
                      {group.tags && group.tags.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-sm mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {group.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="border-cyan-500/30 text-cyan-400">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Members ({members.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.slice(0, 10).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.user_image} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-bold">
                          {member.user_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{member.user_name}</p>
                        {member.role !== 'member' && (
                          <Badge className="bg-amber-500 text-xs mt-1">{member.role}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {members.length > 10 && (
                  <Button variant="ghost" className="w-full mt-3 text-cyan-400">
                    View All Members
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}