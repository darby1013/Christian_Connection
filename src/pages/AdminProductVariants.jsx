import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Package, Plus, Search, Edit, Trash2, Palette, Ruler, Box
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminProductVariants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  const [variantForm, setVariantForm] = useState({
    product_id: '',
    size: 'M',
    color: '',
    color_hex: '#000000',
    material: '100% Cotton',
    brand: '',
    fit_type: 'Regular',
    stock_quantity: 0,
    sku: '',
    price_adjustment: 0,
    weight: '',
    is_available: true
  });

  const queryClient = useQueryClient();

  const { data: variants = [] } = useQuery({
    queryKey: ['productVariants'],
    queryFn: () => base44.entities.ProductVariant.list('-created_date'),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const createVariantMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductVariant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductVariant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductVariant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants'] });
    },
  });

  const handleSubmit = () => {
    if (editingVariant) {
      updateVariantMutation.mutate({ id: editingVariant.id, data: variantForm });
    } else {
      createVariantMutation.mutate(variantForm);
    }
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setVariantForm(variant);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this variant?')) {
      deleteVariantMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setVariantForm({
      product_id: '',
      size: 'M',
      color: '',
      color_hex: '#000000',
      material: '100% Cotton',
      brand: '',
      fit_type: 'Regular',
      stock_quantity: 0,
      sku: '',
      price_adjustment: 0,
      weight: '',
      is_available: true
    });
    setEditingVariant(null);
  };

  const filteredVariants = variants.filter(v =>
    v.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  const availableVariants = variants.filter(v => v.is_available).length;
  const uniqueProducts = new Set(variants.map(v => v.product_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Product Variants</h2>
          <p className="text-slate-400 font-semibold">Manage product sizes, colors, and styles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingVariant ? 'Edit Variant' : 'Add New Variant'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Product *</Label>
                <select
                  value={variantForm.product_id}
                  onChange={(e) => setVariantForm({...variantForm, product_id: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Size *</Label>
                  <select
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({...variantForm, size: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                    <option value="3XL">3XL</option>
                    <option value="4XL">4XL</option>
                  </select>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Color *</Label>
                  <Input
                    placeholder="e.g., Navy Blue"
                    value={variantForm.color}
                    onChange={(e) => setVariantForm({...variantForm, color: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Color Hex</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={variantForm.color_hex}
                      onChange={(e) => setVariantForm({...variantForm, color_hex: e.target.value})}
                      className="w-16 h-10 bg-slate-900/50 border-slate-700"
                    />
                    <Input
                      placeholder="#000000"
                      value={variantForm.color_hex}
                      onChange={(e) => setVariantForm({...variantForm, color_hex: e.target.value})}
                      className="flex-1 bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Material</Label>
                  <select
                    value={variantForm.material}
                    onChange={(e) => setVariantForm({...variantForm, material: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="100% Cotton">100% Cotton</option>
                    <option value="Cotton Blend">Cotton Blend</option>
                    <option value="Polyester">Polyester</option>
                    <option value="Tri-Blend">Tri-Blend</option>
                    <option value="Organic Cotton">Organic Cotton</option>
                    <option value="Performance Fabric">Performance Fabric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Fit Type</Label>
                  <select
                    value={variantForm.fit_type}
                    onChange={(e) => setVariantForm({...variantForm, fit_type: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Slim">Slim</option>
                    <option value="Relaxed">Relaxed</option>
                    <option value="Athletic">Athletic</option>
                    <option value="Oversized">Oversized</option>
                  </select>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Brand</Label>
                  <Input
                    placeholder="e.g., Bella+Canvas"
                    value={variantForm.brand}
                    onChange={(e) => setVariantForm({...variantForm, brand: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Stock</Label>
                  <Input
                    type="number"
                    value={variantForm.stock_quantity}
                    onChange={(e) => setVariantForm({...variantForm, stock_quantity: parseInt(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">SKU</Label>
                  <Input
                    placeholder="SKU"
                    value={variantForm.sku}
                    onChange={(e) => setVariantForm({...variantForm, sku: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Price +/-</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variantForm.price_adjustment}
                    onChange={(e) => setVariantForm({...variantForm, price_adjustment: parseFloat(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={variantForm.is_available}
                  onChange={(e) => setVariantForm({...variantForm, is_available: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">Available for sale</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!variantForm.product_id || !variantForm.size || !variantForm.color} className="bg-cyan-500 hover:bg-cyan-600">
                {editingVariant ? 'Update' : 'Create'} Variant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{variants.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{variants.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Variants</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Box className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalStock}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Stock</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Palette className="w-8 h-8 text-pink-400" />
              <Badge className="bg-pink-500">{availableVariants}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{availableVariants}</p>
            <p className="text-slate-400 text-sm font-semibold">Available</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Ruler className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{uniqueProducts}</p>
            <p className="text-slate-400 text-sm font-semibold">Products</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search variants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Product</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Size</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Color</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Material</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Stock</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">SKU</th>
                <th className="text-right p-4 text-slate-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVariants.map((variant) => (
                <tr key={variant.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-4">
                    <p className="text-white font-semibold">{getProductName(variant.product_id)}</p>
                  </td>
                  <td className="p-4">
                    <Badge className="bg-blue-500">{variant.size}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-slate-600"
                        style={{ backgroundColor: variant.color_hex }}
                      />
                      <span className="text-white">{variant.color}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300">{variant.material}</p>
                  </td>
                  <td className="p-4">
                    <Badge className={variant.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {variant.stock_quantity}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300 font-mono text-sm">{variant.sku}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => handleEdit(variant)} className="bg-cyan-500 hover:bg-cyan-600">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(variant.id)}
                        className="border-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredVariants.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Variants</h3>
            <p className="text-slate-400 mb-6">Add variants for your products</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add First Variant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}