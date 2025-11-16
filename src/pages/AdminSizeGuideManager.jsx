import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Ruler, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminSizeGuideManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    category: '',
    gender: 'unisex',
    measurements: {},
    image_url: '',
    is_active: true
  });

  const { data: guides = [] } = useQuery({
    queryKey: ['sizeGuides'],
    queryFn: () => base44.entities.SizeGuide.list(),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SizeGuide.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sizeGuides']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SizeGuide.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sizeGuides']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SizeGuide.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['sizeGuides'])
  });

  const resetForm = () => {
    setForm({
      name: '',
      category: '',
      gender: 'unisex',
      measurements: {},
      image_url: '',
      is_active: true
    });
    setEditingGuide(null);
  };

  const handleSubmit = () => {
    if (editingGuide) {
      updateMutation.mutate({ id: editingGuide.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const columns = [
    { header: 'Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Category', key: 'category', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Gender', key: 'gender', render: (val) => <Badge className="bg-cyan-500">{val}</Badge> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Size Guide Manager"
        subtitle="Manage size charts for different product categories"
        icon={Ruler}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Size Guide', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{guides.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Guides</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{guides.filter(g => g.gender === 'mens').length}</p>
            <p className="text-purple-300 text-sm font-bold">Men's Guides</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-900/30 to-rose-900/30 border-pink-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{guides.filter(g => g.gender === 'womens').length}</p>
            <p className="text-pink-300 text-sm font-bold">Women's Guides</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{guides.filter(g => g.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={guides}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (guide) => {
            setEditingGuide(guide);
            setForm(guide);
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (guide) => {
            if (confirm('Delete this size guide?')) deleteMutation.mutate(guide.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingGuide ? 'Edit Size Guide' : 'Create Size Guide'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Guide Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Category</Label>
                <Select value={form.category} onValueChange={(val) => setForm({...form, category: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Gender</Label>
                <Select value={form.gender} onValueChange={(val) => setForm({...form, gender: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="mens">Men's</SelectItem>
                    <SelectItem value="womens">Women's</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white">Size Chart Image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({...form, image_url: e.target.value})} placeholder="https://..." className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Measurements (JSON format)</Label>
              <Textarea 
                value={JSON.stringify(form.measurements, null, 2)} 
                onChange={(e) => {
                  try {
                    setForm({...form, measurements: JSON.parse(e.target.value)});
                  } catch {}
                }}
                className="bg-slate-900 border-slate-700 text-white h-40 font-mono text-xs"
                placeholder='{"S": {"chest": "34-36", "waist": "28-30"}, "M": {...}}'
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingGuide ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}