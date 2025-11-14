import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Users, Eye, Edit3, Save, Clock, Activity, CheckCircle,
  AlertCircle, Lock, Unlock, RefreshCw, UserCheck
} from "lucide-react";

const USER_COLORS = [
  '#22d3ee', '#a855f7', '#ec4899', '#f59e0b', '#10b981', 
  '#6366f1', '#f97316', '#14b8a6', '#8b5cf6', '#06b6d4'
];

export default function RealtimeBlogEditor({ postId, user }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [myColor, setMyColor] = useState(USER_COLORS[0]);
  const autoSaveTimer = useRef(null);

  const queryClient = useQueryClient();

  // Fetch blog post
  const { data: post } = useQuery({
    queryKey: ['blogPost', postId],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId
  });

  // Fetch collaboration session
  const { data: session } = useQuery({
    queryKey: ['collaborationSession', postId],
    queryFn: async () => {
      const sessions = await base44.entities.CollaborationSession.filter({
        entity_type: 'BlogPost',
        entity_id: postId,
        is_active: true
      });
      return sessions[0];
    },
    enabled: !!postId,
    refetchInterval: 3000, // Poll every 3 seconds for active users
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
    }
  }, [post]);

  useEffect(() => {
    if (session) {
      setSessionId(session.id);
      setActiveUsers(session.active_users || []);
    }
  }, [session]);

  // Join collaboration session
  useEffect(() => {
    if (!postId || !user) return;

    const joinSession = async () => {
      const userColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      setMyColor(userColor);

      try {
        const existingSessions = await base44.entities.CollaborationSession.filter({
          entity_type: 'BlogPost',
          entity_id: postId,
          is_active: true
        });

        const currentUsers = [{
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          user_image: user.profile_image,
          last_active: new Date().toISOString(),
          color: userColor
        }];

        if (existingSessions.length > 0) {
          const session = existingSessions[0];
          const otherUsers = (session.active_users || []).filter(u => u.user_id !== user.id);
          const updatedUsers = [...otherUsers, currentUsers[0]];

          await base44.entities.CollaborationSession.update(session.id, {
            active_users: updatedUsers,
            last_sync: new Date().toISOString()
          });
          setSessionId(session.id);
        } else {
          const newSession = await base44.entities.CollaborationSession.create({
            entity_type: 'BlogPost',
            entity_id: postId,
            entity_title: post?.title || 'Untitled',
            active_users: currentUsers,
            is_active: true,
            last_sync: new Date().toISOString()
          });
          setSessionId(newSession.id);
        }
      } catch (error) {
        console.error('Error joining session:', error);
      }
    };

    joinSession();

    // Update presence every 10 seconds
    const presenceInterval = setInterval(async () => {
      if (sessionId) {
        try {
          const sessions = await base44.entities.CollaborationSession.filter({ id: sessionId });
          if (sessions[0]) {
            const otherUsers = (sessions[0].active_users || []).filter(u => u.user_id !== user.id);
            const updatedUsers = [...otherUsers, {
              user_id: user.id,
              user_name: user.full_name,
              user_email: user.email,
              user_image: user.profile_image,
              last_active: new Date().toISOString(),
              color: myColor
            }];

            await base44.entities.CollaborationSession.update(sessionId, {
              active_users: updatedUsers,
              last_sync: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Presence update error:', error);
        }
      }
    }, 10000);

    return () => clearInterval(presenceInterval);
  }, [postId, user, sessionId, myColor]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.BlogPost.update(postId, data);
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['blogPost', postId] });
    },
  });

  const handleContentChange = (value) => {
    setContent(value);
    setHasUnsavedChanges(true);

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      saveMutation.mutate({ content: value });
    }, 2000);
  };

  const handleTitleChange = (value) => {
    setTitle(value);
    setHasUnsavedChanges(true);
  };

  const handleManualSave = () => {
    saveMutation.mutate({ title, content });
  };

  const otherUsers = activeUsers.filter(u => u.user_id !== user?.id);

  return (
    <div className="space-y-4">
      {/* Collaboration Bar */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white font-bold text-sm">Live Collaboration Active</p>
                <p className="text-slate-400 text-xs">
                  {otherUsers.length === 0 ? 'You are editing alone' : `${otherUsers.length + 1} user${otherUsers.length > 0 ? 's' : ''} editing`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Active Users */}
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.user_id}
                    className="relative"
                    style={{ zIndex: activeUsers.length - idx }}
                  >
                    <Avatar className="w-8 h-8 border-2" style={{ borderColor: u.color }}>
                      <AvatarImage src={u.user_image} />
                      <AvatarFallback style={{ backgroundColor: u.color }} className="text-white text-xs font-bold">
                        {u.user_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {u.user_id === user?.id && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1f3a]"></div>
                    )}
                  </div>
                ))}
                {activeUsers.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+{activeUsers.length - 5}</span>
                  </div>
                )}
              </div>

              {/* Save Status */}
              <div className="flex items-center gap-2">
                {hasUnsavedChanges ? (
                  <Badge className="bg-amber-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Unsaved
                  </Badge>
                ) : lastSaved ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Saved
                  </Badge>
                ) : null}
                
                <Button
                  onClick={handleManualSave}
                  disabled={!hasUnsavedChanges || saveMutation.isPending}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* Other Users List */}
          {otherUsers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-500/30">
              <div className="flex flex-wrap gap-2">
                {otherUsers.map(u => (
                  <div
                    key={u.user_id}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50"
                    style={{ borderLeft: `3px solid ${u.color}` }}
                  >
                    <UserCheck className="w-3 h-3" style={{ color: u.color }} />
                    <span className="text-white text-xs font-medium">{u.user_name}</span>
                    <Badge className="bg-green-500/20 text-green-300 text-xs">editing</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post Title..."
            className="bg-slate-900 border-slate-700 text-white text-2xl font-bold"
          />
        </CardHeader>
        <CardContent className="p-0">
          <ReactQuill
            value={content}
            onChange={handleContentChange}
            theme="snow"
            className="bg-slate-900 text-white min-h-[400px]"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image'],
                ['clean']
              ],
            }}
          />
        </CardContent>
      </Card>

      {lastSaved && (
        <p className="text-slate-400 text-xs text-center">
          Last saved: {lastSaved.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}