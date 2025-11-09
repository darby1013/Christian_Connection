import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Store, Plus, Search, TrendingUp, Eye, Edit, Trash2,
  DollarSign, Package, Star, AlertCircle, Upload
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    images: [],
    category: '',
    stock_quantity: 0,
    sku: '',
    status: 'active'
  });

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: [],
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProductForm(prev => ({
        ...prev,
        images: [...(prev.images || []), file_url]
      }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      images: [],
      category: '',
      stock_quantity: 0,
      sku: '',
      status: 'active'
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity || 0), 0);
  const activeProducts = products.filter(p => p.status === 'active').length;
  const outOfStock = products.filter(p => p.stock_quantity === 0).length;

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      draft: 'bg-amber-500',
      out_of_stock: 'bg-red-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Product Management</h2>
          <p className="text-slate-400 font-semibold">Manage your product catalog</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Product Name *</Label>
                <Input
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  placeholder="Product description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Stock</Label>
                  <Input
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({...productForm, stock_quantity: parseInt(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">SKU</Label>
                  <Input
                    placeholder="SKU"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Category</Label>
                  <Input
                    placeholder="e.g., Apparel"
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Status</Label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({...productForm, status: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Product Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {productForm.images && productForm.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {productForm.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`Product ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!productForm.name} className="bg-cyan-500 hover:bg-cyan-600">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{products.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{products.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Products</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalValue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Inventory Value</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{activeProducts}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{activeProducts}</p>
            <p className="text-slate-400 text-sm font-semibold">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <Badge className="bg-red-500">{outOfStock}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{outOfStock}</p>
            <p className="text-slate-400 text-sm font-semibold">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-[#1a1f3a] border-slate-700">
            <div className="relative aspect-square bg-slate-800">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-slate-600" />
                </div>
              )}
              <Badge className={`absolute top-3 right-3 ${getStatusColor(product.status)}`}>
                {product.status}
              </Badge>
            </div>
            <CardContent className="p-5">
              <h3 className="text-white font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-4">
                <p className="text-green-400 font-black text-xl">${product.price?.toFixed(2)}</p>
                <div className="text-slate-400 text-sm">
                  Stock: <span className={product.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'}>{product.stock_quantity}</span>
                </div>
              </div>
              {product.category && (
                <Badge className="bg-purple-500 mb-3">{product.category}</Badge>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(product)} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(product.id)}
                  className="border-red-500/30 text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Products</h3>
            <p className="text-slate-400 mb-6">Add your first product to get started</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}