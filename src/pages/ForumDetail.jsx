import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare, ThumbsUp, Pin, CheckCircle, ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ForumDetail() {
  const [user, setUser] = useState(null);
  const [replyText, setReplyText] = useState("");
  
  const urlParams = new URLSearchParams(window.location.search);
  const threadId = urlParams.get('id');
  
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

  const { data: thread, isLoading } = useQuery({
    queryKey: ['forumThread', threadId],
    queryFn: async () => {
      const threads = await base44.entities.ForumThread.filter({ id: threadId });
      if (threads[0]) {
        // Increment view count
        await base44.entities.ForumThread.update(threadId, {
          view_count: (threads[0].view_count || 0) + 1
        });
      }
      return threads[0];
    },
    enabled: !!threadId,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['threadReplies', threadId],
    queryFn: () => base44.entities.ForumReply.filter({ thread_id: threadId }, 'created_date'),
    initialData: [],
    enabled: !!threadId,
  });

  const createReplyMutation = useMutation({
    mutationFn: async (replyData) => {
      const reply = await base44.entities.ForumReply.create(replyData);
      
      // Update thread reply count and last reply date
      await base44.entities.ForumThread.update(threadId, {
        reply_count: (thread.reply_count || 0) + 1,
        last_reply_date: new Date().toISOString()
      });
      
      return reply;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadReplies'] });
      queryClient.invalidateQueries({ queryKey: ['forumThread'] });
      setReplyText("");
    },
  });

  const upvoteReplyMutation = useMutation({
    mutationFn: async (replyId) => {
      const reply = replies.find(r => r.id === replyId);
      return base44.entities.ForumReply.update(replyId, {
        upvotes: (reply.upvotes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadReplies'] });
    },
  });

  const markAsSolutionMutation = useMutation({
    mutationFn: async (replyId) => {
      return base44.entities.ForumReply.update(replyId, {
        is_solution: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadReplies'] });
    },
  });

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    
    createReplyMutation.mutate({
      thread_id: threadId,
      reply_text: replyText,
      author_id: user.id,
      author_name: user.full_name,
      author_image: user.profile_image
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 p-8">
          <p className="text-white">Thread not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={createPageUrl("Forum")}>
          <Button variant="outline" className="border-slate-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </Link>

        {/* Thread */}
        <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={thread.author_image} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
                  {thread.author_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-white font-black text-2xl mb-2">{thread.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="font-semibold text-white">{thread.author_name}</span>
                      <span>•</span>
                      <span>{format(new Date(thread.created_date), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span>{thread.view_count || 0} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="capitalize bg-purple-500">{thread.category}</Badge>
                    {thread.is_pinned && (
                      <Badge className="bg-amber-500">
                        <Pin className="w-3 h-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 text-lg whitespace-pre-wrap">{thread.content}</p>
            </div>
            
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-6">
                {thread.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-cyan-500/30 text-cyan-400">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="mb-6">
          <h3 className="text-white font-bold text-xl mb-4">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h3>
          
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card key={reply.id} className={`bg-[#1a1f3a] border-slate-700 ${
                reply.is_solution ? 'border-l-4 border-l-green-500' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={reply.author_image} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
                        {reply.author_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{reply.author_name}</span>
                          <span className="text-slate-400 text-sm">
                            {format(new Date(reply.created_date), 'MMM d, h:mm a')}
                          </span>
                          {reply.is_solution && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Solution
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => upvoteReplyMutation.mutate(reply.id)}
                            className="text-slate-400 hover:text-cyan-400"
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {reply.upvotes || 0}
                          </Button>
                          {user?.id === thread.author_id && !reply.is_solution && (
                            <Button
                              size="sm"
                              onClick={() => markAsSolutionMutation.mutate(reply.id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Mark as Solution
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-slate-300 whitespace-pre-wrap">{reply.reply_text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reply Form */}
        {user && !thread.is_locked ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-lg mb-4">Add Your Reply</h3>
              <Textarea
                placeholder="Share your thoughts..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white h-32 mb-4"
              />
              <Button
                onClick={handleSubmitReply}
                disabled={createReplyMutation.isPending || !replyText.trim()}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {createReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
              </Button>
            </CardContent>
          </Card>
        ) : thread.is_locked ? (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-6 text-center">
              <p className="text-red-400 font-semibold">This thread is locked and no longer accepting replies.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 mb-4">Sign in to join the discussion</p>
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600">
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}