import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart, MessageSquare, Share2, Clock, Eye, ArrowLeft,
  ThumbsUp, Reply, Pin
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function BlogPost() {
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  
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

  const { data: post, isLoading } = useQuery({
    queryKey: ['blogPost', postId],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ id: postId });
      if (posts[0]) {
        await base44.entities.BlogPost.update(postId, {
          views: (posts[0].views || 0) + 1
        });
      }
      return posts[0];
    },
    enabled: !!postId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['blogComments', postId],
    queryFn: () => base44.entities.BlogComment.filter({ post_id: postId }, '-created_date'),
    initialData: [],
    enabled: !!postId,
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['relatedPosts', post?.category],
    queryFn: () => base44.entities.BlogPost.filter({ 
      category: post.category,
      status: 'published' 
    }, '-published_date', 3),
    initialData: [],
    enabled: !!post?.category,
  });

  const likeMutation = useMutation({
    mutationFn: () => base44.entities.BlogPost.update(postId, {
      likes: (post.likes || 0) + 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPost'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (commentData) => base44.entities.BlogComment.create({
      ...commentData,
      post_id: postId,
      commenter_id: user.id,
      commenter_name: user.full_name,
      commenter_image: user.profile_image
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogComments'] });
      base44.entities.BlogPost.update(postId, {
        comments_count: (post.comments_count || 0) + 1
      });
      setCommentText('');
      setReplyTo(null);
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId) => {
      const comment = comments.find(c => c.id === commentId);
      return base44.entities.BlogComment.update(commentId, {
        likes: (comment.likes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogComments'] });
    },
  });

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate({
      comment_text: commentText,
      parent_comment_id: replyTo?.id
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      });
    }
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <p className="text-white">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 p-8">
          <p className="text-white">Post not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={createPageUrl("Blog")}>
          <Button variant="outline" className="border-slate-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Post Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
            <CardContent className="p-8">
              <Badge className="mb-4 bg-cyan-500">{post.category}</Badge>
              <h1 className="text-white font-black text-4xl mb-4">{post.title}</h1>
              
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-700">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-cyan-500/40">
                    <AvatarImage src={post.author_image} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                      {post.author_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-bold">{post.author_name}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(post.published_date), 'MMM d, yyyy')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views || 0} views
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likeMutation.mutate()}
                    className="text-slate-400 hover:text-pink-400"
                  >
                    <Heart className={`w-5 h-5 mr-1 ${post.likes > 0 ? 'fill-pink-400 text-pink-400' : ''}`} />
                    {post.likes || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-slate-400 hover:text-cyan-400"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Featured Image */}
              {post.featured_image && (
                <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Post Content */}
              <div 
                className="prose prose-invert prose-cyan max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Post Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-700">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-slate-700 text-slate-400">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
            <CardContent className="p-8">
              <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Comments ({comments.length})
              </h3>

              {/* Comment Form */}
              {user ? (
                <div className="mb-8">
                  {replyTo && (
                    <div className="flex items-center justify-between mb-3 p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-400">
                        Replying to <span className="text-cyan-400 font-semibold">{replyTo.commenter_name}</span>
                      </p>
                      <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white">
                        {user.full_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="bg-slate-900/50 border-slate-700 text-white mb-2"
                      />
                      <Button
                        onClick={handleComment}
                        disabled={commentMutation.isPending || !commentText.trim()}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        {commentMutation.isPending ? 'Posting...' : replyTo ? 'Reply' : 'Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="bg-slate-900/50 border-slate-700 mb-8">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-4">Sign in to join the conversation</p>
                    <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600">
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {topLevelComments.map((comment) => {
                  const replies = getReplies(comment.id);
                  
                  return (
                    <div key={comment.id}>
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={comment.commenter_image} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white">
                            {comment.commenter_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-slate-900/50 rounded-lg p-4 mb-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-white font-bold">{comment.commenter_name}</p>
                                <p className="text-xs text-slate-400">
                                  {format(new Date(comment.created_date), 'MMM d, yyyy @ h:mm a')}
                                </p>
                              </div>
                              {comment.is_pinned && (
                                <Badge className="bg-amber-500">
                                  <Pin className="w-3 h-3 mr-1" />
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-300">{comment.comment_text}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => likeCommentMutation.mutate(comment.id)}
                              className="text-slate-400 hover:text-pink-400 p-0 h-auto"
                            >
                              <ThumbsUp className={`w-4 h-4 mr-1 ${comment.likes > 0 ? 'fill-pink-400 text-pink-400' : ''}`} />
                              {comment.likes || 0}
                            </Button>
                            {user && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyTo(comment)}
                                className="text-slate-400 hover:text-cyan-400 p-0 h-auto"
                              >
                                <Reply className="w-4 h-4 mr-1" />
                                Reply
                              </Button>
                            )}
                          </div>

                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="mt-4 space-y-4 pl-6 border-l-2 border-slate-700">
                              {replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={reply.commenter_image} />
                                    <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-blue-500 text-white text-xs">
                                      {reply.commenter_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-slate-900/30 rounded-lg p-3 mb-2">
                                      <p className="text-white font-bold text-sm">{reply.commenter_name}</p>
                                      <p className="text-slate-300 text-sm">{reply.comment_text}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => likeCommentMutation.mutate(reply.id)}
                                      className="text-slate-400 hover:text-pink-400 p-0 h-auto text-xs"
                                    >
                                      <ThumbsUp className={`w-3 h-3 mr-1 ${reply.likes > 0 ? 'fill-pink-400 text-pink-400' : ''}`} />
                                      {reply.likes || 0}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">Related Posts</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.filter(p => p.id !== postId).slice(0, 3).map((relatedPost) => (
                    <Link key={relatedPost.id} to={createPageUrl(`BlogPost?id=${relatedPost.id}`)}>
                      <Card className="bg-slate-900/50 border-slate-700 hover:border-cyan-500 transition-all h-full">
                        <div className="relative aspect-video bg-slate-800">
                          <img
                            src={relatedPost.featured_image || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400'}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h4 className="text-white font-bold text-sm mb-2 line-clamp-2 hover:text-cyan-400 transition-colors">
                            {relatedPost.title}
                          </h4>
                          <p className="text-slate-400 text-xs">
                            {format(new Date(relatedPost.published_date), 'MMM d, yyyy')}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}