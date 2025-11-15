import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Tag, Plus, Edit, Trash2, Percent } from 'lucide-react';

export default function AdminCouponManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_amount: '',
    min_purchase: '',
    max_uses: '',
    expires_at: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coupons']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coupon.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coupons']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['coupons'])
  });

  const resetForm = () => {
    setCouponForm({
      code: '',
      discount_type: 'percentage',
      discount_amount: '',
      min_purchase: '',
      max_uses: '',
      expires_at: '',
      is_active: true
    });
    setEditingCoupon(null);
  };

  const handleSubmit = () => {
    const data = {
      ...couponForm,
      discount_amount: parseFloat(couponForm.discount_amount),
      min_purchase: couponForm.min_purchase ? parseFloat(couponForm.min_purchase) : null,
      max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : null
    };
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="text-cyan-400 font-black text-lg">{val}</span> },
    { 
      header: 'Discount', 
      key: 'discount_amount', 
      render: (val, coupon) => (
        <span className="text-green-400 font-bold">
          {coupon.discount_type === 'percentage' ? `${val}%` : `$${val}`}
        </span>
      )
    },
    { header: 'Min Purchase', key: 'min_purchase', render: (val) => val ? `$${val}` : 'None' },
    { header: 'Max Uses', key: 'max_uses', render: (val) => val || '∞' },
    { header: 'Used', key: 'uses', render: (val) => <Badge className="bg-purple-500">{val || 0}</Badge> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Coupon Management"
        subtitle="Create and manage discount codes"
        icon={Tag}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Coupon', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.length}</p>
            <p className="text-purple-300 text-sm font-bold">Total Coupons</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.filter(c => c.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.reduce((sum, c) => sum + (c.uses || 0), 0)}</p>
            <p className="text-blue-300 text-sm font-bold">Total Uses</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.filter(c => c.discount_type === 'percentage').length}</p>
            <p className="text-amber-300 text-sm font-bold">% Discounts</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={coupons}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (coupon) => {
            setEditingCoupon(coupon);
            setCouponForm({
              code: coupon.code,
              discount_type: coupon.discount_type,
              discount_amount: coupon.discount_amount?.toString(),
              min_purchase: coupon.min_purchase?.toString() || '',
              max_uses: coupon.max_uses?.toString() || '',
              expires_at: coupon.expires_at || '',
              is_active: coupon.is_active
            });
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (c) => {
            if (confirm(`Delete coupon "${c.code}"?`)) deleteMutation.mutate(c.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Coupon Code *</Label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                  placeholder="SAVE20"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Discount Type</Label>
                <select
                  value={couponForm.discount_type}
                  onChange={(e) => setCouponForm({...couponForm, discount_type: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Discount Amount *</Label>
                <Input
                  type="number"
                  value={couponForm.discount_amount}
                  onChange={(e) => setCouponForm({...couponForm, discount_amount: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Min Purchase ($)</Label>
                <Input
                  type="number"
                  value={couponForm.min_purchase}
                  onChange={(e) => setCouponForm({...couponForm, min_purchase: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Max Uses</Label>
                <Input
                  type="number"
                  value={couponForm.max_uses}
                  onChange={(e) => setCouponForm({...couponForm, max_uses: e.target.value})}
                  placeholder="Unlimited"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Expires At</Label>
                <Input
                  type="date"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({...couponForm, expires_at: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={couponForm.is_active}
                onChange={(e) => setCouponForm({...couponForm, is_active: e.target.checked})}
              />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
                {editingCoupon ? 'Update' : 'Create'} Coupon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}