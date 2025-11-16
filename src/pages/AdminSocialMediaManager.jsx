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
import { Share2, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';

export default function AdminSocialMediaManager() {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    platform: 'facebook',
    campaign_type: 'awareness',
    content: '',
    image_url: '',
    budget: '',
    start_date: '',
    end_date: '',
    status: 'draft'
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['socialCampaigns'],
    queryFn: () => base44.entities.SocialMediaCampaign.list('-created_date'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialMediaCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialCampaigns']);
      setShowDialog(false);
      resetForm();
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }
  });

  const resetForm = () => {
    setForm({
      name: '',
      platform: 'facebook',
      campaign_type: 'awareness',
      content: '',
      image_url: '',
      budget: '',
      start_date: '',
      end_date: '',
      status: 'draft'
    });
  };

  const handleImageUpload = async (file) => {
    const url = await uploadImageMutation.mutateAsync(file);
    setForm({...form, image_url: url});
  };

  const columns = [
    { header: 'Campaign', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Platform', key: 'platform', render: (val) => <Badge className="bg-blue-500">{val}</Badge> },
    { header: 'Type', key: 'campaign_type', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Impressions', key: 'impressions', render: (val) => <span className="text-cyan-400">{val || 0}</span> },
    { header: 'Clicks', key: 'clicks', render: (val) => <span className="text-green-400">{val || 0}</span> },
    { header: 'Status', key: 'status', render: (val) => <Badge className={val === 'active' ? 'bg-green-500' : 'bg-amber-500'}>{val}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Social Media Manager"
        subtitle="Multi-platform campaign management and analytics"
        icon={Share2}
        badge="MARKETING"
        actions={[
          { label: 'Create Campaign', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{campaigns.length}</p>
            <p className="text-blue-300 text-sm font-bold">Campaigns</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{campaigns.filter(c => c.status === 'active').length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0).toLocaleString()}</p>
            <p className="text-purple-300 text-sm font-bold">Impressions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)}</p>
            <p className="text-amber-300 text-sm font-bold">Conversions</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={campaigns}
        actions={[
          { label: 'Delete', icon: Trash2, onClick: (c) => {
            if (confirm('Delete campaign?')) base44.entities.SocialMediaCampaign.delete(c.id).then(() => queryClient.invalidateQueries(['socialCampaigns']));
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Create Social Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Campaign Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Platform</Label>
                <Select value={form.platform} onValueChange={(val) => setForm({...form, platform: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white">Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-32" />
            </div>

            <div>
              <Label className="text-white">Campaign Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="bg-slate-900 border-slate-700 text-white" />
              {form.image_url && <img src={form.image_url} alt="" className="w-full h-48 object-cover rounded mt-2" />}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Budget ($)</Label>
                <Input type="number" value={form.budget} onChange={(e) => setForm({...form, budget: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}