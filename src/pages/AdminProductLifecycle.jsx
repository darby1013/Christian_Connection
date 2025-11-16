import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminProductLifecycle() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLifecycle, setEditingLifecycle] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    product_id: '',
    stage: 'development',
    launch_date: '',
    discontinue_date: '',
    replacement_product_id: '',
    notes: ''
  });

  const { data: lifecycles = [] } = useQuery({
    queryKey: ['productLifecycles'],
    queryFn: () => base44.entities.ProductLifecycle.list(),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductLifecycle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productLifecycles']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductLifecycle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productLifecycles']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductLifecycle.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['productLifecycles'])
  });

  const resetForm = () => {
    setForm({
      product_id: '',
      stage: 'development',
      launch_date: '',
      discontinue_date: '',
      replacement_product_id: '',
      notes: ''
    });
    setEditingLifecycle(null);
  };

  const handleSubmit = () => {
    if (editingLifecycle) {
      updateMutation.mutate({ id: editingLifecycle.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const stageColors = {
    development: 'bg-blue-500',
    launch: 'bg-green-500',
    growth: 'bg-cyan-500',
    maturity: 'bg-purple-500',
    decline: 'bg-amber-500',
    discontinued: 'bg-red-500'
  };

  const columns = [
    { 
      header: 'Product', 
      key: 'product_id',
      render: (val) => {
        const p = products.find(p => p.id === val);
        return <span className="text-white font-bold">{p?.name || 'N/A'}</span>;
      }
    },
    { header: 'Stage', key: 'stage', render: (val) => <Badge className={stageColors[val]}>{val}</Badge> },
    { header: 'Launch Date', key: 'launch_date', render: (val) => <span className="text-slate-300">{val || 'N/A'}</span> },
    { header: 'Discontinue Date', key: 'discontinue_date', render: (val) => <span className="text-red-400">{val || 'N/A'}</span> }
  ];

  const stageCounts = {
    development: lifecycles.filter(l => l.stage === 'development').length,
    launch: lifecycles.filter(l => l.stage === 'launch').length,
    growth: lifecycles.filter(l => l.stage === 'growth').length,
    maturity: lifecycles.filter(l => l.stage === 'maturity').length,
    decline: lifecycles.filter(l => l.stage === 'decline').length,
    discontinued: lifecycles.filter(l => l.stage === 'discontinued').length
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Lifecycle"
        subtitle="Track product stages from development to discontinuation"
        icon={Calendar}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Lifecycle', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stageCounts.development + stageCounts.launch}</p>
            <p className="text-blue-300 text-sm font-bold">Early Stage</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stageCounts.growth + stageCounts.maturity}</p>
            <p className="text-green-300 text-sm font-bold">Active Products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stageCounts.decline + stageCounts.discontinued}</p>
            <p className="text-red-300 text-sm font-bold">End of Life</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={lifecycles}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (lc) => {
            setEditingLifecycle(lc);
            setForm(lc);
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (lc) => {
            if (confirm('Delete this lifecycle entry?')) deleteMutation.mutate(lc.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingLifecycle ? 'Edit Lifecycle' : 'Add Lifecycle'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Product *</Label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({...form, product_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-2"
              >
                <option value="">Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white">Lifecycle Stage *</Label>
              <select
                value={form.stage}
                onChange={(e) => setForm({...form, stage: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-2"
              >
                <option value="development">Development</option>
                <option value="launch">Launch</option>
                <option value="growth">Growth</option>
                <option value="maturity">Maturity</option>
                <option value="decline">Decline</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Launch Date</Label>
                <Input type="date" value={form.launch_date} onChange={(e) => setForm({...form, launch_date: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Discontinue Date</Label>
                <Input type="date" value={form.discontinue_date} onChange={(e) => setForm({...form, discontinue_date: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white">Replacement Product</Label>
              <select
                value={form.replacement_product_id}
                onChange={(e) => setForm({...form, replacement_product_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-2"
              >
                <option value="">None</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-24" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingLifecycle ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}