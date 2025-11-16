import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Percent, Plus, Edit, Trash2, Gift, Sparkles } from 'lucide-react';

export default function AdminAdvancedCoupons() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    code: '',
    name: '',
    coupon_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_discount: '',
    user_segment: '',
    max_uses: '',
    expires_at: '',
    tiered_rules: [],
    bogo_config: {},
    is_active: true
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['advancedCoupons'],
    queryFn: () => base44.entities.AdvancedCoupon.list('-created_date'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AdvancedCoupon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['advancedCoupons']);
      setShowDialog(false);
      resetForm();
    }
  });

  const generateRandomCode = () => {
    const code = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm({...form, code});
  };

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      coupon_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_discount: '',
      user_segment: '',
      max_uses: '',
      expires_at: '',
      tiered_rules: [],
      bogo_config: {},
      is_active: true
    });
    setEditingCoupon(null);
  };

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <Badge className="bg-cyan-500 font-mono">{val}</Badge> },
    { header: 'Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Type', key: 'coupon_type', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Value', key: 'discount_value', render: (val, row) => <span className="text-green-400">{row.coupon_type === 'percentage' ? `${val}%` : `$${val}`}</span> },
    { header: 'Uses', key: 'uses', render: (val, row) => <span className="text-slate-300">{val}/{row.max_uses || '∞'}</span> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Advanced Coupons"
        subtitle="BOGO, tiered discounts, and segment-based promotions"
        icon={Percent}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Coupon', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Coupons</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.filter(c => c.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.reduce((sum, c) => sum + (c.uses || 0), 0)}</p>
            <p className="text-purple-300 text-sm font-bold">Total Uses</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{coupons.filter(c => c.coupon_type === 'bogo').length}</p>
            <p className="text-amber-300 text-sm font-bold">BOGO Deals</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={coupons}
        actions={[
          { label: 'Delete', icon: Trash2, onClick: (c) => {
            if (confirm('Delete coupon?')) base44.entities.AdvancedCoupon.delete(c.id).then(() => queryClient.invalidateQueries(['advancedCoupons']));
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Create Advanced Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="bg-slate-900 border-slate-700 text-white font-mono" />
                  <Button onClick={generateRandomCode} variant="outline" className="border-slate-600">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-white">Campaign Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Coupon Type</Label>
                <Select value={form.coupon_type} onValueChange={(val) => setForm({...form, coupon_type: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="bogo">Buy One Get One</SelectItem>
                    <SelectItem value="tiered">Tiered Discount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Discount Value</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({...form, discount_value: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            {form.coupon_type === 'bogo' && (
              <Card className="bg-purple-900/20 border-purple-500/30">
                <CardContent className="p-4">
                  <Label className="text-purple-300 font-bold mb-3 block">BOGO Configuration</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Buy Quantity (e.g., 1)" className="bg-slate-900 border-slate-700 text-white" />
                    <Input placeholder="Get Quantity (e.g., 1)" className="bg-slate-900 border-slate-700 text-white" />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Min Purchase</Label>
                <Input type="number" value={form.min_purchase} onChange={(e) => setForm({...form, min_purchase: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Max Uses</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({...form, max_uses: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Expires At</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({...form, expires_at: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div>
              <Label className="text-white">User Segment (Optional)</Label>
              <Select value={form.user_segment} onValueChange={(val) => setForm({...form, user_segment: val})}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null}>All Users</SelectItem>
                  <SelectItem value="vip">VIP Only</SelectItem>
                  <SelectItem value="new">New Customers</SelectItem>
                  <SelectItem value="frequent">Frequent Buyers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                Create Coupon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}