import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Percent, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminBulkPricing() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    product_id: '',
    min_quantity: '',
    discount_percentage: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: bulkRules = [] } = useQuery({
    queryKey: ['bulkPricing'],
    queryFn: () => base44.entities.BulkPricing.list(),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BulkPricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bulkPricing']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BulkPricing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bulkPricing']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BulkPricing.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['bulkPricing'])
  });

  const resetForm = () => {
    setRuleForm({
      product_id: '',
      min_quantity: '',
      discount_percentage: '',
      is_active: true
    });
    setEditingRule(null);
  };

  const handleSubmit = () => {
    const product = products.find(p => p.id === ruleForm.product_id);
    const data = {
      ...ruleForm,
      product_name: product?.name,
      min_quantity: parseInt(ruleForm.min_quantity),
      discount_percentage: parseFloat(ruleForm.discount_percentage)
    };
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: 'Product', key: 'product_name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Min Qty', key: 'min_quantity', render: (val) => <Badge className="bg-purple-500">{val}+</Badge> },
    { header: 'Discount', key: 'discount_percentage', render: (val) => <Badge className="bg-green-500">{val}% OFF</Badge> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Bulk Pricing Rules"
        subtitle="Volume discounts and wholesale pricing"
        icon={Percent}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Rule', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{bulkRules.length}</p>
            <p className="text-purple-300 text-sm font-bold">Pricing Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{bulkRules.filter(r => r.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              {(bulkRules.reduce((sum, r) => sum + (r.discount_percentage || 0), 0) / (bulkRules.length || 1)).toFixed(1)}%
            </p>
            <p className="text-cyan-300 text-sm font-bold">Avg Discount</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={bulkRules}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (rule) => {
            setEditingRule(rule);
            setRuleForm({
              product_id: rule.product_id,
              min_quantity: rule.min_quantity?.toString(),
              discount_percentage: rule.discount_percentage?.toString(),
              is_active: rule.is_active
            });
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (rule) => {
            if (confirm('Delete this pricing rule?')) deleteMutation.mutate(rule.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Product *</Label>
              <Select value={ruleForm.product_id} onValueChange={(val) => setRuleForm({...ruleForm, product_id: val})}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Min Quantity *</Label>
                <Input
                  type="number"
                  value={ruleForm.min_quantity}
                  onChange={(e) => setRuleForm({...ruleForm, min_quantity: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Discount % *</Label>
                <Input
                  type="number"
                  value={ruleForm.discount_percentage}
                  onChange={(e) => setRuleForm({...ruleForm, discount_percentage: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ruleForm.is_active}
                onChange={(e) => setRuleForm({...ruleForm, is_active: e.target.checked})}
              />
              <Label className="text-white">Active</Label>
            </div>
            <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 font-bold h-12">
              {editingRule ? 'Update' : 'Create'} Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}