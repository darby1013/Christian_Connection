import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Plus, Search, TrendingUp, Eye, Edit, Trash2,
  Pin, Lock, MessageCircle, ThumbsUp, Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminForum() {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);

  const queryClient = useQueryClient();

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

  const updateThreadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ForumThread.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (id) => base44.entities.ForumThread.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const togglePin = (thread) => {
    updateThreadMutation.mutate({
      id: thread.id,
      data: { is_pinned: !thread.is_pinned }
    });
  };

  const toggleLock = (thread) => {
    updateThreadMutation.mutate({
      id: thread.id,
      data: { is_locked: !thread.is_locked }
    });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this thread?')) {
      deleteThreadMutation.mutate(id);
    }
  };

  const viewDetails = (thread) => {
    setSelectedThread(thread);
    setDetailDialogOpen(true);
  };

  const filteredThreads = threads.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getThreadReplies = (threadId) => {
    return replies.filter(r => r.thread_id === threadId);
  };

  const totalReplies = replies.length;
  const pinnedThreads = threads.filter(t => t.is_pinned).length;
  const totalViews = threads.reduce((sum, t) => sum + (t.view_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Forum Management</h2>
          <p className="text-slate-400 font-semibold">Moderate discussions and threads</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500">{threads.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{threads.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Threads</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalReplies}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Replies</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalViews.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Views</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Pin className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{pinnedThreads}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{pinnedThreads}</p>
            <p className="text-slate-400 text-sm font-semibold">Pinned</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search threads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Thread</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Author</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Replies</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Views</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Date</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Status</th>
                <th className="text-right p-4 text-slate-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredThreads.map((thread) => {
                const threadReplies = getThreadReplies(thread.id);
                
                return (
                  <tr key={thread.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="flex items-start gap-2">
                        {thread.is_pinned && <Pin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />}
                        {thread.is_locked && <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />}
                        <div>
                          <p className="text-white font-semibold">{thread.title}</p>
                          {thread.category && (
                            <Badge className="bg-purple-500 text-xs mt-1">{thread.category}</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-300">{thread.author_name}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white font-semibold">{threadReplies.length}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span className="text-white">{thread.view_count || 0}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-400 text-sm">
                        {format(new Date(thread.created_date), 'MMM d, yyyy')}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {thread.is_pinned && <Badge className="bg-amber-500 text-xs">Pinned</Badge>}
                        {thread.is_locked && <Badge className="bg-red-500 text-xs">Locked</Badge>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => togglePin(thread)}
                          className={thread.is_pinned ? "bg-amber-500" : "bg-slate-700"}
                        >
                          <Pin className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => toggleLock(thread)}
                          className={thread.is_locked ? "bg-red-500" : "bg-slate-700"}
                        >
                          <Lock className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => viewDetails(thread)}
                          className="bg-cyan-500 hover:bg-cyan-600"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(thread.id)}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">Thread Details</DialogTitle>
          </DialogHeader>
          {selectedThread && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <h3 className="text-white font-bold text-lg mb-2">{selectedThread.title}</h3>
                <p className="text-slate-300 mb-3">{selectedThread.content}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400">by {selectedThread.author_name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">
                    {format(new Date(selectedThread.created_date), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-900/50 rounded-lg text-center">
                  <p className="text-slate-400 text-sm mb-1">Replies</p>
                  <p className="text-white font-bold text-xl">{getThreadReplies(selectedThread.id).length}</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg text-center">
                  <p className="text-slate-400 text-sm mb-1">Views</p>
                  <p className="text-white font-bold text-xl">{selectedThread.view_count || 0}</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg text-center">
                  <p className="text-slate-400 text-sm mb-1">Category</p>
                  <Badge className="bg-purple-500">{selectedThread.category || 'General'}</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-3">Recent Replies ({getThreadReplies(selectedThread.id).length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getThreadReplies(selectedThread.id).slice(0, 5).map((reply) => (
                    <div key={reply.id} className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">{reply.author_name}</span>
                        <span className="text-slate-500 text-xs">
                          {format(new Date(reply.created_date), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{reply.reply_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}