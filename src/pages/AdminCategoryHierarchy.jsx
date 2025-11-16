import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { FolderTree, Plus, Edit, Trash2, ChevronRight, ChevronDown, Upload, Download } from 'lucide-react';

export default function AdminCategoryHierarchy() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
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
    queryFn: () => base44.entities.ProductCategory.list('display_order'),
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
    onSuccess: () => queryClient.invalidateQueries(['categories'])
  });

  const resetForm = () => {
    setForm({
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
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const buildTree = (cats, parentId = null) => {
    return cats
      .filter(c => c.parent_category_id === parentId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  const renderTree = (parentId = null, level = 0) => {
    const children = buildTree(categories, parentId);
    
    return children.map(cat => {
      const hasChildren = categories.some(c => c.parent_category_id === cat.id);
      const isExpanded = expandedCategories.has(cat.id);
      
      return (
        <div key={cat.id}>
          <Card className="bg-slate-900/30 border-slate-700 mb-2" style={{ marginLeft: `${level * 24}px` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasChildren && (
                    <button onClick={() => toggleExpand(cat.id)}>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-cyan-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </button>
                  )}
                  {!hasChildren && <div className="w-5"></div>}
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FolderTree className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold">{cat.name}</p>
                    <p className="text-slate-400 text-xs">{cat.slug}</p>
                  </div>
                  <Badge className={cat.is_active ? 'bg-green-500' : 'bg-red-500'}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => {
                    setEditingCategory(cat);
                    setForm(cat);
                    setShowDialog(true);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm('Delete this category?')) deleteMutation.mutate(cat.id);
                  }}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {isExpanded && renderTree(cat.id, level + 1)}
        </div>
      );
    });
  };

  const parentCategories = categories.filter(c => !c.parent_category_id);
  const totalSubcategories = categories.filter(c => c.parent_category_id).length;

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Category Hierarchy"
        subtitle="Manage product categories with unlimited nesting"
        icon={FolderTree}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Category', icon: Plus, onClick: () => setShowDialog(true) },
          { label: 'Import', icon: Upload, onClick: () => alert('Import feature') },
          { label: 'Export', icon: Download, onClick: () => alert('Export feature') }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{categories.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{parentCategories.length}</p>
            <p className="text-purple-300 text-sm font-bold">Parent Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{totalSubcategories}</p>
            <p className="text-green-300 text-sm font-bold">Subcategories</p>
          </CardContent>
        </Card>
      </div>

      <div>
        {renderTree()}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Category Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-24" />
            </div>
            <div>
              <Label className="text-white">Parent Category</Label>
              <select value={form.parent_category_id} onChange={(e) => setForm({...form, parent_category_id: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded">
                <option value="">None (Root Level)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({...form, display_order: parseInt(e.target.value)})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({...form, image_url: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}