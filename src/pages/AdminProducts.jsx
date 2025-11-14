
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
  DollarSign, Package, Star, AlertCircle, Upload,
  CheckCircle, AlertTriangle, XCircle // New icons added
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // DialogTrigger removed as it's now controlled by actions

// New imports for Enterprise components
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseStats from '../components/admin/EnterpriseStats';
import EnterpriseTable from '../components/admin/EnterpriseTable';

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
    setProductForm({
      ...product,
      price: product.price || 0, // Ensure price is a number
      stock_quantity: product.stock_quantity || 0, // Ensure stock_quantity is a number
      images: product.images || [], // Ensure images is an array
      status: product.status || 'active' // Ensure status has a default
    });
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

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      draft: 'bg-amber-500',
      out_of_stock: 'bg-red-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  // The filteredProducts is still useful for the EnterpriseTable to handle search
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // New stats array for EnterpriseStats component
  const stats = [
    { title: 'Total Products', value: products.length, icon: Package, color: 'cyan', trend: 'up', trendValue: '+8%' },
    { title: 'In Stock', value: products.filter(p => p.stock_quantity > 0).length, icon: CheckCircle, color: 'green' },
    { title: 'Low Stock', value: products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length, icon: AlertTriangle, color: 'amber' },
    { title: 'Out of Stock', value: products.filter(p => p.stock_quantity === 0).length, icon: XCircle, color: 'red' },
  ];

  // New columns array for EnterpriseTable component
  const columns = [
    {
      header: 'Product',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
            {row.images && row.images[0] ? (
              <img src={row.images[0]} alt={val} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <Package className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-white">{val}</p>
            <p className="text-slate-400 text-xs">{row.category}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      key: 'price',
      render: (val) => <span className="font-bold text-green-400">${val?.toFixed(2)}</span>
    },
    {
      header: 'Stock',
      key: 'stock_quantity',
      render: (val) => (
        <Badge className={val === 0 ? 'bg-red-500' : val < 10 ? 'bg-amber-500' : 'bg-green-500'}>
          {val} units
        </Badge>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => (
        <Badge className={`${getStatusColor(val)} capitalize`}>
          {val.replace(/_/g, ' ')}
        </Badge>
      )
    },
    {
      header: 'Added',
      key: 'created_date',
      render: (val) => new Date(val).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Products"
        subtitle={`${products.length} products in catalog`}
        icon={Package}
        actions={[
          { label: 'Add Product', icon: Plus, onClick: () => { setDialogOpen(true); resetForm(); } },
          { label: 'Import CSV', icon: Upload, onClick: () => alert('Import CSV functionality not yet implemented.') }
        ]}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <EnterpriseStats stats={stats} />

      <EnterpriseTable
        columns={columns}
        data={filteredProducts} // Use filteredProducts to apply the search functionality
        onRowClick={(row) => console.log('Product clicked:', row.name)} // Example click handler
        actions={[
          { label: 'Edit', icon: Edit, onClick: (row) => handleEdit(row) },
          { label: 'Delete', icon: Trash2, onClick: (row) => handleDelete(row.id) }
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
  );
}
