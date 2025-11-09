import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, AlertTriangle, Ban, Trash2, Mail, Users,
  Search, AlertCircle, Clock, CheckCircle
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

export default function AdminGroupManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningForm, setWarningForm] = useState({
    warning_type: 'content_violation',
    severity: 'medium',
    message: '',
    action_required: ''
  });

  const queryClient = useQueryClient();

  const { data: allGroups = [] } = useQuery({
    queryKey: ['adminAllGroups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
    initialData: [],
  });

  const { data: warnings = [] } = useQuery({
    queryKey: ['groupWarnings'],
    queryFn: () => base44.entities.GroupWarning.list('-created_date'),
    initialData: [],
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['allGroupMembers'],
    queryFn: () => base44.entities.GroupMember.list(),
    initialData: [],
  });

  const sendWarningMutation = useMutation({
    mutationFn: async (warningData) => {
      const group = allGroups.find(g => g.id === selectedGroup);
      
      // Create warning record
      const warning = await base44.entities.GroupWarning.create({
        group_id: selectedGroup,
        group_name: group.name,
        admin_id: group.creator_id,
        admin_email: group.creator_email || 'admin@group.com',
        admin_name: group.creator_name,
        ...warningData,
        issued_by: 'site_admin',
        issued_by_name: 'Site Administrator'
      });

      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: group.creator_email || 'admin@group.com',
        subject: `⚠️ Warning: ${group.name} - Action Required`,
        body: `
          <h2>Group Warning Notice</h2>
          <p>Dear ${group.creator_name},</p>
          
          <p>Your group "<strong>${group.name}</strong>" has received a ${warningData.severity} severity warning.</p>
          
          <h3>Warning Details:</h3>
          <ul>
            <li><strong>Type:</strong> ${warningData.warning_type}</li>
            <li><strong>Severity:</strong> ${warningData.severity}</li>
            <li><strong>Message:</strong> ${warningData.message}</li>
          </ul>
          
          <h3>Action Required:</h3>
          <p>${warningData.action_required}</p>
          
          <p>Please address this issue promptly to avoid further action.</p>
          
          <p>Best regards,<br>Site Administration Team</p>
        `
      });

      // Create notification
      await base44.entities.Notification.create({
        user_id: group.creator_id,
        type: 'content_violation',
        title: 'Group Warning Received',
        message: `Your group "${group.name}" has received a ${warningData.severity} warning. Please review immediately.`,
        link: `/groups/${selectedGroup}`,
        priority: warningData.severity === 'critical' ? 'urgent' : 'high'
      });

      return warning;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupWarnings'] });
      setWarningDialogOpen(false);
      setWarningForm({ warning_type: 'content_violation', severity: 'medium', message: '', action_required: '' });
    },
  });

  const banGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      const group = allGroups.find(g => g.id === groupId);
      
      // Update group status (you might want to add an is_banned field)
      await base44.entities.Group.update(groupId, {
        privacy: 'private',
        description: `[BANNED] ${group.description}`
      });

      // Notify admin
      await base44.integrations.Core.SendEmail({
        to: group.creator_email || 'admin@group.com',
        subject: `🚫 Your Group Has Been Banned`,
        body: `
          <h2>Group Banned</h2>
          <p>Your group "${group.name}" has been permanently banned due to violation of community guidelines.</p>
          <p>If you believe this is an error, please contact support.</p>
        `
      });

      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllGroups'] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      const group = allGroups.find(g => g.id === groupId);
      
      // Send final notification
      await base44.integrations.Core.SendEmail({
        to: group.creator_email || 'admin@group.com',
        subject: `Group Deleted: ${group.name}`,
        body: `
          <h2>Group Deletion Notice</h2>
          <p>Your group "${group.name}" has been permanently deleted by site administrators.</p>
          <p>This action cannot be undone.</p>
        `
      });

      // Delete the group
      await base44.entities.Group.delete(groupId);
      
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllGroups'] });
    },
  });

  const filteredGroups = allGroups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.creator_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupMemberCount = (groupId) => {
    return groupMembers.filter(m => m.group_id === groupId).length;
  };

  const getGroupWarnings = (groupId) => {
    return warnings.filter(w => w.group_id === groupId);
  };

  const handleSendWarning = () => {
    if (!warningForm.message.trim()) {
      alert('Please enter a warning message');
      return;
    }
    sendWarningMutation.mutate(warningForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Group Management</h2>
        <p className="text-slate-400 font-semibold">Monitor and moderate all community groups</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Total Groups</p>
                <p className="text-3xl font-black text-white">{allGroups.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Active Warnings</p>
                <p className="text-3xl font-black text-white">
                  {warnings.filter(w => !w.is_resolved).length}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Critical Issues</p>
                <p className="text-3xl font-black text-white">
                  {warnings.filter(w => w.severity === 'critical' && !w.is_resolved).length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Resolved</p>
                <p className="text-3xl font-black text-white">
                  {warnings.filter(w => w.is_resolved).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search groups by name or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const groupWarnings = getGroupWarnings(group.id);
          const activeWarnings = groupWarnings.filter(w => !w.is_resolved);
          const memberCount = getGroupMemberCount(group.id);
          
          return (
            <Card key={group.id} className={`bg-[#1a1f3a] border-slate-700 ${
              activeWarnings.length > 0 ? 'border-l-4 border-l-amber-500' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-bold text-lg">{group.name}</h4>
                        <p className="text-slate-400 text-sm">Created by {group.creator_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="capitalize bg-slate-700">{group.privacy}</Badge>
                        {activeWarnings.length > 0 && (
                          <Badge className="bg-amber-500">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {activeWarnings.length} warnings
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-4">{group.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <span>{memberCount} members</span>
                      <span>•</span>
                      <span>{format(new Date(group.created_date), 'MMM d, yyyy')}</span>
                      {groupWarnings.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400">{groupWarnings.length} total warnings</span>
                        </>
                      )}
                    </div>

                    {/* Recent Warnings */}
                    {activeWarnings.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                        <p className="text-amber-300 font-semibold text-sm mb-2">Active Warnings:</p>
                        {activeWarnings.slice(0, 2).map((warning) => (
                          <div key={warning.id} className="text-sm text-slate-300 mb-1">
                            • {warning.warning_type} - {warning.severity} severity
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group.id);
                          setWarningDialogOpen(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Send Warning
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Ban this group? This will restrict all access.')) {
                            banGroupMutation.mutate(group.id);
                          }
                        }}
                        disabled={banGroupMutation.isPending}
                        className="border-red-500 text-red-400 hover:bg-red-500/20"
                      >
                        <Ban className="w-3 h-3 mr-1" />
                        Ban Group
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Permanently delete this group? This cannot be undone.')) {
                            deleteGroupMutation.mutate(group.id);
                          }
                        }}
                        disabled={deleteGroupMutation.isPending}
                        className="border-red-700 text-red-500 hover:bg-red-700/20"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Send Warning Dialog */}
      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              Send Group Warning
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will notify the group admin via email and platform notification
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Warning Type</Label>
                <select
                  value={warningForm.warning_type}
                  onChange={(e) => setWarningForm({...warningForm, warning_type: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                >
                  <option value="content_violation">Content Violation</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Severity</Label>
                <select
                  value={warningForm.severity}
                  onChange={(e) => setWarningForm({...warningForm, severity: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-white mb-2 block">Warning Message *</Label>
              <Textarea
                placeholder="Describe the issue..."
                value={warningForm.message}
                onChange={(e) => setWarningForm({...warningForm, message: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white h-24"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Action Required</Label>
              <Textarea
                placeholder="What should the admin do to resolve this?"
                value={warningForm.action_required}
                onChange={(e) => setWarningForm({...warningForm, action_required: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white h-20"
              />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-amber-300 font-semibold mb-1">Email & Notification</p>
                  <p className="text-slate-300 text-sm">
                    The group admin will receive both an email and in-app notification
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleSendWarning}
              disabled={sendWarningMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {sendWarningMutation.isPending ? 'Sending...' : 'Send Warning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}