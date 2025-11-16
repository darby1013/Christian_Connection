import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Tag, Plus, Edit, Trash2, Upload } from 'lucide-react';

export default function AdminProductAttributes() {
  const [activeTab, setActiveTab] = useState('brand');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAttr, setEditingAttr] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    attribute_type: 'brand',
    name: '',
    slug: '',
    display_order: 0,
    is_active: true,
    metadata: {}
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.ProductAttribute.list('display_order'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductAttribute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attributes']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductAttribute.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attributes']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductAttribute.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['attributes'])
  });

  const bulkImport = async (type, items) => {
    const promises = items.map(name => 
      base44.entities.ProductAttribute.create({
        attribute_type: type,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        is_active: true
      })
    );
    await Promise.all(promises);
    queryClient.invalidateQueries(['attributes']);
    alert(`✅ Imported ${items.length} ${type}s`);
  };

  const resetForm = () => {
    setForm({
      attribute_type: activeTab,
      name: '',
      slug: '',
      display_order: 0,
      is_active: true,
      metadata: {}
    });
    setEditingAttr(null);
  };

  const handleSubmit = () => {
    if (editingAttr) {
      updateMutation.mutate({ id: editingAttr.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const columns = [
    { header: 'Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Slug', key: 'slug', render: (val) => <span className="text-slate-400 text-xs">{val}</span> },
    { header: 'Order', key: 'display_order' },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  const filteredAttrs = attributes.filter(a => a.attribute_type === activeTab);

  const attributeTypes = [
    { value: 'brand', label: 'Brands', count: attributes.filter(a => a.attribute_type === 'brand').length },
    { value: 'cut', label: 'Cuts', count: attributes.filter(a => a.attribute_type === 'cut').length },
    { value: 'style', label: 'Styles', count: attributes.filter(a => a.attribute_type === 'style').length },
    { value: 'fabric_material', label: 'Materials', count: attributes.filter(a => a.attribute_type === 'fabric_material').length },
    { value: 'fabric_weight', label: 'Weights', count: attributes.filter(a => a.attribute_type === 'fabric_weight').length },
    { value: 'size', label: 'Sizes', count: attributes.filter(a => a.attribute_type === 'size').length },
    { value: 'color', label: 'Colors', count: attributes.filter(a => a.attribute_type === 'color').length },
    { value: 'special', label: 'Special', count: attributes.filter(a => a.attribute_type === 'special').length }
  ];

  const importPresets = () => {
    const brands = ['Bella + Canvas', 'Comfort Colors', 'District', 'Gildan', 'Hanes', 'Jerzees', 'Next Level', 'Port & Company', 'Port Authority', 'Sport-Tek'];
    const cuts = ["Men's", 'Adults', 'Unisex', "Women's", 'Youth', "Kid's", 'Juniors'];
    const colors = ['Black', 'White', 'Gray', 'Blue', 'Navy', 'Red', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    
    if (activeTab === 'brand') bulkImport('brand', brands);
    else if (activeTab === 'cut') bulkImport('cut', cuts);
    else if (activeTab === 'color') bulkImport('color', colors);
    else if (activeTab === 'size') bulkImport('size', sizes);
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Attributes"
        subtitle="Manage brands, styles, colors, sizes and more"
        icon={Tag}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Attribute', icon: Plus, onClick: () => {setForm({...form, attribute_type: activeTab}); setShowDialog(true);} },
          { label: 'Import Presets', icon: Upload, onClick: importPresets }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        {attributeTypes.slice(0, 4).map(type => (
          <Card key={type.value} className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
            <CardContent className="p-6">
              <p className="text-3xl font-black text-white">{type.count}</p>
              <p className="text-blue-300 text-sm font-bold">{type.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-900 border-slate-700">
              {attributeTypes.map(type => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label} ({type.count})
                </TabsTrigger>
              ))}
            </TabsList>

            {attributeTypes.map(type => (
              <TabsContent key={type.value} value={type.value} className="mt-6">
                <EnterpriseTable
                  columns={columns}
                  data={filteredAttrs}
                  actions={[
                    { label: 'Edit', icon: Edit, onClick: (attr) => {
                      setEditingAttr(attr);
                      setForm(attr);
                      setShowDialog(true);
                    }},
                    { label: 'Delete', icon: Trash2, onClick: (attr) => {
                      if (confirm('Delete this attribute?')) deleteMutation.mutate(attr.id);
                    }}
                  ]}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingAttr ? 'Edit Attribute' : 'Add Attribute'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Display Order</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({...form, display_order: parseInt(e.target.value)})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            {form.attribute_type === 'color' && (
              <div>
                <Label className="text-white">Color Hex Code</Label>
                <Input value={form.metadata?.hex || ''} onChange={(e) => setForm({...form, metadata: {...form.metadata, hex: e.target.value}})} placeholder="#000000" className="bg-slate-900 border-slate-700 text-white" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingAttr ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}