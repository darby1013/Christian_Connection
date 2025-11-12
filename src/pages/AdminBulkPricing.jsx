import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Package, Plus, Edit, Trash2, Percent, DollarSign,
  ShoppingCart, TrendingDown, Layers, Calculator
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

export default function AdminBulkPricing() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    product_id: '',
    min_quantity: 10,
    max_quantity: null,
    discount_type: 'percentage',
    discount_value: 10,
    tier_name: 'Bulk Discount',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: bulkRules = [] } = useQuery({
    queryKey: ['bulkPricing'],
    queryFn: () => base44.entities.BulkPricing.list('-created_date'),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.BulkPricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkPricing'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BulkPricing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkPricing'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.BulkPricing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkPricing'] });
    },
  });

  const calculatePricing = () => {
    if (!selectedProduct || !ruleForm.discount_value) return null;

    const basePrice = selectedProduct.price;
    let finalPrice = basePrice;

    switch(ruleForm.discount_type) {
      case 'percentage':
        finalPrice = basePrice * (1 - ruleForm.discount_value / 100);
        break;
      case 'fixed_amount':
        finalPrice = basePrice - ruleForm.discount_value;
        break;
      case 'fixed_price':
        finalPrice = ruleForm.discount_value;
        break;
    }

    return {
      basePrice,
      finalPrice: Math.max(0, finalPrice),
      savings: basePrice - finalPrice,
      savingsPercent: ((basePrice - finalPrice) / basePrice) * 100
    };
  };

  const handleSubmit = () => {
    const product = products.find(p => p.id === ruleForm.product_id);
    if (!product) return;

    const pricing = calculatePricing();
    
    const data = {
      ...ruleForm,
      product_name: product.name,
      final_unit_price: pricing.finalPrice,
      savings_amount: pricing.savings
    };

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setRuleForm(rule);
    setSelectedProduct(products.find(p => p.id === rule.product_id));
    setDialogOpen(true);
  };

  const resetForm = () => {
    setRuleForm({
      product_id: '',
      min_quantity: 10,
      max_quantity: null,
      discount_type: 'percentage',
      discount_value: 10,
      tier_name: 'Bulk Discount',
      is_active: true
    });
    setSelectedProduct(null);
    setEditingRule(null);
  };

  const activeRules = bulkRules.filter(r => r.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Bulk & Wholesale Pricing</h2>
          <p className="text-slate-400 font-semibold">Quantity-based discount tiers</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-cyan-500 hover:bg-cyan-600 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Add Pricing Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Layers className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{bulkRules.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{bulkRules.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Pricing Rules</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{activeRules.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Rules</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {[...new Set(bulkRules.map(r => r.product_id))].length}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Products with Bulk Pricing</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Rules */}
      <div className="grid gap-3">
        {bulkRules.map((rule) => {
          const product = products.find(p => p.id === rule.product_id);
          return (
            <Card key={rule.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                    {product?.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center">
                        <Package className="w-8 h-8 text-white opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{product?.name || rule.product_name}</h3>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className="bg-purple-500">{rule.tier_name}</Badge>
                      <Badge className="bg-cyan-500">
                        Buy {rule.min_quantity}+ {rule.max_quantity ? `to ${rule.max_quantity}` : 'or more'}
                      </Badge>
                      {rule.discount_type === 'percentage' && (
                        <Badge className="bg-green-500 text-lg font-black">
                          {rule.discount_value}% OFF
                        </Badge>
                      )}
                      {rule.discount_type === 'fixed_amount' && (
                        <Badge className="bg-green-500 text-lg font-black">
                          ${rule.discount_value} OFF Each
                        </Badge>
                      )}
                      {rule.discount_type === 'fixed_price' && (
                        <Badge className="bg-green-500 text-lg font-black">
                          ${rule.discount_value} Each
                        </Badge>
                      )}
                      {rule.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge className="bg-slate-500">Inactive</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-slate-900/50 rounded text-center">
                        <p className="text-slate-400 text-xs">Base Price</p>
                        <p className="text-white font-bold">${product?.price?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-green-900/20 border border-green-500/30 rounded text-center">
                        <p className="text-green-400 text-xs">Bulk Price</p>
                        <p className="text-green-300 font-bold">${rule.final_unit_price?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-cyan-900/20 border border-cyan-500/30 rounded text-center">
                        <p className="text-cyan-400 text-xs">You Save</p>
                        <p className="text-cyan-300 font-bold">${rule.savings_amount?.toFixed(2) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(rule)} className="bg-cyan-500 hover:bg-cyan-600">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Delete this pricing rule?')) {
                          deleteRuleMutation.mutate(rule.id);
                        }
                      }}
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pricing Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black">
              {editingRule ? 'Edit Pricing Rule' : 'Create Bulk Pricing Rule'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-white mb-2 block">Select Product *</Label>
              <Select 
                value={ruleForm.product_id} 
                onValueChange={(value) => {
                  setRuleForm({...ruleForm, product_id: value});
                  setSelectedProduct(products.find(p => p.id === value));
                }}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id} className="text-white">
                      {product.name} - ${product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white mb-2 block">Tier Name</Label>
              <Input
                placeholder="e.g., Wholesale, Bulk Saver"
                value={ruleForm.tier_name}
                onChange={(e) => setRuleForm({...ruleForm, tier_name: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Min Quantity *</Label>
                <Input
                  type="number"
                  value={ruleForm.min_quantity}
                  onChange={(e) => setRuleForm({...ruleForm, min_quantity: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Max Quantity (Optional)</Label>
                <Input
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={ruleForm.max_quantity || ''}
                  onChange={(e) => setRuleForm({...ruleForm, max_quantity: e.target.value ? parseInt(e.target.value) : null})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Discount Type</Label>
                <Select value={ruleForm.discount_type} onValueChange={(value) => setRuleForm({...ruleForm, discount_type: value})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="percentage" className="text-white">Percentage Off</SelectItem>
                    <SelectItem value="fixed_amount" className="text-white">$ Off Per Unit</SelectItem>
                    <SelectItem value="fixed_price" className="text-white">Fixed Price Per Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">
                  {ruleForm.discount_type === 'percentage' ? 'Discount %' : 'Amount ($)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ruleForm.discount_value}
                  onChange={(e) => setRuleForm({...ruleForm, discount_value: parseFloat(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            {selectedProduct && ruleForm.discount_value > 0 && (
              <div className="p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
                <h4 className="text-green-300 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Pricing Preview
                </h4>
                {(() => {
                  const calc = calculatePricing();
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">Regular Price</p>
                        <p className="text-white font-bold text-lg">${calc.basePrice.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-green-400 text-xs mb-1">Bulk Price</p>
                        <p className="text-green-300 font-black text-lg">${calc.finalPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-cyan-400 text-xs mb-1">You Save</p>
                        <p className="text-cyan-300 font-bold text-lg">
                          ${calc.savings.toFixed(2)} ({calc.savingsPercent.toFixed(0)}%)
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!ruleForm.product_id || ruleForm.min_quantity < 1}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {editingRule ? 'Update' : 'Create'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}