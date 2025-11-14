import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Package, Plus, Upload, Trash2, Edit, Image as ImageIcon, Download, Sparkles } from 'lucide-react';

export default function AdminProductsEnhanced() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    stock_quantity: '',
    sku: '',
    is_featured: false,
    is_digital: false
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['productsAdmin'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: [],
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsAdmin'] });
      setDialogOpen(false);
      resetForm();
      alert('✅ Product created!');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsAdmin'] });
      setDialogOpen(false);
      resetForm();
      alert('✅ Product updated!');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsAdmin'] });
    }
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setUploadedImages([...uploadedImages, ...urls]);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const productData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      compare_at_price: parseFloat(formData.compare_at_price) || null,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      images: uploadedImages
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      compare_at_price: product.compare_at_price || '',
      category: product.category || '',
      stock_quantity: product.stock_quantity || '',
      sku: product.sku || '',
      is_featured: product.is_featured || false,
      is_digital: product.is_digital || false
    });
    setUploadedImages(product.images || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      compare_at_price: '',
      category: '',
      stock_quantity: '',
      sku: '',
      is_featured: false,
      is_digital: false
    });
    setUploadedImages([]);
    setEditingProduct(null);
  };

  const columns = [
    { 
      header: 'Product', 
      key: 'name',
      render: (_, product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 rounded overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-bold">{product.name}</p>
            <p className="text-slate-400 text-xs">{product.sku}</p>
          </div>
        </div>
      )
    },
    { header: 'Category', key: 'category' },
    { 
      header: 'Price', 
      key: 'price',
      render: (price) => <span className="text-green-400 font-bold">${price}</span>
    },
    { 
      header: 'Stock', 
      key: 'stock_quantity',
      render: (stock) => (
        <Badge className={stock > 10 ? 'bg-green-500' : stock > 0 ? 'bg-amber-500' : 'bg-red-500'}>
          {stock} units
        </Badge>
      )
    },
    {
      header: 'Status',
      key: 'is_featured',
      render: (_, product) => (
        <div className="flex gap-1">
          {product.is_featured && <Badge className="bg-purple-500">Featured</Badge>}
          {product.is_digital && <Badge className="bg-cyan-500">Digital</Badge>}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Enhanced Product Management"
        subtitle="Enterprise-grade product catalog with image uploads & digital downloads"
        icon={Package}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Product', icon: Plus, onClick: () => setDialogOpen(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-black text-white">{products.length}</p>
            <p className="text-cyan-300 text-sm font-bold">Total Products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-black text-white">{products.filter(p => (p.stock_quantity || 0) > 0).length}</p>
            <p className="text-green-300 text-sm font-bold">In Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-black text-white">{products.filter(p => p.is_featured).length}</p>
            <p className="text-purple-300 text-sm font-bold">Featured</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-black text-white">{products.filter(p => p.is_digital).length}</p>
            <p className="text-amber-300 text-sm font-bold">Digital</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={products}
        actions={[
          { label: 'Edit', icon: Edit, onClick: openEditDialog },
          { label: 'Delete', icon: Trash2, onClick: (product) => {
            if (confirm('Delete this product?')) deleteProductMutation.mutate(product.id);
          }}
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white font-bold text-sm mb-2 block">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-white font-bold text-sm mb-2 block">SKU</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white h-24"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-white font-bold text-sm mb-2 block">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-white font-bold text-sm mb-2 block">Compare Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({...formData, compare_at_price: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-white font-bold text-sm mb-2 block">Stock Quantity</label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Category</label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Product Images</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden bg-slate-800">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setUploadedImages(uploadedImages.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:border-cyan-500 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-slate-400 text-sm">Upload Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.is_featured}
                  onCheckedChange={(val) => setFormData({...formData, is_featured: val})}
                />
                <span className="text-white text-sm">Featured Product</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.is_digital}
                  onCheckedChange={(val) => setFormData({...formData, is_digital: val})}
                />
                <span className="text-white text-sm">Digital Download</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}