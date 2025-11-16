import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Award, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminProductBadges() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    text: '',
    color: '#06b6d4',
    icon: '',
    conditions: {},
    is_active: true
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['productBadges'],
    queryFn: () => base44.entities.ProductBadge.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductBadge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productBadges']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductBadge.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productBadges']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductBadge.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['productBadges'])
  });

  const resetForm = () => {
    setForm({
      name: '',
      text: '',
      color: '#06b6d4',
      icon: '',
      conditions: {},
      is_active: true
    });
    setEditingBadge(null);
  };

  const handleSubmit = () => {
    if (editingBadge) {
      updateMutation.mutate({ id: editingBadge.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const columns = [
    { 
      header: 'Badge', 
      key: 'text',
      render: (_, badge) => (
        <Badge style={{ backgroundColor: badge.color }}>{badge.text}</Badge>
      )
    },
    { header: 'Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Badge Manager"
        subtitle="Create custom badges for products (New, Sale, Featured, etc.)"
        icon={Award}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Badge', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{badges.length}</p>
            <p className="text-purple-300 text-sm font-bold">Total Badges</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{badges.filter(b => b.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex gap-2 flex-wrap">
              {badges.slice(0, 5).map(b => (
                <Badge key={b.id} style={{ backgroundColor: b.color }}>{b.text}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={badges}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (badge) => {
            setEditingBadge(badge);
            setForm(badge);
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (badge) => {
            if (confirm('Delete this badge?')) deleteMutation.mutate(badge.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingBadge ? 'Edit Badge' : 'Create Badge'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Badge Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. New Arrival" className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Display Text *</Label>
              <Input value={form.text} onChange={(e) => setForm({...form, text: e.target.value})} placeholder="e.g. NEW" className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} className="w-20 h-10" />
                <Input value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} className="flex-1 bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white mb-2 block">Preview</Label>
              <Badge style={{ backgroundColor: form.color }}>{form.text || 'BADGE'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingBadge ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}