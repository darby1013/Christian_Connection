import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Package, Plus, Edit, Trash2, Gift, DollarSign,
  ShoppingBag, Star, Layers, X, Check
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

export default function AdminProductBundles() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bundleForm, setBundleForm] = useState({
    bundle_name: '',
    description: '',
    bundle_price: 0,
    category: '',
    stock_quantity: 10,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: bundles = [] } = useQuery({
    queryKey: ['productBundles'],
    queryFn: () => base44.entities.ProductBundle.list('-created_date'),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const createBundleMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductBundle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBundles'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateBundleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductBundle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBundles'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteBundleMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductBundle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBundles'] });
    },
  });

  const addProductToBundle = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || selectedProducts.find(p => p.product_id === productId)) return;

    setSelectedProducts([...selectedProducts, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1
    }]);
  };

  const removeProductFromBundle = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
  };

  const calculateBundlePricing = () => {
    const regularPrice = selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const savings = regularPrice - bundleForm.bundle_price;
    const savingsPercent = regularPrice > 0 ? (savings / regularPrice) * 100 : 0;

    return { regularPrice, savings, savingsPercent };
  };

  const handleSubmit = () => {
    const { regularPrice, savings, savingsPercent } = calculateBundlePricing();

    const data = {
      ...bundleForm,
      products: selectedProducts,
      regular_price: regularPrice,
      savings_amount: savings,
      savings_percentage: savingsPercent
    };

    if (editingBundle) {
      updateBundleMutation.mutate({ id: editingBundle.id, data });
    } else {
      createBundleMutation.mutate(data);
    }
  };

  const handleEdit = (bundle) => {
    setEditingBundle(bundle);
    setBundleForm(bundle);
    setSelectedProducts(bundle.products || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setBundleForm({
      bundle_name: '',
      description: '',
      bundle_price: 0,
      category: '',
      stock_quantity: 10,
      is_active: true
    });
    setSelectedProducts([]);
    setEditingBundle(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Product Bundles</h2>
          <p className="text-slate-400 font-semibold">Create value packs and combo deals</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Create Bundle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{bundles.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{bundles.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Bundles</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {bundles.filter(b => b.is_active).length}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Active Bundles</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {bundles.reduce((sum, b) => sum + (b.units_sold || 0), 0)}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Bundles Sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Bundles List */}
      <div className="grid gap-4">
        {bundles.map((bundle) => {
          const savings = ((bundle.regular_price - bundle.bundle_price) / bundle.regular_price) * 100;
          return (
            <Card key={bundle.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-black text-xl mb-1">{bundle.bundle_name}</h3>
                        <p className="text-slate-400 text-sm mb-2">{bundle.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-purple-500">{bundle.products?.length || 0} products</Badge>
                          <Badge className="bg-red-500 text-lg font-black">
                            SAVE {savings.toFixed(0)}%
                          </Badge>
                          {bundle.is_active ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-500">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEdit(bundle)} className="bg-cyan-500 hover:bg-cyan-600">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Delete this bundle?')) {
                              deleteBundleMutation.mutate(bundle.id);
                            }
                          }}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-900/50 rounded text-center">
                        <p className="text-slate-400 text-xs">Regular Price</p>
                        <p className="text-slate-300 font-bold line-through">${bundle.regular_price?.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-green-900/20 border border-green-500/30 rounded text-center">
                        <p className="text-green-400 text-xs">Bundle Price</p>
                        <p className="text-green-300 font-black text-xl">${bundle.bundle_price?.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded text-center">
                        <p className="text-cyan-400 text-xs">Total Savings</p>
                        <p className="text-cyan-300 font-bold">${bundle.savings_amount?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bundle Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black">
              {editingBundle ? 'Edit Bundle' : 'Create Product Bundle'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Bundle Name *</Label>
                <Input
                  placeholder="e.g., Faith Starter Pack"
                  value={bundleForm.bundle_name}
                  onChange={(e) => setBundleForm({...bundleForm, bundle_name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Category</Label>
                <Input
                  placeholder="e.g., Apparel, Books"
                  value={bundleForm.category}
                  onChange={(e) => setBundleForm({...bundleForm, category: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Description</Label>
              <Textarea
                placeholder="Describe this bundle..."
                value={bundleForm.description}
                onChange={(e) => setBundleForm({...bundleForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white font-bold">Bundle Products ({selectedProducts.length})</Label>
              </div>
              <Select onValueChange={addProductToBundle}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white mb-3">
                  <SelectValue placeholder="Add product to bundle" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id} className="text-white">
                      {product.name} - ${product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedProducts.map((item, idx) => {
                  const product = products.find(p => p.id === item.product_id);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <div className="w-12 h-12 rounded overflow-hidden">
                        {product?.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{product?.name}</p>
                        <p className="text-slate-400 text-xs">${product?.price?.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newProducts = [...selectedProducts];
                          newProducts[idx].quantity = parseInt(e.target.value) || 1;
                          setSelectedProducts(newProducts);
                        }}
                        className="w-20 bg-slate-900 border-slate-700 text-white"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeProductFromBundle(item.product_id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Bundle Price ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bundleForm.bundle_price}
                      onChange={(e) => setBundleForm({...bundleForm, bundle_price: parseFloat(e.target.value) || 0})}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Stock Quantity</Label>
                    <Input
                      type="number"
                      value={bundleForm.stock_quantity}
                      onChange={(e) => setBundleForm({...bundleForm, stock_quantity: parseInt(e.target.value) || 0})}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {bundleForm.bundle_price > 0 && (
                  <div className="p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
                    {(() => {
                      const { regularPrice, savings, savingsPercent } = calculateBundlePricing();
                      return (
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Regular Price</p>
                            <p className="text-slate-300 font-bold text-lg line-through">
                              ${regularPrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-green-400 text-xs mb-1">Bundle Price</p>
                            <p className="text-green-300 font-black text-2xl">
                              ${bundleForm.bundle_price.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-cyan-400 text-xs mb-1">Customer Saves</p>
                            <p className="text-cyan-300 font-bold text-lg">
                              ${savings.toFixed(2)} ({savingsPercent.toFixed(0)}%)
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!bundleForm.bundle_name || selectedProducts.length < 2 || bundleForm.bundle_price === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {editingBundle ? 'Update' : 'Create'} Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}