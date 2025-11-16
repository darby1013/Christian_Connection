import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Layers, Plus, Edit, Trash2, Star } from 'lucide-react';

export default function AdminCollectionManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    product_ids: [],
    is_featured: false,
    is_active: true,
    display_order: 0
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => base44.entities.ProductCollection.list(),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductCollection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductCollection.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['collections'])
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      slug: '',
      image_url: '',
      product_ids: [],
      is_featured: false,
      is_active: true,
      display_order: 0
    });
    setSelectedProducts([]);
    setEditingCollection(null);
  };

  const handleSubmit = () => {
    const data = { ...form, product_ids: selectedProducts };
    if (editingCollection) {
      updateMutation.mutate({ id: editingCollection.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { 
      header: 'Collection', 
      key: 'name',
      render: (_, col) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden">
            {col.image_url && <img src={col.image_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="text-white font-bold">{col.name}</p>
            <p className="text-slate-400 text-xs">{col.slug}</p>
          </div>
        </div>
      )
    },
    { header: 'Products', key: 'product_ids', render: (val) => <Badge className="bg-cyan-500">{val?.length || 0}</Badge> },
    { header: 'Featured', key: 'is_featured', render: (val) => val ? <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> : null },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Collection Manager"
        subtitle="Curate product collections for easier browsing"
        icon={Layers}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Collection', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{collections.length}</p>
            <p className="text-purple-300 text-sm font-bold">Total Collections</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{collections.filter(c => c.is_featured).length}</p>
            <p className="text-yellow-300 text-sm font-bold">Featured</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{collections.filter(c => c.is_active).length}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              {collections.reduce((sum, c) => sum + (c.product_ids?.length || 0), 0)}
            </p>
            <p className="text-blue-300 text-sm font-bold">Total Products</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={collections}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (col) => {
            setEditingCollection(col);
            setForm(col);
            setSelectedProducts(col.product_ids || []);
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (col) => {
            if (confirm('Delete this collection?')) deleteMutation.mutate(col.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingCollection ? 'Edit Collection' : 'Create Collection'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Collection Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-20" />
            </div>
            <div>
              <Label className="text-white">Image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({...form, image_url: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white mb-2 block">Select Products ({selectedProducts.length} selected)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto bg-slate-900 p-4 rounded-lg border border-slate-700">
                {products.map(product => (
                  <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-white text-sm">{product.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({...form, is_featured: e.target.checked})} />
                <Label className="text-white">Featured Collection</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
                <Label className="text-white">Active</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingCollection ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}