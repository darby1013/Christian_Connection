import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseStats from '../components/admin/EnterpriseStats';
import { FileText, Plus, Upload, Download, DollarSign, TrendingUp, Package } from 'lucide-react';

export default function AdminDigitalProducts() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'ebook',
    price: 0,
    file_url: '',
    thumbnail_url: '',
    file_size: '',
    file_format: '',
    source_type: 'manual',
    tags: []
  });
  const queryClient = useQueryClient();

  const { data: digitalProducts = [] } = useQuery({
    queryKey: ['digitalProducts'],
    queryFn: () => base44.entities.DigitalProduct.list('-created_date'),
    initialData: []
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['digitalPurchases'],
    queryFn: () => base44.entities.DigitalPurchase.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DigitalProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['digitalProducts']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DigitalProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['digitalProducts']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DigitalProduct.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['digitalProducts'])
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'ebook',
      price: 0,
      file_url: '',
      thumbnail_url: '',
      file_size: '',
      file_format: '',
      source_type: 'manual',
      tags: []
    });
    setEditingProduct(null);
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadFileMutation.mutateAsync(file);
      setFormData({ ...formData, [field]: url });
    }
  };

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const totalDownloads = digitalProducts.reduce((sum, p) => sum + (p.download_count || 0), 0);

  const stats = [
    { title: 'Total Products', value: digitalProducts.length, icon: Package, color: 'cyan' },
    { title: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign, trend: 'up', trendValue: '+12%', color: 'green' },
    { title: 'Total Downloads', value: totalDownloads, icon: Download, color: 'purple' },
    { title: 'Active Products', value: digitalProducts.filter(p => p.is_active).length, icon: TrendingUp, color: 'blue' }
  ];

  const columns = [
    { header: 'Product', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Category', key: 'category', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Price', key: 'price', render: (val) => <span className="text-cyan-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Downloads', key: 'download_count', render: (val) => <span className="text-green-400">{val || 0}</span> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  const actions = [
    { label: 'Edit', icon: FileText, onClick: (product) => { setEditingProduct(product); setFormData(product); setShowDialog(true); } },
    { label: 'Delete', icon: FileText, onClick: (product) => { if (confirm('Delete this product?')) deleteMutation.mutate(product.id); } }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Digital Products"
        subtitle="Manage ebooks, courses, transcripts, and more"
        icon={FileText}
        badge="DIGITAL"
        actions={[
          { label: 'Add Product', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <EnterpriseStats stats={stats} />

      <EnterpriseTable columns={columns} data={digitalProducts} actions={actions} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingProduct ? 'Edit Digital Product' : 'Add Digital Product'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Category *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ebook">eBook</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="transcript">Transcript</SelectItem>
                    <SelectItem value="artwork">Artwork</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="flyer">Flyer/Template</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-24"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">File Format</Label>
                <Input
                  value={formData.file_format}
                  onChange={(e) => setFormData({...formData, file_format: e.target.value})}
                  placeholder="PDF, MP3, MP4, etc"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white">Upload Digital File *</Label>
              <Input
                type="file"
                onChange={(e) => handleFileUpload(e, 'file_url')}
                className="bg-slate-900 border-slate-700 text-white"
              />
              {formData.file_url && <p className="text-green-400 text-sm mt-1">✓ File uploaded</p>}
            </div>
            <div>
              <Label className="text-white">Upload Thumbnail</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'thumbnail_url')}
                className="bg-slate-900 border-slate-700 text-white"
              />
              {formData.thumbnail_url && <p className="text-green-400 text-sm mt-1">✓ Thumbnail uploaded</p>}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}