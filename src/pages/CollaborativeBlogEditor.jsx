import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RealtimeBlogEditor from "../components/collaboration/RealtimeBlogEditor";
import RealtimeActivityFeed from "../components/collaboration/RealtimeActivityFeed";
import { PermissionGuard } from "../components/permissions/PermissionGuard";
import {
  ArrowLeft, Users, Activity, FileText, Globe, Eye, Clock,
  CheckCircle, AlertCircle, Save, Zap, Crown
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CollaborativeBlogEditor() {
  const [user, setUser] = useState(null);
  const [postId, setPostId] = useState(null);
  const location = useLocation();

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

    // Get post ID from URL
    const params = new URLSearchParams(window.location.search);
    setPostId(params.get('postId'));
  }, []);

  const { data: post } = useQuery({
    queryKey: ['blogPost', postId],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] flex items-center justify-center p-4">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-white font-black text-2xl mb-2">Login Required</h2>
            <p className="text-slate-400 mb-6">Please log in to access the collaborative editor</p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!postId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] p-6">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-white font-black text-2xl mb-2">No Post Selected</h2>
            <p className="text-slate-400 mb-6">Please select a blog post to edit</p>
            <Link to={createPageUrl('AdminBlog')}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Go to Blog Manager
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard permission="edit_blog_posts">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link to={createPageUrl('AdminBlog')}>
              <Button variant="outline" className="border-slate-700 text-slate-300 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                  Collaborative Editor
                </h1>
                <p className="text-slate-400 font-semibold">
                  Real-time collaboration with live presence
                </p>
              </div>

              <div className="flex gap-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Enterprise Edition
                </Badge>
                {post?.status && (
                  <Badge className={post.status === 'published' ? 'bg-green-500' : 'bg-amber-500'}>
                    {post.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Editor */}
            <div className="lg:col-span-2">
              <RealtimeBlogEditor postId={postId} user={user} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <RealtimeActivityFeed groupId={postId} limit={15} />

              {/* Post Info */}
              {post && (
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700 pb-3">
                    <h4 className="text-white font-bold text-sm">Post Information</h4>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Author:</span>
                      <span className="text-white font-bold">{post.author_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Created:</span>
                      <span className="text-white">{new Date(post.created_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Updated:</span>
                      <span className="text-white">{new Date(post.updated_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Views:</span>
                      <span className="text-white font-bold">{post.views || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Likes:</span>
                      <span className="text-white font-bold">{post.likes || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Collaboration Tips */}
              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardHeader className="border-b border-blue-500/30 pb-3">
                  <h4 className="text-blue-300 font-bold text-sm">💡 Collaboration Tips</h4>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-blue-200 text-xs space-y-2">
                    <li>• See who's editing in real-time</li>
                    <li>• Auto-saves every 2 seconds</li>
                    <li>• Changes sync across all users</li>
                    <li>• Use chat for quick coordination</li>
                    <li>• View activity feed for updates</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}