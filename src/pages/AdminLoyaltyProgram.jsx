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
import { Award, Plus, Star, TrendingUp } from 'lucide-react';

export default function AdminLoyaltyProgram() {
  const [showDialog, setShowDialog] = useState(false);
  const [tierForm, setTierForm] = useState({
    name: '',
    points_required: '',
    discount_percentage: '',
    benefits: ''
  });
  const queryClient = useQueryClient();

  const { data: loyaltyTiers = [] } = useQuery({
    queryKey: ['loyaltyTiers'],
    queryFn: () => base44.entities.LoyaltyProgram.list('points_required'),
    initialData: []
  });

  const { data: customerLoyalty = [] } = useQuery({
    queryKey: ['customerLoyalty'],
    queryFn: () => base44.entities.CustomerLoyalty.list('-points'),
    initialData: []
  });

  const createTierMutation = useMutation({
    mutationFn: (data) => base44.entities.LoyaltyProgram.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loyaltyTiers']);
      setShowDialog(false);
      setTierForm({ name: '', points_required: '', discount_percentage: '', benefits: '' });
    }
  });

  const handleSubmit = () => {
    createTierMutation.mutate({
      name: tierForm.name,
      points_required: parseInt(tierForm.points_required),
      discount_percentage: parseFloat(tierForm.discount_percentage),
      benefits: tierForm.benefits
    });
  };

  const tierColumns = [
    { header: 'Tier Name', key: 'name', render: (val) => <span className="text-cyan-400 font-black">{val}</span> },
    { header: 'Points Required', key: 'points_required', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Discount', key: 'discount_percentage', render: (val) => <span className="text-green-400 font-bold">{val}%</span> },
    { header: 'Benefits', key: 'benefits', render: (val) => <span className="text-slate-300">{val}</span> }
  ];

  const customerColumns = [
    { header: 'Customer', key: 'user_id', render: (val) => <span className="text-white">{val.slice(0, 8)}</span> },
    { header: 'Points', key: 'points', render: (val) => <Badge className="bg-amber-500">{val}</Badge> },
    { header: 'Tier', key: 'tier_name', render: (val) => <Badge className="bg-cyan-500">{val || 'Bronze'}</Badge> },
    { header: 'Lifetime Spend', key: 'lifetime_spend', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2) || '0.00'}</span> }
  ];

  const stats = {
    totalCustomers: customerLoyalty.length,
    avgPoints: customerLoyalty.reduce((sum, c) => sum + (c.points || 0), 0) / (customerLoyalty.length || 1),
    totalPoints: customerLoyalty.reduce((sum, c) => sum + (c.points || 0), 0)
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Loyalty Program"
        subtitle="Reward your best customers"
        icon={Award}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Tier', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.totalCustomers}</p>
            <p className="text-amber-300 text-sm font-bold">Loyalty Members</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.totalPoints}</p>
            <p className="text-purple-300 text-sm font-bold">Total Points</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.avgPoints.toFixed(0)}</p>
            <p className="text-cyan-300 text-sm font-bold">Avg Points</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-black text-xl mb-4">Loyalty Tiers</h3>
          <EnterpriseTable columns={tierColumns} data={loyaltyTiers} />
        </CardContent>
      </Card>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-black text-xl mb-4">Customer Loyalty</h3>
          <EnterpriseTable columns={customerColumns} data={customerLoyalty} />
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Create Loyalty Tier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Tier Name *</Label>
              <Input
                value={tierForm.name}
                onChange={(e) => setTierForm({...tierForm, name: e.target.value})}
                placeholder="e.g., Gold"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Points Required *</Label>
                <Input
                  type="number"
                  value={tierForm.points_required}
                  onChange={(e) => setTierForm({...tierForm, points_required: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Discount % *</Label>
                <Input
                  type="number"
                  value={tierForm.discount_percentage}
                  onChange={(e) => setTierForm({...tierForm, discount_percentage: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white">Benefits</Label>
              <Input
                value={tierForm.benefits}
                onChange={(e) => setTierForm({...tierForm, benefits: e.target.value})}
                placeholder="Free shipping, early access"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 font-bold h-12">
              Create Tier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}