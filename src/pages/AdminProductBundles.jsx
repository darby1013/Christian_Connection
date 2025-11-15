import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminProductBundles() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [bundleForm, setBundleForm] = useState({
    name: '',
    description: '',
    product_ids: [],
    bundle_price: '',
    savings_amount: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: bundles = [] } = useQuery({
    queryKey: ['productBundles'],
    queryFn: () => base44.entities.ProductBundle.list('-created_date'),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductBundle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productBundles']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductBundle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productBundles']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductBundle.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['productBundles'])
  });

  const resetForm = () => {
    setBundleForm({
      name: '',
      description: '',
      product_ids: [],
      bundle_price: '',
      savings_amount: '',
      is_active: true
    });
    setEditingBundle(null);
  };

  const handleSubmit = () => {
    const data = {
      ...bundleForm,
      bundle_price: parseFloat(bundleForm.bundle_price),
      savings_amount: parseFloat(bundleForm.savings_amount)
    };
    if (editingBundle) {
      updateMutation.mutate({ id: editingBundle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: 'Bundle Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Products', key: 'product_ids', render: (val) => <Badge className="bg-purple-500">{val?.length || 0} items</Badge> },
    { header: 'Price', key: 'bundle_price', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Savings', key: 'savings_amount', render: (val) => <Badge className="bg-red-500">Save ${val?.toFixed(2)}</Badge> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Bundles"
        subtitle="Create combo deals and packages"
        icon={Package}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Bundle', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{bundles.length}</p>
            <p className="text-purple-300 text-sm font-bold">Total Bundles</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{bundles.filter(b => b.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              ${bundles.reduce((sum, b) => sum + (b.savings_amount || 0), 0).toFixed(0)}
            </p>
            <p className="text-amber-300 text-sm font-bold">Total Savings Offered</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={bundles}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (bundle) => {
            setEditingBundle(bundle);
            setBundleForm({
              name: bundle.name,
              description: bundle.description || '',
              product_ids: bundle.product_ids || [],
              bundle_price: bundle.bundle_price?.toString(),
              savings_amount: bundle.savings_amount?.toString(),
              is_active: bundle.is_active
            });
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (b) => {
            if (confirm(`Delete bundle "${b.name}"?`)) deleteMutation.mutate(b.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingBundle ? 'Edit Bundle' : 'Create Bundle'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Bundle Name *</Label>
              <Input
                value={bundleForm.name}
                onChange={(e) => setBundleForm({...bundleForm, name: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={bundleForm.description}
                onChange={(e) => setBundleForm({...bundleForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Bundle Price ($) *</Label>
                <Input
                  type="number"
                  value={bundleForm.bundle_price}
                  onChange={(e) => setBundleForm({...bundleForm, bundle_price: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Savings Amount ($) *</Label>
                <Input
                  type="number"
                  value={bundleForm.savings_amount}
                  onChange={(e) => setBundleForm({...bundleForm, savings_amount: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bundleForm.is_active}
                onChange={(e) => setBundleForm({...bundleForm, is_active: e.target.checked})}
              />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
                {editingBundle ? 'Update' : 'Create'} Bundle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}