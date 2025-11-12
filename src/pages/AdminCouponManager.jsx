import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tag, Plus, Edit, Trash2, Percent, DollarSign, Truck,
  Gift, Copy, Search, Calendar, TrendingUp, Users
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AdminCouponManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_purchase: 0,
    usage_limit: 100,
    start_date: new Date().toISOString(),
    end_date: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date'),
    initialData: [],
  });

  const createCouponMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coupon.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const generateCode = () => {
    const code = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setCouponForm({...couponForm, code});
  };

  const handleSubmit = () => {
    if (editingCoupon) {
      updateCouponMutation.mutate({ id: editingCoupon.id, data: couponForm });
    } else {
      createCouponMutation.mutate(couponForm);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm(coupon);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCouponForm({
      code: '',
      name: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_purchase: 0,
      usage_limit: 100,
      start_date: new Date().toISOString(),
      end_date: '',
      is_active: true
    });
    setEditingCoupon(null);
  };

  const filteredCoupons = coupons.filter(c =>
    c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCoupons = filteredCoupons.filter(c => c.is_active);
  const expiredCoupons = filteredCoupons.filter(c => c.end_date && new Date(c.end_date) < new Date());
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.times_used || 0), 0);

  const getDiscountDisplay = (coupon) => {
    switch(coupon.discount_type) {
      case 'percentage': return `${coupon.discount_value}% OFF`;
      case 'fixed_amount': return `$${coupon.discount_value} OFF`;
      case 'free_shipping': return 'FREE SHIPPING';
      case 'bogo': return 'BOGO';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Coupon Manager</h2>
          <p className="text-slate-400 font-semibold">Create and manage discount codes</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-cyan-500 hover:bg-cyan-600 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Tag className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{coupons.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{coupons.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Coupons</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{activeCoupons.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Coupons</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalRedemptions}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Redemptions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{expiredCoupons.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search coupons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All ({filteredCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-cyan-500">
            Active ({activeCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="data-[state=active]:bg-cyan-500">
            Expired ({expiredCoupons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 grid gap-3">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-black text-xl">{coupon.code}</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code);
                              alert('Code copied!');
                            }}
                            className="text-slate-400 hover:text-white h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{coupon.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-cyan-500 text-lg font-black">
                            {getDiscountDisplay(coupon)}
                          </Badge>
                          {coupon.minimum_purchase > 0 && (
                            <Badge className="bg-purple-500">Min: ${coupon.minimum_purchase}</Badge>
                          )}
                          {coupon.is_active ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-500">Inactive</Badge>
                          )}
                          <Badge className="bg-amber-500">
                            Used: {coupon.times_used || 0}/{coupon.usage_limit || '∞'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEdit(coupon)} className="bg-cyan-500 hover:bg-cyan-600">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Delete this coupon?')) {
                              deleteCouponMutation.mutate(coupon.id);
                            }
                          }}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {coupon.end_date && (
                      <p className="text-slate-400 text-sm">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Expires: {format(new Date(coupon.end_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active" className="mt-6 grid gap-3">
          {activeCoupons.map((coupon) => (
            <Card key={coupon.id} className="bg-[#1a1f3a] border-green-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-black text-xl mb-1">{coupon.code}</h3>
                    <Badge className="bg-cyan-500 text-lg font-black">
                      {getDiscountDisplay(coupon)}
                    </Badge>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="expired" className="mt-6 grid gap-3">
          {expiredCoupons.map((coupon) => (
            <Card key={coupon.id} className="bg-[#1a1f3a] border-red-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-black text-xl mb-1">{coupon.code}</h3>
                    <p className="text-red-400 text-sm">
                      Expired: {format(new Date(coupon.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge className="bg-red-500">Expired</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Coupon Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black">
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="SAVE20"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                  />
                  <Button onClick={generateCode} className="bg-purple-500 hover:bg-purple-600">
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-white mb-2 block">Internal Name</Label>
                <Input
                  placeholder="20% Off Winter Sale"
                  value={couponForm.name}
                  onChange={(e) => setCouponForm({...couponForm, name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Discount Type</Label>
                <Select value={couponForm.discount_type} onValueChange={(value) => setCouponForm({...couponForm, discount_type: value})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="percentage" className="text-white">Percentage Off</SelectItem>
                    <SelectItem value="fixed_amount" className="text-white">Fixed Amount Off</SelectItem>
                    <SelectItem value="free_shipping" className="text-white">Free Shipping</SelectItem>
                    <SelectItem value="bogo" className="text-white">Buy One Get One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">
                  {couponForm.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={couponForm.discount_value}
                  onChange={(e) => setCouponForm({...couponForm, discount_value: parseFloat(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Minimum Purchase ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={couponForm.minimum_purchase}
                  onChange={(e) => setCouponForm({...couponForm, minimum_purchase: parseFloat(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Usage Limit</Label>
                <Input
                  type="number"
                  value={couponForm.usage_limit}
                  onChange={(e) => setCouponForm({...couponForm, usage_limit: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={couponForm.start_date ? format(new Date(couponForm.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setCouponForm({...couponForm, start_date: new Date(e.target.value).toISOString()})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">End Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={couponForm.end_date ? format(new Date(couponForm.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setCouponForm({...couponForm, end_date: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
              <input
                type="checkbox"
                checked={couponForm.is_active}
                onChange={(e) => setCouponForm({...couponForm, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label className="text-white">Active (customers can use this coupon)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!couponForm.code || couponForm.discount_value === 0}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {editingCoupon ? 'Update' : 'Create'} Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}