import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Eye, Trash2,
  MessageSquare, Users, Flag, BarChart3, Sparkles
} from "lucide-react";

export default function AdminContentModeration() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: flags = [] } = useQuery({
    queryKey: ['contentFlags'],
    queryFn: () => base44.entities.ContentModeration.list('-created_date', 200),
    initialData: [],
  });

  const updateFlagMutation = useMutation({
    mutationFn: ({ id, status, action }) => 
      base44.entities.ContentModeration.update(id, {
        status,
        action_taken: action,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentFlags'] });
    },
  });

  const moderateContentMutation = useMutation({
    mutationFn: async ({ contentText }) => {
      const prompt = `Analyze this content for violations. Check for spam, hate speech, nudity references, harassment, violence, or misinformation:

"${contentText}"

Determine:
1. Is this content appropriate for a Christian community platform?
2. What specific violations exist (if any)?
3. Confidence score (0-1)
4. Recommended action`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            is_appropriate: { type: "boolean" },
            violations: { type: "array", items: { type: "string" } },
            primary_violation: { type: "string" },
            confidence_score: { type: "number" },
            reasoning: { type: "string" },
            recommended_action: { type: "string" }
          }
        }
      });

      return result;
    }
  });

  const pendingFlags = flags.filter(f => f.status === 'pending');
  const approvedFlags = flags.filter(f => f.status === 'approved');
  const removedFlags = flags.filter(f => f.status === 'removed');
  const dismissedFlags = flags.filter(f => f.status === 'dismissed');

  const flagReasons = {
    spam: { label: 'Spam', color: 'bg-yellow-500', icon: Flag },
    hate_speech: { label: 'Hate Speech', color: 'bg-red-500', icon: AlertTriangle },
    nudity: { label: 'Nudity', color: 'bg-pink-500', icon: Eye },
    harassment: { label: 'Harassment', color: 'bg-orange-500', icon: MessageSquare },
    violence: { label: 'Violence', color: 'bg-red-600', icon: AlertTriangle },
    misinformation: { label: 'Misinformation', color: 'bg-purple-500', icon: AlertTriangle },
    other: { label: 'Other', color: 'bg-gray-500', icon: Flag }
  };

  const handleApprove = (flagId) => {
    updateFlagMutation.mutate({ id: flagId, status: 'approved', action: 'Content approved as safe' });
  };

  const handleRemove = (flagId) => {
    updateFlagMutation.mutate({ id: flagId, status: 'removed', action: 'Content removed for violation' });
  };

  const handleDismiss = (flagId) => {
    updateFlagMutation.mutate({ id: flagId, status: 'dismissed', action: 'False positive - dismissed' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">AI Content Moderation</h2>
        <p className="text-slate-400 font-semibold">Automated content safety with AI-powered detection</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Pending Review</p>
                <p className="text-3xl font-black text-white mt-1">{pendingFlags.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Auto-Removed</p>
                <p className="text-3xl font-black text-white mt-1">
                  {flags.filter(f => f.is_auto_removed).length}
                </p>
              </div>
              <Shield className="w-10 h-10 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Approved</p>
                <p className="text-3xl font-black text-white mt-1">{approvedFlags.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Removed</p>
                <p className="text-3xl font-black text-white mt-1">{removedFlags.length}</p>
              </div>
              <Trash2 className="w-10 h-10 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-500">
            Pending ({pendingFlags.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-cyan-500">
            Approved ({approvedFlags.length})
          </TabsTrigger>
          <TabsTrigger value="removed" className="data-[state=active]:bg-cyan-500">
            Removed ({removedFlags.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-500">
            <BarChart3 className="w-4 h-4 mr-1" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Flagged Content Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingFlags.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-white font-bold text-lg">All Clear!</p>
                  <p className="text-slate-400">No content pending moderation</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-slate-400 font-bold">Content</TableHead>
                      <TableHead className="text-slate-400 font-bold">Type</TableHead>
                      <TableHead className="text-slate-400 font-bold">Author</TableHead>
                      <TableHead className="text-slate-400 font-bold">Violation</TableHead>
                      <TableHead className="text-slate-400 font-bold">Confidence</TableHead>
                      <TableHead className="text-slate-400 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFlags.map((flag) => {
                      const reason = flagReasons[flag.flag_reason] || flagReasons.other;
                      return (
                        <TableRow key={flag.id} className="border-white/5">
                          <TableCell className="max-w-md">
                            <p className="text-white text-sm line-clamp-2">{flag.content_text}</p>
                            {flag.ai_analysis && (
                              <p className="text-xs text-slate-400 mt-1 italic">{flag.ai_analysis}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300 capitalize">
                              {flag.content_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">{flag.author_name}</TableCell>
                          <TableCell>
                            <Badge className={reason.color}>
                              {reason.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              flag.confidence_score > 0.8 ? 'bg-red-500' :
                              flag.confidence_score > 0.5 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }>
                              {(flag.confidence_score * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(flag.id)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRemove(flag.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDismiss(flag.id)}
                                className="border-slate-700 text-slate-300"
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Violations by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(flagReasons).map(([key, reason]) => {
                    const count = flags.filter(f => f.flag_reason === key).length;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={reason.color}>{reason.label}</Badge>
                        </div>
                        <span className="text-white font-bold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Moderation Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-green-400 font-bold text-lg">
                      {flags.length > 0 ? ((flags.filter(f => f.is_auto_removed).length / flags.length) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-slate-300 text-sm">Auto-moderation rate</p>
                  </div>
                  <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <p className="text-cyan-400 font-bold text-lg">
                      {flags.filter(f => f.confidence_score > 0.8).length}
                    </p>
                    <p className="text-slate-300 text-sm">High confidence detections</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-purple-400 font-bold text-lg">
                      {flags.length > 0 ? ((dismissedFlags.length / flags.length) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-slate-300 text-sm">False positive rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs similar structure */}
        <TabsContent value="approved" className="mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Approved Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-center py-8">{approvedFlags.length} items approved and safe</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="removed" className="mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Removed Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-center py-8">{removedFlags.length} items removed for violations</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}