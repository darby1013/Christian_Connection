import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Truck, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminShippingConfig() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const queryClient = useQueryClient();

  const [methodForm, setMethodForm] = useState({
    name: '',
    code: '',
    description: '',
    cost: '',
    estimated_days: '',
    free_shipping_threshold: '',
    is_active: true
  });

  const { data: methods = [] } = useQuery({
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
      cost: parseFloat(methodForm.cost),
      free_shipping_threshold: methodForm.free_shipping_threshold ? parseFloat(methodForm.free_shipping_threshold) : null
    };

    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: 'Method Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Code', key: 'code', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Cost', key: 'cost', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Delivery Time', key: 'estimated_days', render: (val) => <span className="text-slate-300">{val}</span> },
    { header: 'Free Threshold', key: 'free_shipping_threshold', render: (val) => val ? `$${val}` : 'None' },
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
          { label: 'New Method', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <EnterpriseTable
        columns={columns}
        data={methods}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (method) => {
            setEditingMethod(method);
            setMethodForm({...method, cost: method.cost?.toString(), free_shipping_threshold: method.free_shipping_threshold?.toString() || ''});
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (method) => {
            if (confirm('Delete this shipping method?')) deleteMutation.mutate(method.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingMethod ? 'Edit' : 'New'} Shipping Method
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Method Name *</Label>
                <Input 
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({...methodForm, name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Code *</Label>
                <Input 
                  value={methodForm.code}
                  onChange={(e) => setMethodForm({...methodForm, code: e.target.value})}
                  placeholder="e.g., standard, express"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea 
                value={methodForm.description}
                onChange={(e) => setMethodForm({...methodForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Cost ($) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={methodForm.cost}
                  onChange={(e) => setMethodForm({...methodForm, cost: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Delivery Time</Label>
                <Input 
                  value={methodForm.estimated_days}
                  onChange={(e) => setMethodForm({...methodForm, estimated_days: e.target.value})}
                  placeholder="e.g., 3-5 days"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Free Threshold ($)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={methodForm.free_shipping_threshold}
                  onChange={(e) => setMethodForm({...methodForm, free_shipping_threshold: e.target.value})}
                  placeholder="Optional"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={methodForm.is_active}
                onChange={(e) => setMethodForm({...methodForm, is_active: e.target.checked})}
              />
              <Label className="text-white">Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingMethod ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}