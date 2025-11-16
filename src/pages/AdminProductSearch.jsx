import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Search, Filter, X, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    inStock: false,
    status: 'all'
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !filters.category || p.category === filters.category;
    const matchesBrand = !filters.brand || p.brand === filters.brand;
    const matchesStock = !filters.inStock || p.stock_quantity > 0;
    const matchesStatus = filters.status === 'all' || p.status === filters.status;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStock && matchesStatus;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

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

  const columns = [
    { 
      header: 'Product', 
      key: 'name',
      render: (_, p) => {
        const images = parseImages(p.images);
        return (
          <div className="flex items-center gap-3">
            <img src={images[0] || '/placeholder.jpg'} alt="" className="w-12 h-12 object-cover rounded" />
            <div>
              <p className="text-white font-bold">{p.name}</p>
              <p className="text-slate-400 text-xs">{p.sku}</p>
            </div>
          </div>
        );
      }
    },
    { header: 'Category', key: 'category', render: (val) => <Badge className="bg-purple-500">{val || 'N/A'}</Badge> },
    { header: 'Brand', key: 'brand', render: (val) => <Badge className="bg-blue-500">{val || 'N/A'}</Badge> },
    { header: 'Price', key: 'price', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Stock', key: 'stock_quantity', render: (val) => <Badge className={val > 0 ? 'bg-green-500' : 'bg-red-500'}>{val || 0}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Advanced Product Search"
        subtitle="Search and filter across your entire catalog"
        icon={Search}
        badge="ENTERPRISE"
      />

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Search products by name, SKU, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-12"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 h-12"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filters.brand}
              onChange={(e) => setFilters({...filters, brand: e.target.value})}
              className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 h-12"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => setFilters({...filters, inStock: e.target.checked})}
                className="w-4 h-4"
              />
              In Stock Only
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 h-10"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <Badge className="bg-cyan-500">{filteredProducts.length} results</Badge>
          </div>
        </CardContent>
      </Card>

      <EnterpriseTable
        columns={columns}
        data={filteredProducts}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (p) => window.location.href = createPageUrl('AdminProductsEnhanced') }
        ]}
      />
    </div>
  );
}