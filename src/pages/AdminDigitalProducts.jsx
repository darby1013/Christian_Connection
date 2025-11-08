import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Plus, Pencil, Trash2, Upload, FileText, Video, Headphones, Package } from "lucide-react";

export default function AdminDigitalProducts() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "ebook",
    file_url: "",
    thumbnail_url: "",
    preview_url: "",
    file_size: "",
    format: "",
    tags: [],
    author: "",
    duration: "",
    is_published: false
  });

  const { data: products = [] } = useQuery({
    queryKey: ['adminDigitalProducts'],
    queryFn: () => base44.entities.DigitalProduct.list('-created_date'),
    initialData: [],
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.DigitalProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDigitalProducts'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DigitalProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDigitalProducts'] });
      setEditingProduct(null);
      resetForm();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.DigitalProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDigitalProducts'] });
    },
  });

  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: 0,
      category: "ebook",
      file_url: "",
      thumbnail_url: "",
      preview_url: "",
      file_size: "",
      format: "",
      tags: [],
      author: "",
      duration: "",
      is_published: false
    });
  };

  const handleFileUpload = async (file, fieldName) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProductForm({...productForm, [fieldName]: file_url});
      
      if (fieldName === 'file_url' && !productForm.file_size) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setProductForm(prev => ({
          ...prev,
          file_url,
          file_size: `${sizeMB} MB`,
          format: file.name.split('.').pop().toUpperCase()
        }));
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

  const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.downloads_count), 0);
  const publishedCount = products.filter(p => p.is_published).length;

  const categoryIcons = {
    ebook: FileText,
    course: Video,
    audio: Headphones,
    video: Video,
    template: Package,
    software: Package
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Total Products</p>
                <p className="text-3xl font-black text-white mt-1">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Published</p>
                <p className="text-3xl font-black text-white mt-1">{publishedCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Total Downloads</p>
                <p className="text-3xl font-black text-white mt-1">
                  {products.reduce((sum, p) => sum + (p.downloads_count || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Revenue</p>
                <p className="text-3xl font-black text-white mt-1">${totalRevenue.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="bg-[#1a1f3a] border-0">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-white font-black text-xl flex items-center gap-2">
            <Download className="w-6 h-6 text-cyan-400" />
            Digital Products
          </CardTitle>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold" onClick={() => { resetForm(); setEditingProduct(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  {editingProduct ? 'Edit Product' : 'Create Digital Product'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold">Product Name</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      placeholder="e.g., Faith & Purpose E-Book"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold">Category</Label>
                    <Select value={productForm.category} onValueChange={(value) => setProductForm({...productForm, category: value})}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="ebook" className="text-white">E-Book</SelectItem>
                        <SelectItem value="course" className="text-white">Course</SelectItem>
                        <SelectItem value="audio" className="text-white">Audio</SelectItem>
                        <SelectItem value="video" className="text-white">Video</SelectItem>
                        <SelectItem value="template" className="text-white">Template</SelectItem>
                        <SelectItem value="software" className="text-white">Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-white font-bold">Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2 h-24"
                    placeholder="Product description..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white font-bold">Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold">Author</Label>
                    <Input
                      value={productForm.author}
                      onChange={(e) => setProductForm({...productForm, author: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold">Duration/Length</Label>
                    <Input
                      value={productForm.duration}
                      onChange={(e) => setProductForm({...productForm, duration: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      placeholder="e.g., 4 hours"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Upload Product File</Label>
                  <Input
                    type="file"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'file_url')}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled={uploading}
                  />
                  {productForm.file_url && (
                    <p className="text-xs text-green-400 mt-2">✓ File uploaded: {productForm.format} ({productForm.file_size})</p>
                  )}
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Thumbnail Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'thumbnail_url')}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled={uploading}
                  />
                  {productForm.thumbnail_url && (
                    <img src={productForm.thumbnail_url} alt="Thumbnail" className="mt-2 w-32 h-32 object-cover rounded" />
                  )}
                </div>

                <div>
                  <Label className="text-white font-bold">Tags (comma separated)</Label>
                  <Input
                    value={productForm.tags?.join(', ') || ''}
                    onChange={(e) => setProductForm({...productForm, tags: e.target.value.split(',').map(t => t.trim())})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                    placeholder="christian, faith, ebook"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <Label className="text-white font-bold">Publish Product</Label>
                    <p className="text-xs text-slate-400">Make visible to customers</p>
                  </div>
                  <Switch
                    checked={productForm.is_published}
                    onCheckedChange={(checked) => setProductForm({...productForm, is_published: checked})}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending || uploading}
                >
                  {uploading ? 'Uploading...' : editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold">Product</TableHead>
                <TableHead className="text-slate-400 font-bold">Category</TableHead>
                <TableHead className="text-slate-400 font-bold">Price</TableHead>
                <TableHead className="text-slate-400 font-bold">Format</TableHead>
                <TableHead className="text-slate-400 font-bold">Downloads</TableHead>
                <TableHead className="text-slate-400 font-bold">Status</TableHead>
                <TableHead className="text-slate-400 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const Icon = categoryIcons[product.category];
                return (
                  <TableRow key={product.id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.thumbnail_url ? (
                          <img src={product.thumbnail_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                            <Icon className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-semibold">{product.name}</p>
                          <p className="text-xs text-slate-400">{product.author}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-500">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-white font-bold">${product.price}</TableCell>
                    <TableCell className="text-slate-300">{product.format}</TableCell>
                    <TableCell className="text-slate-300">{product.downloads_count || 0}</TableCell>
                    <TableCell>
                      <Badge className={product.is_published ? 'bg-green-500' : 'bg-gray-500'}>
                        {product.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}