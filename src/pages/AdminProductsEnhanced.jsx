import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Package, Plus, Upload, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

export default function AdminProductsEnhanced() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const queryClient = useQueryClient();

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    stock_quantity: '',
    sku: '',
    weight: '',
    dimensions: '',
    variants: '[]',
    images: [],
    is_digital: false,
    download_url: '',
    tags: ''
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: []
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    }
  });

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      compare_at_price: '',
      category: '',
      stock_quantity: '',
      sku: '',
      weight: '',
      dimensions: '',
      variants: '[]',
      images: [],
      is_digital: false,
      download_url: '',
      tags: ''
    });
    setEditingProduct(null);
  };

  const handleImageUpload = async (files) => {
    setUploadingImages(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (error) {
      alert('Error uploading images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = () => {
    const data = {
      ...productForm,
      price: parseFloat(productForm.price),
      compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      images: JSON.stringify(productForm.images)
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const columns = [
    { 
      header: 'Product', 
      key: 'name',
      render: (_, product) => (
        <div className="flex items-center gap-3">
          <img src={product.images?.[0] || '/placeholder.jpg'} alt="" className="w-12 h-12 object-cover rounded" />
          <div>
            <p className="text-white font-bold">{product.name}</p>
            <p className="text-slate-400 text-xs">{product.sku}</p>
          </div>
        </div>
      )
    },
    { header: 'Category', key: 'category', render: (val) => <Badge className="bg-purple-500">{val || 'Uncategorized'}</Badge> },
    { header: 'Price', key: 'price', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Stock', key: 'stock_quantity', render: (val) => <Badge className={val > 0 ? 'bg-green-500' : 'bg-red-500'}>{val || 0}</Badge> },
    { header: 'Type', key: 'is_digital', render: (val) => <Badge className={val ? 'bg-cyan-500' : 'bg-slate-600'}>{val ? 'Digital' : 'Physical'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Products Management"
        subtitle="Enhanced product catalog with image uploads & digital downloads"
        icon={Package}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Product', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{products.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{products.filter(p => p.stock_quantity > 0).length}</p>
            <p className="text-green-300 text-sm font-bold">In Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{products.filter(p => p.stock_quantity === 0).length}</p>
            <p className="text-red-300 text-sm font-bold">Out of Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{products.filter(p => p.is_digital).length}</p>
            <p className="text-purple-300 text-sm font-bold">Digital Products</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={products}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (product) => {
            setEditingProduct(product);
            setProductForm({
              ...product,
              images: product.images ? JSON.parse(product.images) : [],
              price: product.price?.toString() || '',
              compare_at_price: product.compare_at_price?.toString() || '',
              stock_quantity: product.stock_quantity?.toString() || ''
            });
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (product) => {
            if (confirm('Delete this product?')) deleteProductMutation.mutate(product.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Product Name *</Label>
                <Input 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">SKU</Label>
                <Input 
                  value={productForm.sku}
                  onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea 
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-24"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Price *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Compare At Price</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={productForm.compare_at_price}
                  onChange={(e) => setProductForm({...productForm, compare_at_price: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Stock Quantity</Label>
                <Input 
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Category</Label>
                <Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Tags (comma-separated)</Label>
                <Input 
                  value={productForm.tags}
                  onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                  placeholder="sale, featured, new"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4" />
                Product Images
              </Label>
              <div className="grid grid-cols-4 gap-4 mb-3">
                {productForm.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                      onClick={() => setProductForm({...productForm, images: productForm.images.filter((_, idx) => idx !== i)})}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Input 
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(Array.from(e.target.files || []))}
                className="bg-slate-900 border-slate-700 text-white"
              />
              {uploadingImages && <p className="text-cyan-400 text-sm mt-2">Uploading images...</p>}
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={productForm.is_digital}
                onChange={(e) => setProductForm({...productForm, is_digital: e.target.checked})}
              />
              <Label className="text-white">Digital Product (downloadable)</Label>
            </div>

            {productForm.is_digital && (
              <div>
                <Label className="text-white">Download URL</Label>
                <Input 
                  value={productForm.download_url}
                  onChange={(e) => setProductForm({...productForm, download_url: e.target.value})}
                  placeholder="https://..."
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}