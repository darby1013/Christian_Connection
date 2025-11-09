import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tantml:react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Megaphone, Plus, ThumbsUp, MessageSquare, Eye, Pin,
  Star, AlertCircle, MessageCircle, Heart, Calendar
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
import { format } from "date-fns";

export default function CommunityBoard() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    category: 'discussion',
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

  const { data: posts = [] } = useQuery({
    queryKey: ['communityBoard'],
    queryFn: () => base44.entities.CommunityBoard.list('-created_date'),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.CommunityBoard.create({
      ...postData,
      author_id: user.id,
      author_name: user.full_name,
      visibility: 'public'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityBoard'] });
      setDialogOpen(false);
      setPostForm({ title: '', content: '', category: 'discussion', tags: [] });
    },
  });

  const handleSubmit = () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert('Please fill in all fields');
      return;
    }
    createPostMutation.mutate(postForm);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      announcement: Megaphone,
      question: AlertCircle,
      discussion: MessageCircle,
      prayer: Heart,
      testimony: Star,
      event: Calendar
    };
    return icons[category] || MessageCircle;
  };

  const getCategoryColor = (category) => {
    const colors = {
      announcement: "from-blue-500 to-cyan-500",
      question: "from-amber-500 to-orange-500",
      discussion: "from-purple-500 to-pink-500",
      prayer: "from-red-500 to-rose-500",
      testimony: "from-green-500 to-emerald-500",
      event: "from-indigo-500 to-blue-500"
    };
    return colors[category] || colors.discussion;
  };

  const pinnedPosts = posts.filter(p => p.is_pinned);
  const featuredPosts = posts.filter(p => p.is_featured && !p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned && !p.is_featured);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Community Board</h1>
            <p className="text-lg text-slate-400">Share announcements, questions, and updates</p>
          </div>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Create Board Post</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Share your message with the community
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label className="text-white mb-2 block">Title *</Label>
                    <Input
                      placeholder="Enter post title..."
                      value={postForm.title}
                      onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Content *</Label>
                    <Textarea
                      placeholder="What would you like to share?"
                      value={postForm.content}
                      onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white h-32"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({...postForm, category: e.target.value})}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                    >
                      <option value="announcement">📢 Announcement</option>
                      <option value="question">❓ Question</option>
                      <option value="discussion">💬 Discussion</option>
                      <option value="prayer">❤️ Prayer Request</option>
                      <option value="testimony">⭐ Testimony</option>
                      <option value="event">📅 Event</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createPostMutation.isPending} className="bg-cyan-500 hover:bg-cyan-600">
                    {createPostMutation.isPending ? 'Posting...' : 'Post to Board'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Posts</TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-cyan-500">Announcements</TabsTrigger>
            <TabsTrigger value="discussions" className="data-[state=active]:bg-cyan-500">Discussions</TabsTrigger>
            <TabsTrigger value="prayers" className="data-[state=active]:bg-cyan-500">Prayers</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            {pinnedPosts.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Pin className="w-5 h-5 text-amber-400" />
                  Pinned Posts
                </h3>
                <div className="space-y-3">
                  {pinnedPosts.map((post) => {
                    const CategoryIcon = getCategoryIcon(post.category);
                    return (
                      <Card key={post.id} className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(post.category)} flex items-center justify-center flex-shrink-0`}>
                              <CategoryIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-white font-bold text-xl mb-1">{post.title}</h4>
                                  <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <span>by {post.author_name}</span>
                                    <span>•</span>
                                    <span>{format(new Date(post.created_date), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-amber-500">
                                    <Pin className="w-3 h-3 mr-1" />
                                    Pinned
                                  </Badge>
                                  <Badge className="bg-purple-500 capitalize">{post.category}</Badge>
                                </div>
                              </div>
                              <p className="text-slate-300 mb-4">{post.content}</p>
                              <div className="flex items-center gap-6 text-slate-400 text-sm">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-4 h-4" />
                                  {post.likes || 0}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  {post.comments_count || 0}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {post.views || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {[...featuredPosts, ...regularPosts].map((post) => {
                const CategoryIcon = getCategoryIcon(post.category);
                return (
                  <Card key={post.id} className={`bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all ${post.is_featured ? 'border-l-4 border-l-cyan-500' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryColor(post.category)} flex items-center justify-center flex-shrink-0`}>
                          <CategoryIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-white font-bold text-lg mb-1">{post.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>{post.author_name}</span>
                                <span>•</span>
                                <span>{format(new Date(post.created_date), 'MMM d')}</span>
                              </div>
                            </div>
                            <Badge className={`capitalize ${post.is_featured ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                              {post.is_featured && <Star className="w-3 h-3 mr-1" />}
                              {post.category}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-6 text-slate-500 text-sm">
                            <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                              <ThumbsUp className="w-4 h-4" />
                              {post.likes || 0}
                            </button>
                            <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              {post.comments_count || 0}
                            </button>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {post.views || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="mt-6 space-y-3">
            {posts.filter(p => p.category === 'announcement').map((post) => (
              <Card key={post.id} className="bg-[#1a1f3a] border-slate-700 border-l-4 border-l-blue-500">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">{post.title}</h4>
                      <p className="text-slate-400 text-sm">{post.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="discussions" className="mt-6 space-y-3">
            {posts.filter(p => p.category === 'discussion').map((post) => (
              <Card key={post.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <h4 className="text-white font-bold mb-2">{post.title}</h4>
                  <p className="text-slate-400 text-sm mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-slate-500 text-sm">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {post.comments_count || 0} replies
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="prayers" className="mt-6 space-y-3">
            {posts.filter(p => p.category === 'prayer').map((post) => (
              <Card key={post.id} className="bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 border-pink-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-pink-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">{post.title}</h4>
                      <p className="text-slate-300 text-sm mb-2">{post.content}</p>
                      <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                        <Heart className="w-4 h-4 mr-2" />
                        Pray
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}