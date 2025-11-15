import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { FolderTree, Plus, Edit, Trash2, Upload } from 'lucide-react';

export default function AdminCategoryManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    slug: '',
    parent_category_id: '',
    image_url: '',
    display_order: 0,
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => base44.entities.ProductCategory.list('-display_order'),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productCategories']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productCategories']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['productCategories']);
    }
  });

  const handleImageUpload = async (file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCategoryForm(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      alert('Error uploading image');
    }
  };

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

  const handleSubmit = () => {
    const data = {
      ...categoryForm,
      display_order: parseInt(categoryForm.display_order) || 0
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getProductCount = (categoryName) => {
    return products.filter(p => p.category === categoryName).length;
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
    { header: 'Description', key: 'description', render: (val) => <span className="text-slate-300">{val || 'N/A'}</span> },
    { header: 'Products', key: 'name', render: (name) => <Badge className="bg-cyan-500">{getProductCount(name)}</Badge> },
    { header: 'Order', key: 'display_order', render: (val) => <span className="text-slate-300">{val}</span> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Category Management"
        subtitle="Organize products with categories and subcategories"
        icon={FolderTree}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Category', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
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
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{products.length}</p>
            <p className="text-cyan-300 text-sm font-bold">Total Products</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={categories}
        actions={[
          {
            label: 'Edit',
            icon: Edit,
            onClick: (cat) => {
              setEditingCategory(cat);
              setCategoryForm({
                name: cat.name,
                description: cat.description || '',
                slug: cat.slug || '',
                parent_category_id: cat.parent_category_id || '',
                image_url: cat.image_url || '',
                display_order: cat.display_order || 0,
                is_active: cat.is_active
              });
              setShowDialog(true);
            }
          },
          {
            label: 'Delete',
            icon: Trash2,
            onClick: (cat) => {
              if (confirm(`Delete category "${cat.name}"?`)) {
                deleteMutation.mutate(cat.id);
              }
            }
          }
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Category Name *</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Slug (URL-friendly)</Label>
                <Input
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g., worship-music"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white h-20"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Display Order</Label>
                <Input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Parent Category</Label>
                <select
                  value={categoryForm.parent_category_id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parent_category_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="">None (Top Level)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Category Image</Label>
              {categoryForm.image_url && (
                <img src={categoryForm.image_url} alt="" className="w-32 h-32 object-cover rounded-lg mb-2" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={categoryForm.is_active}
                onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
              />
              <Label className="text-white">Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="flex-1 border-slate-600"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}