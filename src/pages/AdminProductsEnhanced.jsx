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
import { Package, Plus, Edit, Trash2, Image as ImageIcon, Download, Sparkles, Eye, ChevronDown, Globe } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function AdminProductsEnhanced() {
  const [showDialog, setShowDialog] = useState(false);
  const [showDigitalDialog, setShowDigitalDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [styleExpanded, setStyleExpanded] = useState(false);
  const queryClient = useQueryClient();

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    stock_quantity: '',
    sku: '',
    brand: '',
    material: '',
    fabric_weight: '',
    style_attributes: [],
    colors: [],
    sizes: [],
    images: [],
    tags: '',
    meta_title: '',
    meta_description: '',
    seo_keywords: []
  });

  const [digitalForm, setDigitalForm] = useState({
    name: '',
    description: '',
    product_type: 'pdf',
    price: '',
    file_url: '',
    thumbnail_url: '',
    file_size: '',
    file_format: '',
    preview_url: '',
    sample_pages: '',
    total_pages: '',
    duration: '',
    version: '1.0',
    license_type: 'personal',
    download_limit: 5,
    drm_protected: false,
    watermark_enabled: false,
    instant_download: true,
    email_delivery: true,
    access_duration_days: 365,
    tags: []
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

  const { data: attributes = [] } = useQuery({
    queryKey: ['productAttributes'],
    queryFn: () => base44.entities.ProductAttribute.list(),
    initialData: []
  });

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const product = await base44.entities.Product.create(data);
      
      if (data.meta_title || data.meta_description || data.seo_keywords?.length > 0) {
        await base44.entities.ProductSEO.create({
          product_id: product.id,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          keywords: data.seo_keywords,
          og_title: data.meta_title || data.name,
          og_description: data.meta_description || data.description,
          og_image: data.images?.[0],
          structured_data: {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": data.name,
            "description": data.description,
            "offers": {
              "@type": "Offer",
              "price": data.price,
              "priceCurrency": "USD"
            }
          }
        });
      }
      
      return product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries(['products']);
      setShowDialog(false);
      setPreviewProduct(product);
      setShowPreview(true);
      resetForm();
    }
  });

  const createDigitalProductMutation = useMutation({
    mutationFn: async (data) => {
      const product = await base44.entities.DigitalProductEnhanced.create(data);
      return product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries(['digitalProducts']);
      setShowDigitalDialog(false);
      alert('✅ Digital product created!');
      resetDigitalForm();
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
    onSuccess: () => queryClient.invalidateQueries(['products'])
  });

  const parseImages = (images) => {
    if (Array.isArray(images)) return images;
    if (!images) return [];
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [images];
      } catch {
        return [images];
      }
    }
    return [];
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      compare_at_price: '',
      category: '',
      stock_quantity: '',
      sku: '',
      brand: '',
      material: '',
      fabric_weight: '',
      style_attributes: [],
      colors: [],
      sizes: [],
      images: [],
      tags: '',
      meta_title: '',
      meta_description: '',
      seo_keywords: []
    });
    setEditingProduct(null);
  };

  const resetDigitalForm = () => {
    setDigitalForm({
      name: '',
      description: '',
      product_type: 'pdf',
      price: '',
      file_url: '',
      thumbnail_url: '',
      file_size: '',
      file_format: '',
      preview_url: '',
      sample_pages: '',
      total_pages: '',
      duration: '',
      version: '1.0',
      license_type: 'personal',
      download_limit: 5,
      drm_protected: false,
      watermark_enabled: false,
      instant_download: true,
      email_delivery: true,
      access_duration_days: 365,
      tags: []
    });
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
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileUpload = async (file, field) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDigitalForm(prev => ({...prev, [field]: file_url, file_size: (file.size / 1024 / 1024).toFixed(2) + ' MB', file_format: file.name.split('.').pop()}));
    } catch {}
  };

  const generateAITags = async () => {
    setGeneratingTags(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 8-12 SEO-optimized tags for this product:
Name: ${productForm.name}
Description: ${productForm.description}
Category: ${productForm.category}
Brand: ${productForm.brand}

Return tags as comma-separated keywords for e-commerce SEO.`,
        response_json_schema: {
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' } },
            meta_title: { type: 'string' },
            meta_description: { type: 'string' }
          }
        }
      });
      
      setProductForm(prev => ({
        ...prev,
        tags: result.tags.join(', '),
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        seo_keywords: result.tags
      }));
    } finally {
      setGeneratingTags(false);
    }
  };

  const handleSubmit = () => {
    const data = {
      ...productForm,
      price: parseFloat(productForm.price),
      compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      images: productForm.images
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleDigitalSubmit = () => {
    const data = {
      ...digitalForm,
      price: parseFloat(digitalForm.price),
      sample_pages: digitalForm.sample_pages ? parseInt(digitalForm.sample_pages) : null,
      total_pages: digitalForm.total_pages ? parseInt(digitalForm.total_pages) : null,
      duration: digitalForm.duration ? parseInt(digitalForm.duration) : null
    };
    createDigitalProductMutation.mutate(data);
  };

  const styleAttrs = attributes.filter(a => a.attribute_type === 'style');
  const materialAttrs = attributes.filter(a => a.attribute_type === 'fabric_material');
  const weightAttrs = attributes.filter(a => a.attribute_type === 'fabric_weight');
  const colorAttrs = attributes.filter(a => a.attribute_type === 'color');
  const sizeAttrs = attributes.filter(a => a.attribute_type === 'size');
  const availableBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const columns = [
    { 
      header: 'Product', 
      key: 'name',
      render: (_, product) => {
        const images = parseImages(product.images);
        return (
          <div className="flex items-center gap-3">
            <img src={images[0] || '/placeholder.jpg'} alt="" className="w-12 h-12 object-cover rounded" />
            <div>
              <p className="text-white font-bold">{product.name}</p>
              <p className="text-slate-400 text-xs">{product.sku}</p>
            </div>
          </div>
        );
      }
    },
    { header: 'Category', key: 'category', render: (val) => <Badge className="bg-purple-500">{val || 'Uncategorized'}</Badge> },
    { header: 'Price', key: 'price', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Stock', key: 'stock_quantity', render: (val) => <Badge className={val > 0 ? 'bg-green-500' : 'bg-red-500'}>{val || 0}</Badge> }
  ];

  const shouldShowStyleAttrs = ['T-Shirts', 'Apparel', 'Clothing'].includes(productForm.category);

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Products Management"
        subtitle="Enterprise product catalog with SEO & digital downloads"
        icon={Package}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Physical Product', icon: Plus, onClick: () => { setShowDialog(true); resetForm(); }},
          { label: 'Add Digital Product', icon: Download, onClick: () => { setShowDigitalDialog(true); resetDigitalForm(); }, className: 'bg-gradient-to-r from-purple-600 to-pink-600' }
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
            const images = parseImages(product.images);
            setEditingProduct(product);
            setProductForm({
              ...product,
              images: images,
              price: product.price?.toString() || '',
              compare_at_price: product.compare_at_price?.toString() || '',
              stock_quantity: product.stock_quantity?.toString() || '',
              style_attributes: product.style_attributes || [],
              colors: product.colors || [],
              sizes: product.sizes || [],
              seo_keywords: []
            });
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (product) => {
            if (confirm('Delete this product?')) deleteProductMutation.mutate(product.id);
          }}
        ]}
      />

      {/* Physical Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0f1629] border-slate-700 max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black flex items-center gap-3">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600">ENTERPRISE</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Product Name *</Label>
                <Input 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-12"
                />
              </div>
              <div>
                <Label className="text-white">SKU</Label>
                <Input 
                  value={productForm.sku}
                  onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-12"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea 
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-32"
              />
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label className="text-white">Price *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-12"
                />
              </div>
              <div>
                <Label className="text-white">Compare At Price</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={productForm.compare_at_price}
                  onChange={(e) => setProductForm({...productForm, compare_at_price: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-12"
                />
              </div>
              <div>
                <Label className="text-white">Stock Quantity</Label>
                <Input 
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-12"
                />
              </div>
              <div>
                <Label className="text-white">Category *</Label>
                <Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Brand</Label>
                <Select value={productForm.brand} onValueChange={(val) => setProductForm({...productForm, brand: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                    <SelectValue placeholder="Select or type brand" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {availableBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                    <SelectItem value="Gildan">Gildan</SelectItem>
                    <SelectItem value="Hanes">Hanes</SelectItem>
                    <SelectItem value="Bella+Canvas">Bella+Canvas</SelectItem>
                    <SelectItem value="Next Level">Next Level</SelectItem>
                    <SelectItem value="Port Authority">Port Authority</SelectItem>
                    <SelectItem value="Comfort Colors">Comfort Colors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Material</Label>
                <Select value={productForm.material} onValueChange={(val) => setProductForm({...productForm, material: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {materialAttrs.map(attr => (
                      <SelectItem key={attr.id} value={attr.name}>{attr.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Fabric Weight</Label>
                <Select value={productForm.fabric_weight} onValueChange={(val) => setProductForm({...productForm, fabric_weight: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {weightAttrs.map(attr => (
                      <SelectItem key={attr.id} value={attr.name}>{attr.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {shouldShowStyleAttrs && (
              <Collapsible open={styleExpanded} onOpenChange={setStyleExpanded}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors">
                    <Label className="text-white font-bold">Style Attributes</Label>
                    <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform ${styleExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-4 gap-2 mt-2 max-h-60 overflow-y-auto bg-slate-900 p-4 rounded-lg border border-slate-700">
                    {styleAttrs.map(attr => (
                      <label key={attr.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={productForm.style_attributes?.includes(attr.name)}
                          onChange={(e) => {
                            const newStyles = e.target.checked
                              ? [...(productForm.style_attributes || []), attr.name]
                              : (productForm.style_attributes || []).filter(s => s !== attr.name);
                            setProductForm({...productForm, style_attributes: newStyles});
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-xs">{attr.name}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Colors</Label>
                <div className="grid grid-cols-6 gap-2 p-4 bg-slate-900 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
                  {colorAttrs.map(attr => {
                    const hexColor = attr.metadata?.hex || '#808080';
                    const isSelected = productForm.colors?.includes(attr.name);
                    return (
                      <button
                        key={attr.id}
                        onClick={() => {
                          const newColors = isSelected
                            ? (productForm.colors || []).filter(c => c !== attr.name)
                            : [...(productForm.colors || []), attr.name];
                          setProductForm({...productForm, colors: newColors});
                        }}
                        className={`relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                          isSelected ? 'border-cyan-400 shadow-lg shadow-cyan-500/50' : 'border-slate-600'
                        }`}
                        style={{ backgroundColor: hexColor }}
                        title={attr.name}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full border-2 border-cyan-400"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-white mb-2 block">Sizes</Label>
                <div className="grid grid-cols-4 gap-2 p-4 bg-slate-900 rounded-lg border border-slate-700">
                  {sizeAttrs.map(attr => (
                    <label key={attr.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={productForm.sizes?.includes(attr.name)}
                        onChange={(e) => {
                          const newSizes = e.target.checked
                            ? [...(productForm.sizes || []), attr.name]
                            : (productForm.sizes || []).filter(s => s !== attr.name);
                          setProductForm({...productForm, sizes: newSizes});
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm font-bold">{attr.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  SEO Tags
                </Label>
                <Button 
                  size="sm" 
                  onClick={generateAITags}
                  disabled={!productForm.name || generatingTags}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-8"
                >
                  <Sparkles className="w-3 h-3 mr-2" />
                  {generatingTags ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              <Input 
                value={productForm.tags}
                onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                placeholder="sale, featured, new-arrivals, trending"
                className="bg-slate-900 border-slate-700 text-white h-12"
              />
            </div>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors">
                  <Label className="text-purple-300 font-bold">Advanced SEO Settings</Label>
                  <ChevronDown className="w-5 h-5 text-purple-400" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div>
                    <Label className="text-white">Meta Title (60 chars max)</Label>
                    <Input 
                      value={productForm.meta_title}
                      onChange={(e) => setProductForm({...productForm, meta_title: e.target.value})}
                      maxLength={60}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">{productForm.meta_title?.length || 0}/60</p>
                  </div>
                  <div>
                    <Label className="text-white">Meta Description (160 chars max)</Label>
                    <Textarea 
                      value={productForm.meta_description}
                      onChange={(e) => setProductForm({...productForm, meta_description: e.target.value})}
                      maxLength={160}
                      className="bg-slate-900 border-slate-700 text-white h-20"
                    />
                    <p className="text-xs text-slate-400 mt-1">{productForm.meta_description?.length || 0}/160</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div>
              <Label className="text-white flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4" />
                Product Images
              </Label>
              <div className="grid grid-cols-6 gap-4 mb-3 p-4 bg-slate-900 rounded-lg border border-slate-700">
                {productForm.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                      onClick={() => setProductForm({...productForm, images: productForm.images.filter((_, idx) => idx !== i)})}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    {i === 0 && <Badge className="absolute bottom-1 left-1 bg-cyan-500 text-xs">Main</Badge>}
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
              {uploadingImages && <p className="text-cyan-400 text-sm mt-2 animate-pulse">Uploading images...</p>}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600 h-12">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold h-12 text-lg">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Digital Product Dialog */}
      <Dialog open={showDigitalDialog} onOpenChange={setShowDigitalDialog}>
        <DialogContent className="bg-[#0f1629] border-purple-500 max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black flex items-center gap-3">
              <Download className="w-6 h-6 text-purple-400" />
              Add Digital Product
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600">DIGITAL</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Product Name *</Label>
                <Input 
                  value={digitalForm.name}
                  onChange={(e) => setDigitalForm({...digitalForm, name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-12"
                />
              </div>
              <div>
                <Label className="text-white">Product Type *</Label>
                <Select value={digitalForm.product_type} onValueChange={(val) => setDigitalForm({...digitalForm, product_type: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ebook">eBook</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio/Music</SelectItem>
                    <SelectItem value="course">Online Course</SelectItem>
                    <SelectItem value="image">Images/Graphics</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="podcast">Podcast Episode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea 
                value={digitalForm.description}
                onChange={(e) => setDigitalForm({...digitalForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-32"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Price *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={digitalForm.price}
                  onChange={(e) => setDigitalForm({...digitalForm, price: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-12"
                />
              </div>
              <div>
                <Label className="text-white">License Type</Label>
                <Select value={digitalForm.license_type} onValueChange={(val) => setDigitalForm({...digitalForm, license_type: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="personal">Personal Use</SelectItem>
                    <SelectItem value="commercial">Commercial License</SelectItem>
                    <SelectItem value="extended">Extended License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Upload Main File *</Label>
                <Input 
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'file_url')}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                {digitalForm.file_url && <p className="text-green-400 text-xs mt-1">✓ File uploaded ({digitalForm.file_size})</p>}
              </div>
              <div>
                <Label className="text-white">Upload Thumbnail</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'thumbnail_url')}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                {digitalForm.thumbnail_url && (
                  <img src={digitalForm.thumbnail_url} alt="" className="w-20 h-20 object-cover rounded mt-2" />
                )}
              </div>
            </div>

            <div>
              <Label className="text-white">Preview/Sample File (Optional)</Label>
              <Input 
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'preview_url')}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            {['ebook', 'pdf'].includes(digitalForm.product_type) && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">Total Pages</Label>
                  <Input 
                    type="number"
                    value={digitalForm.total_pages}
                    onChange={(e) => setDigitalForm({...digitalForm, total_pages: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Sample Pages</Label>
                  <Input 
                    type="number"
                    value={digitalForm.sample_pages}
                    onChange={(e) => setDigitalForm({...digitalForm, sample_pages: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Version</Label>
                  <Input 
                    value={digitalForm.version}
                    onChange={(e) => setDigitalForm({...digitalForm, version: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
            )}

            {['video', 'audio'].includes(digitalForm.product_type) && (
              <div>
                <Label className="text-white">Duration (seconds)</Label>
                <Input 
                  type="number"
                  value={digitalForm.duration}
                  onChange={(e) => setDigitalForm({...digitalForm, duration: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Max Downloads per Purchase</Label>
                <Input 
                  type="number"
                  value={digitalForm.download_limit}
                  onChange={(e) => setDigitalForm({...digitalForm, download_limit: parseInt(e.target.value)})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Access Duration (days)</Label>
                <Input 
                  type="number"
                  value={digitalForm.access_duration_days}
                  onChange={(e) => setDigitalForm({...digitalForm, access_duration_days: parseInt(e.target.value)})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={digitalForm.instant_download}
                  onChange={(e) => setDigitalForm({...digitalForm, instant_download: e.target.checked})}
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-white font-bold">Instant Download</p>
                  <p className="text-slate-400 text-xs">Download available immediately after payment</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={digitalForm.email_delivery}
                  onChange={(e) => setDigitalForm({...digitalForm, email_delivery: e.target.checked})}
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-white font-bold">Email Delivery</p>
                  <p className="text-slate-400 text-xs">Send download link via email</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={digitalForm.drm_protected}
                  onChange={(e) => setDigitalForm({...digitalForm, drm_protected: e.target.checked})}
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-white font-bold">DRM Protection</p>
                  <p className="text-slate-400 text-xs">Digital rights management enabled</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={digitalForm.watermark_enabled}
                  onChange={(e) => setDigitalForm({...digitalForm, watermark_enabled: e.target.checked})}
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-white font-bold">Watermark</p>
                  <p className="text-slate-400 text-xs">Add user watermark to file</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button variant="outline" onClick={() => {setShowDigitalDialog(false); resetDigitalForm();}} className="flex-1 border-slate-600 h-12">
                Cancel
              </Button>
              <Button onClick={handleDigitalSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold h-12 text-lg">
                Create Digital Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-[#0f1629] border-green-500 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black flex items-center gap-3">
              <Eye className="w-6 h-6 text-green-400" />
              Product Created Successfully!
              <Badge className="bg-green-500">PREVIEW</Badge>
            </DialogTitle>
          </DialogHeader>

          {previewProduct && (
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      {previewProduct.images?.[0] && (
                        <img src={previewProduct.images[0]} alt="" className="w-full aspect-square object-cover rounded-xl mb-4" />
                      )}
                      <div className="grid grid-cols-4 gap-2">
                        {parseImages(previewProduct.images).slice(1, 5).map((img, i) => (
                          <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Badge className="bg-green-500 mb-3">In Stock</Badge>
                      <h2 className="text-3xl font-black text-white mb-4">{previewProduct.name}</h2>
                      <p className="text-slate-300 mb-4">{previewProduct.description}</p>
                      <div className="space-y-2 mb-4">
                        {previewProduct.brand && (
                          <p className="text-slate-400"><strong className="text-white">Brand:</strong> {previewProduct.brand}</p>
                        )}
                        {previewProduct.category && (
                          <p className="text-slate-400"><strong className="text-white">Category:</strong> {previewProduct.category}</p>
                        )}
                        {previewProduct.material && (
                          <p className="text-slate-400"><strong className="text-white">Material:</strong> {previewProduct.material}</p>
                        )}
                        {previewProduct.colors?.length > 0 && (
                          <div className="flex items-center gap-2">
                            <strong className="text-white">Colors:</strong>
                            <div className="flex gap-1">
                              {previewProduct.colors.slice(0, 10).map((color, i) => {
                                const colorAttr = colorAttrs.find(c => c.name === color);
                                return (
                                  <div key={i} className="w-6 h-6 rounded border border-slate-600" style={{backgroundColor: colorAttr?.metadata?.hex || '#808080'}} title={color}></div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {previewProduct.sizes?.length > 0 && (
                          <p className="text-slate-400"><strong className="text-white">Sizes:</strong> {previewProduct.sizes.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-3 mb-4">
                        <p className="text-5xl font-black text-cyan-400">${previewProduct.price?.toFixed(2)}</p>
                        {previewProduct.compare_at_price && (
                          <>
                            <p className="text-2xl text-slate-500 line-through">${previewProduct.compare_at_price.toFixed(2)}</p>
                            <Badge className="bg-red-500">SALE</Badge>
                          </>
                        )}
                      </div>
                      {previewProduct.tags && (
                        <div className="flex flex-wrap gap-2">
                          {previewProduct.tags.split(',').map((tag, i) => (
                            <Badge key={i} className="bg-purple-500">{tag.trim()}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={() => setShowPreview(false)} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold h-12">
                  Perfect! Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}