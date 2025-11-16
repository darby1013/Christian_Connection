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
import { ShoppingBag, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminCrossSellManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    primary_product_id: '',
    suggested_product_ids: [],
    discount_percentage: 0,
    priority: 0,
    is_active: true
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['crossSellRules'],
    queryFn: () => base44.entities.CrossSellRule.list(),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CrossSellRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['crossSellRules']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CrossSellRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['crossSellRules']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CrossSellRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['crossSellRules'])
  });

  const resetForm = () => {
    setForm({
      name: '',
      primary_product_id: '',
      suggested_product_ids: [],
      discount_percentage: 0,
      priority: 0,
      is_active: true
    });
    setSelectedProducts([]);
    setEditingRule(null);
  };

  const handleSubmit = () => {
    const data = { ...form, suggested_product_ids: selectedProducts };
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: 'Rule Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { 
      header: 'Primary Product', 
      key: 'primary_product_id',
      render: (val) => {
        const p = products.find(p => p.id === val);
        return <Badge className="bg-cyan-500">{p?.name || 'N/A'}</Badge>;
      }
    },
    { header: 'Suggestions', key: 'suggested_product_ids', render: (val) => <Badge className="bg-purple-500">{val?.length || 0}</Badge> },
    { header: 'Discount', key: 'discount_percentage', render: (val) => <span className="text-green-400">{val}%</span> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Cross-Sell Manager"
        subtitle="Configure product recommendations and upsells"
        icon={ShoppingBag}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Rule', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{rules.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{rules.filter(r => r.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              {rules.reduce((sum, r) => sum + (r.suggested_product_ids?.length || 0), 0)}
            </p>
            <p className="text-purple-300 text-sm font-bold">Total Suggestions</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={rules}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (rule) => {
            setEditingRule(rule);
            setForm(rule);
            setSelectedProducts(rule.suggested_product_ids || []);
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (rule) => {
            if (confirm('Delete this rule?')) deleteMutation.mutate(rule.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingRule ? 'Edit Cross-Sell Rule' : 'Create Cross-Sell Rule'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Rule Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Primary Product *</Label>
              <select
                value={form.primary_product_id}
                onChange={(e) => setForm({...form, primary_product_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-2"
              >
                <option value="">Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white mb-2 block">Suggested Products ({selectedProducts.length})</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto bg-slate-900 p-4 rounded-lg border border-slate-700">
                {products.filter(p => p.id !== form.primary_product_id).map(product => (
                  <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-white text-sm">{product.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Discount %</Label>
                <Input type="number" value={form.discount_percentage} onChange={(e) => setForm({...form, discount_percentage: parseFloat(e.target.value)})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Priority</Label>
                <Input type="number" value={form.priority} onChange={(e) => setForm({...form, priority: parseInt(e.target.value)})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingRule ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}