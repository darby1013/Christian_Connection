import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { Mail, Plus, Send, Sparkles, Edit, Trash2, BarChart3 } from 'lucide-react';

export default function AdminEmailMarketing() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    segment: 'all',
    scheduled_at: ''
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['emailCampaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date'),
    initialData: []
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const { data: personalizations = [] } = useQuery({
    queryKey: ['personalizations'],
    queryFn: () => base44.entities.UserPersonalization.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailCampaigns']);
      setShowDialog(false);
      resetForm();
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaign) => {
      let targetUsers = users;
      
      if (campaign.segment !== 'all') {
        const segmentedUsers = personalizations
          .filter(p => p.segment === campaign.segment)
          .map(p => p.user_id);
        targetUsers = users.filter(u => segmentedUsers.includes(u.id));
      }

      await Promise.all(targetUsers.map(user =>
        base44.integrations.Core.SendEmail({
          to: user.email,
          subject: campaign.subject,
          body: campaign.body
        })
      ));

      await base44.entities.EmailCampaign.update(campaign.id, {
        status: 'sent',
        sent_count: targetUsers.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailCampaigns']);
      alert('✅ Campaign sent!');
    }
  });

  const generateAICampaign = async () => {
    setGeneratingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a compelling email marketing campaign for an e-commerce store.
Segment: ${form.segment}
Campaign type: ${form.name || 'Product promotion'}

Generate:
1. Attention-grabbing subject line (50 chars max)
2. Personalized email body (300 words max) with strong CTA
3. Include product recommendations and urgency elements

Format as professional HTML email.`,
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' }
          }
        }
      });

      setForm({
        ...form,
        subject: result.subject,
        body: result.body,
        ai_generated: true
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      subject: '',
      body: '',
      segment: 'all',
      scheduled_at: ''
    });
    setEditingCampaign(null);
  };

  const segmentCounts = {
    all: users.length,
    vip: personalizations.filter(p => p.segment === 'vip').length,
    frequent: personalizations.filter(p => p.segment === 'frequent').length,
    occasional: personalizations.filter(p => p.segment === 'occasional').length,
    new: personalizations.filter(p => p.segment === 'new').length
  };

  const columns = [
    { header: 'Campaign', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Subject', key: 'subject', render: (val) => <span className="text-slate-300">{val}</span> },
    { header: 'Segment', key: 'segment', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Sent', key: 'sent_count', render: (val) => <span className="text-green-400">{val || 0}</span> },
    { header: 'Opens', key: 'opened_count', render: (val) => <span className="text-cyan-400">{val || 0}</span> },
    { header: 'Status', key: 'status', render: (val) => <Badge className={val === 'sent' ? 'bg-green-500' : 'bg-amber-500'}>{val}</Badge> }
  ];

  const performanceData = [
    { name: 'Sent', value: campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0) },
    { name: 'Opened', value: campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0) },
    { name: 'Clicked', value: campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0) },
    { name: 'Converted', value: campaigns.reduce((sum, c) => sum + (c.conversion_count || 0), 0) }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Email Marketing"
        subtitle="Automated personalized campaigns for customer segments"
        icon={Mail}
        badge="AI POWERED"
        actions={[
          { label: 'Create Campaign', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{campaigns.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Campaigns</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{campaigns.filter(c => c.status === 'sent').length}</p>
            <p className="text-green-300 text-sm font-bold">Sent</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              {campaigns.length > 0 
                ? Math.round((campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0) / campaigns.reduce((sum, c) => sum + (c.sent_count || 1), 0)) * 100)
                : 0}%
            </p>
            <p className="text-purple-300 text-sm font-bold">Open Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{campaigns.reduce((sum, c) => sum + (c.conversion_count || 0), 0)}</p>
            <p className="text-amber-300 text-sm font-bold">Conversions</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseChart
        title="Campaign Performance"
        type="bar"
        data={performanceData}
        dataKey="value"
        xKey="name"
        icon={BarChart3}
        colors={['primary']}
      />

      <EnterpriseTable
        columns={columns}
        data={campaigns}
        actions={[
          { label: 'Send Now', icon: Send, onClick: (c) => {
            if (confirm(`Send to ${segmentCounts[c.segment]} users?`)) sendCampaignMutation.mutate(c);
          }},
          { label: 'Delete', icon: Trash2, onClick: (c) => {
            if (confirm('Delete campaign?')) base44.entities.EmailCampaign.delete(c.id).then(() => queryClient.invalidateQueries(['emailCampaigns']));
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Create Email Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Campaign Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Target Segment</Label>
                <Select value={form.segment} onValueChange={(val) => setForm({...form, segment: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Users ({segmentCounts.all})</SelectItem>
                    <SelectItem value="vip">VIP ({segmentCounts.vip})</SelectItem>
                    <SelectItem value="frequent">Frequent ({segmentCounts.frequent})</SelectItem>
                    <SelectItem value="occasional">Occasional ({segmentCounts.occasional})</SelectItem>
                    <SelectItem value="new">New ({segmentCounts.new})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white">Subject Line *</Label>
                <Button size="sm" onClick={generateAICampaign} disabled={generatingAI} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Sparkles className="w-3 h-3 mr-2" />
                  {generatingAI ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              <Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>

            <div>
              <Label className="text-white">Email Body *</Label>
              <Textarea value={form.body} onChange={(e) => setForm({...form, body: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-64" />
            </div>

            <div>
              <Label className="text-white">Schedule (Optional)</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({...form, scheduled_at: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                Save Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}