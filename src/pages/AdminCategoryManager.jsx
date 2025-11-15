import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { FolderTree, Plus, Edit, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminCategoryManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const queryClient = useQueryClient();

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    slug: '',
    parent_category_id: '',
    image_url: '',
    display_order: 0,
    is_active: true
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    }
  });

  const resetForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      slug: '',
      parent_category_id: '',
      image_url: '',
      display_order: 0,
      is_active: true
    });
    setEditingCategory(null);
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCategoryForm(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = () => {
    const data = {
      ...categoryForm,
      slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
      display_order: parseInt(categoryForm.display_order) || 0
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { 
      header: 'Category', 
      key: 'name',
      render: (_, cat) => (
        <div className="flex items-center gap-3">
          {cat.image_url && (
            <img src={cat.image_url} alt="" className="w-12 h-12 object-cover rounded" />
          )}
          <div>
            <p className="text-white font-bold">{cat.name}</p>
            <p className="text-slate-400 text-xs">{cat.slug}</p>
          </div>
        </div>
      )
    },
    { header: 'Description', key: 'description', render: (val) => <span className="text-slate-300 text-sm">{val || '-'}</span> },
    { header: 'Order', key: 'display_order', render: (val) => <Badge className="bg-cyan-500">{val || 0}</Badge> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Category Manager"
        subtitle="Organize your products with categories and sub-categories"
        icon={FolderTree}
        badge="ENTERPRISE"
        actions={[
          { label: 'New Category', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{categories.length}</p>
            <p className="text-purple-300 text-sm font-bold">Total Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{categories.filter(c => c.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{categories.filter(c => c.parent_category_id).length}</p>
            <p className="text-blue-300 text-sm font-bold">Sub-Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{categories.filter(c => c.image_url).length}</p>
            <p className="text-amber-300 text-sm font-bold">With Images</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={categories}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (cat) => {
            setEditingCategory(cat);
            setCategoryForm(cat);
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (cat) => {
            if (confirm('Delete this category?')) deleteMutation.mutate(cat.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-white">Category Name *</Label>
              <Input 
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Slug (URL-friendly name)</Label>
              <Input 
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                placeholder="auto-generated if empty"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea 
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Display Order</Label>
                <Input 
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({...categoryForm, display_order: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                  />
                  <span className="text-white">Active</span>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-white flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4" />
                Category Image
              </Label>
              {categoryForm.image_url && (
                <img src={categoryForm.image_url} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
              )}
              <Input 
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="bg-slate-900 border-slate-700 text-white"
              />
              {uploadingImage && <p className="text-cyan-400 text-sm mt-2">Uploading...</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}