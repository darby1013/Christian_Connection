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
  MessageSquare, Plus, TrendingUp, Clock, Eye, Pin,
  Search, CheckCircle
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

export default function Forum() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [threadForm, setThreadForm] = useState({
    title: '',
    content: '',
    category: 'general'
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

  const { data: threads = [] } = useQuery({
    queryKey: ['forumThreads'],
    queryFn: () => base44.entities.ForumThread.list('-created_date'),
    initialData: [],
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['forumReplies'],
    queryFn: () => base44.entities.ForumReply.list(),
    initialData: [],
  });

  const createThreadMutation = useMutation({
    mutationFn: (threadData) => base44.entities.ForumThread.create({
      ...threadData,
      author_id: user.id,
      author_name: user.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
      setDialogOpen(false);
      setThreadForm({ title: '', content: '', category: 'general' });
    },
  });

  const handleSubmit = () => {
    if (!threadForm.title.trim() || !threadForm.content.trim()) {
      alert('Please fill in all fields');
      return;
    }
    createThreadMutation.mutate(threadForm);
  };

  const filteredThreads = threads.filter(thread =>
    thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getThreadReplies = (threadId) => {
    return replies.filter(r => r.thread_id === threadId).length;
  };

  const categories = ['general', 'prayer', 'theology', 'ministry', 'questions', 'testimonies'];
  const pinnedThreads = filteredThreads.filter(t => t.is_pinned);
  const regularThreads = filteredThreads.filter(t => !t.is_pinned);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Community Forum</h1>
            <p className="text-lg text-slate-400">Engage in discussions and get answers to your questions</p>
          </div>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  New Thread
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Create Discussion Thread</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Start a conversation with the community
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label className="text-white mb-2 block">Title *</Label>
                    <Input
                      placeholder="What's your question or topic?"
                      value={threadForm.title}
                      onChange={(e) => setThreadForm({...threadForm, title: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <select
                      value={threadForm.category}
                      onChange={(e) => setThreadForm({...threadForm, category: e.target.value})}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Content *</Label>
                    <Textarea
                      placeholder="Share your thoughts or ask your question..."
                      value={threadForm.content}
                      onChange={(e) => setThreadForm({...threadForm, content: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white h-32"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createThreadMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    {createThreadMutation.isPending ? 'Creating...' : 'Create Thread'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pinned Threads */}
        {pinnedThreads.length > 0 && (
          <div className="mb-8">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Pin className="w-5 h-5 text-amber-400" />
              Pinned Discussions
            </h3>
            <div className="space-y-3">
              {pinnedThreads.map((thread) => (
                <Link key={thread.id} to={createPageUrl(`ForumDetail?id=${thread.id}`)}>
                  <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 hover:border-amber-500 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-white font-bold text-lg">{thread.title}</h4>
                            <Badge className="bg-amber-500">
                              <Pin className="w-3 h-3 mr-1" />
                              Pinned
                            </Badge>
                          </div>
                          <p className="text-slate-300 text-sm mb-3 line-clamp-2">{thread.content}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>{thread.author_name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {getThreadReplies(thread.id)} replies
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {thread.view_count || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Threads */}
        <div className="space-y-3">
          {regularThreads.map((thread) => {
            const replyCount = getThreadReplies(thread.id);
            const hasReplies = replyCount > 0;
            
            return (
              <Link key={thread.id} to={createPageUrl(`ForumDetail?id=${thread.id}`)}>
                <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{thread.author_name?.[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-bold text-lg mb-1 hover:text-cyan-400 transition-colors">
                              {thread.title}
                            </h4>
                            <Badge className="capitalize bg-slate-700">{thread.category}</Badge>
                          </div>
                          {thread.is_locked && (
                            <Badge className="bg-red-500">Locked</Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{thread.content}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{thread.author_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {replyCount}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {thread.view_count || 0}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(thread.created_date), 'MMM d')}
                          </span>
                          {thread.last_reply_date && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">
                                Latest: {format(new Date(thread.last_reply_date), 'MMM d')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filteredThreads.length === 0 && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No discussions yet</h3>
              <p className="text-slate-400 mb-6">Be the first to start a conversation!</p>
              {user && (
                <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Thread
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}