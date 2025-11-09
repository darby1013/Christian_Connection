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
  Download, Plus, Search, TrendingUp, Eye, Edit, Trash2,
  DollarSign, FileText, Star, Upload, File
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminDigitalProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'ebook',
    file_url: '',
    thumbnail_url: '',
    file_size: '',
    format: '',
    is_published: false
  });

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['digitalProducts'],
    queryFn: () => base44.entities.DigitalProduct.list('-created_date'),
    initialData: [],
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.DigitalProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DigitalProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.DigitalProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      const fileFormat = file.name.split('.').pop().toUpperCase();
      
      setProductForm(prev => ({
        ...prev,
        file_url,
        file_size: fileSize,
        format: fileFormat
      }));
    } catch (error) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProductForm(prev => ({ ...prev, thumbnail_url: file_url }));
    } catch (error) {
      alert('Error uploading thumbnail: ' + error.message);
    }
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productForm });
    } else {
      createProductMutation.mutate({ ...productForm, downloads_count: 0 });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this digital product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      category: 'ebook',
      file_url: '',
      thumbnail_url: '',
      file_size: '',
      format: '',
      is_published: false
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.downloads_count || 0)), 0);
  const publishedProducts = products.filter(p => p.is_published).length;
  const totalDownloads = products.reduce((sum, p) => sum + (p.downloads_count || 0), 0);

  const getCategoryIcon = (category) => {
    const icons = {
      ebook: FileText,
      course: Star,
      audio: File,
      video: Eye,
      template: Edit,
      software: Download
    };
    return icons[category] || Download;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Digital Products</h2>
          <p className="text-slate-400 font-semibold">Manage downloadable products</p>
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
                {editingProduct ? 'Edit Digital Product' : 'Add New Digital Product'}
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

              <div className="grid grid-cols-2 gap-4">
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
                  <Label className="text-white mb-2 block">Category</Label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="ebook">E-book</option>
                    <option value="course">Course</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                    <option value="template">Template</option>
                    <option value="software">Software</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Product File *</Label>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {uploadingFile && <Badge className="bg-amber-500 mt-2">Uploading...</Badge>}
                {productForm.file_url && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ File uploaded ({productForm.file_size}) - {productForm.format}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Thumbnail</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {productForm.thumbnail_url && (
                  <img src={productForm.thumbnail_url} alt="Thumbnail" className="mt-2 w-full h-40 object-cover rounded" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productForm.is_published}
                  onChange={(e) => setProductForm({...productForm, is_published: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">Publish immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!productForm.name || !productForm.file_url} className="bg-cyan-500 hover:bg-cyan-600">
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
              <Download className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500">{products.length}</Badge>
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
            <p className="text-2xl font-black text-white mb-1">${totalRevenue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalDownloads}</p>
            <p className="text-slate-400 text-sm font-semibold">Downloads</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{publishedProducts}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{publishedProducts}</p>
            <p className="text-slate-400 text-sm font-semibold">Published</p>
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
        {filteredProducts.map((product) => {
          const CategoryIcon = getCategoryIcon(product.category);
          
          return (
            <Card key={product.id} className="bg-[#1a1f3a] border-slate-700">
              <div className="relative aspect-video bg-slate-800">
                {product.thumbnail_url ? (
                  <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CategoryIcon className="w-16 h-16 text-slate-600" />
                  </div>
                )}
                <Badge className={`absolute top-3 right-3 ${product.is_published ? 'bg-green-500' : 'bg-slate-500'}`}>
                  {product.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <CardContent className="p-5">
                <h3 className="text-white font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-green-400 font-black text-xl">${product.price?.toFixed(2)}</p>
                  <Badge className="bg-blue-500 capitalize">{product.category}</Badge>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-slate-400">{product.file_size}</span>
                  <span className="text-cyan-400">{product.downloads_count || 0} downloads</span>
                </div>
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
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Download className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Digital Products</h3>
            <p className="text-slate-400 mb-6">Add your first digital product</p>
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