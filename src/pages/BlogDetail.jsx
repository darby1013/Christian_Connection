import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart, MessageSquare, Share2, BookOpen, ArrowLeft,
  Eye, Calendar, ThumbsUp, Pin
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function BlogDetail() {
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

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
        // Increment view count
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

  const createCommentMutation = useMutation({
    mutationFn: (commentData) => base44.entities.BlogComment.create({
      ...commentData,
      post_id: postId,
      commenter_id: user.id,
      commenter_name: user.full_name,
      commenter_image: user.profile_image
    }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['blogComments'] });
      await base44.entities.BlogPost.update(postId, {
        comments_count: (post.comments_count || 0) + 1
      });
      queryClient.invalidateQueries({ queryKey: ['blogPost'] });
      setCommentText('');
      setReplyingTo(null);
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const comment = comments.find(c => c.id === commentId);
      return base44.entities.BlogComment.update(commentId, {
        likes: (comment.likes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogComments'] });
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate({
      comment_text: commentText,
      parent_comment_id: replyingTo?.id
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
        <p className="text-white">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 p-8">
          <p className="text-white">Article not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={createPageUrl("Blog")}>
          <Button variant="outline" className="border-slate-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Article Header */}
        <article>
          <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
            {post.featured_image && (
              <div className="relative aspect-video w-full">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                {post.category && (
                  <Badge className="bg-purple-500 capitalize">{post.category}</Badge>
                )}
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(post.published_date || post.created_date), 'MMMM d, yyyy')}
                </span>
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views || 0} views
                </span>
              </div>

              <h1 className="text-white font-black text-4xl mb-4">{post.title}</h1>
              
              {post.excerpt && (
                <p className="text-slate-300 text-xl mb-6">{post.excerpt}</p>
              )}

              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.author_image} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                      {post.author_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-bold">{post.author_name}</p>
                    <p className="text-slate-400 text-sm">Author</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => likeMutation.mutate()}
                    disabled={likeMutation.isPending}
                    className="border-slate-700"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {post.likes || 0}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="border-slate-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Article Content */}
              <div className="prose prose-invert prose-lg max-w-none mb-8">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 text-sm">Tags:</span>
                  {post.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="border-slate-600">
                      {tag}
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
                Comments ({post.comments_count || 0})
              </h3>

              {/* Comment Form */}
              {user ? (
                <div className="mb-8">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                        {user.full_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      {replyingTo && (
                        <div className="bg-slate-900/50 p-3 rounded-lg mb-2">
                          <p className="text-slate-400 text-sm mb-1">
                            Replying to <span className="text-cyan-400 font-semibold">{replyingTo.commenter_name}</span>
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                            className="text-slate-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="bg-slate-900/50 border-slate-700 text-white mb-3"
                        rows={3}
                      />
                      <Button
                        onClick={handleSubmitComment}
                        disabled={createCommentMutation.isPending || !commentText.trim()}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        {createCommentMutation.isPending ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="bg-slate-900/50 border-slate-700 mb-8">
                  <CardContent className="p-6 text-center">
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
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={comment.commenter_image} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                            {comment.commenter_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-white font-bold">{comment.commenter_name}</p>
                                <p className="text-slate-400 text-xs">
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
                            <p className="text-slate-300 whitespace-pre-wrap">{comment.comment_text}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => likeCommentMutation.mutate(comment.id)}
                              className="text-slate-400 hover:text-cyan-400"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {comment.likes || 0}
                            </Button>
                            {user && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(comment)}
                                className="text-slate-400 hover:text-cyan-400"
                              >
                                Reply
                              </Button>
                            )}
                          </div>

                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="ml-8 mt-4 space-y-4">
                              {replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={reply.commenter_image} />
                                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs">
                                      {reply.commenter_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                      <p className="text-white font-semibold text-sm mb-1">{reply.commenter_name}</p>
                                      <p className="text-slate-300 text-sm">{reply.comment_text}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => likeCommentMutation.mutate(reply.id)}
                                      className="text-slate-400 hover:text-cyan-400 mt-1"
                                    >
                                      <ThumbsUp className="w-3 h-3 mr-1" />
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
            <div>
              <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Related Articles
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.filter(p => p.id !== postId).map((relatedPost) => (
                  <Link key={relatedPost.id} to={createPageUrl(`BlogDetail?id=${relatedPost.id}`)}>
                    <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                      <div className="relative aspect-video">
                        <img
                          src={relatedPost.featured_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="text-white font-bold mb-2 line-clamp-2">{relatedPost.title}</h4>
                        <p className="text-slate-400 text-sm line-clamp-2">{relatedPost.excerpt}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}