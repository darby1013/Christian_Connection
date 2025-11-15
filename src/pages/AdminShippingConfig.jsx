import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Truck, Plus, Edit, Trash2, DollarSign } from 'lucide-react';

export default function AdminShippingConfig() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm, setMethodForm] = useState({
    name: '',
    code: '',
    description: '',
    cost: '',
    estimated_days: '',
    free_shipping_threshold: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shippingMethods'],
    queryFn: () => base44.entities.ShippingMethod.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShippingMethod.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shippingMethods']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShippingMethod.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shippingMethods']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShippingMethod.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['shippingMethods']);
    }
  });

  const resetForm = () => {
    setMethodForm({
      name: '',
      code: '',
      description: '',
      cost: '',
      estimated_days: '',
      free_shipping_threshold: '',
      is_active: true
    });
    setEditingMethod(null);
  };

  const handleSubmit = () => {
    const data = {
      ...methodForm,
      cost: parseFloat(methodForm.cost) || 0,
      free_shipping_threshold: methodForm.free_shipping_threshold ? parseFloat(methodForm.free_shipping_threshold) : null
    };

    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: 'Shipping Method',
      key: 'name',
      render: (_, method) => (
        <div>
          <p className="text-white font-bold">{method.name}</p>
          <p className="text-slate-400 text-xs">{method.code}</p>
        </div>
      )
    },
    { header: 'Cost', key: 'cost', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Delivery Time', key: 'estimated_days', render: (val) => <Badge className="bg-blue-500">{val}</Badge> },
    { 
      header: 'Free Shipping', 
      key: 'free_shipping_threshold', 
      render: (val) => val ? <span className="text-cyan-400">≥${val}</span> : <span className="text-slate-500">N/A</span>
    },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Shipping Configuration"
        subtitle="Manage shipping methods and rates"
        icon={Truck}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Shipping Method', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{shippingMethods.length}</p>
            <p className="text-blue-300 text-sm font-bold">Shipping Methods</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{shippingMethods.filter(m => m.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active Methods</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              {shippingMethods.filter(m => m.free_shipping_threshold).length}
            </p>
            <p className="text-purple-300 text-sm font-bold">With Free Shipping</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={shippingMethods}
        actions={[
          {
            label: 'Edit',
            icon: Edit,
            onClick: (method) => {
              setEditingMethod(method);
              setMethodForm({
                name: method.name,
                code: method.code || '',
                description: method.description || '',
                cost: method.cost?.toString() || '',
                estimated_days: method.estimated_days || '',
                free_shipping_threshold: method.free_shipping_threshold?.toString() || '',
                is_active: method.is_active
              });
              setShowDialog(true);
            }
          },
          {
            label: 'Delete',
            icon: Trash2,
            onClick: (method) => {
              if (confirm(`Delete shipping method "${method.name}"?`)) {
                deleteMutation.mutate(method.id);
              }
            }
          }
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Method Name *</Label>
                <Input
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                  placeholder="e.g., Standard Shipping"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Code *</Label>
                <Input
                  value={methodForm.code}
                  onChange={(e) => setMethodForm({ ...methodForm, code: e.target.value })}
                  placeholder="e.g., standard"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={methodForm.description}
                onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
                placeholder="Describe this shipping option..."
                className="bg-slate-900 border-slate-700 text-white h-20"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Base Cost ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={methodForm.cost}
                  onChange={(e) => setMethodForm({ ...methodForm, cost: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Estimated Delivery</Label>
                <Input
                  value={methodForm.estimated_days}
                  onChange={(e) => setMethodForm({ ...methodForm, estimated_days: e.target.value })}
                  placeholder="e.g., 5-7 days"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Free Shipping At ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={methodForm.free_shipping_threshold}
                  onChange={(e) => setMethodForm({ ...methodForm, free_shipping_threshold: e.target.value })}
                  placeholder="e.g., 50"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={methodForm.is_active}
                onChange={(e) => setMethodForm({ ...methodForm, is_active: e.target.checked })}
              />
              <Label className="text-white">Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="flex-1 border-slate-600"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 font-bold">
                {editingMethod ? 'Update Method' : 'Create Method'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}