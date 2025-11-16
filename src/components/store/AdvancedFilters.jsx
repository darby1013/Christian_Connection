import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Star } from 'lucide-react';

export default function AdvancedFilters({ onFilterChange, currentFilters }) {
  const [localFilters, setLocalFilters] = useState(currentFilters || {
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    priceRange: [0, 1000],
    minRating: 0,
    inStock: false,
    onSale: false
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: []
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.ProductAttribute.list(),
    initialData: []
  });

  const brands = attributes.filter(a => a.attribute_type === 'brand' && a.is_active);
  const colors = attributes.filter(a => a.attribute_type === 'color' && a.is_active);
  const sizes = attributes.filter(a => a.attribute_type === 'size' && a.is_active);

  const toggleArrayFilter = (key, value) => {
    const current = localFilters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    const newFilters = { ...localFilters, [key]: updated };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const updateFilter = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
      priceRange: [0, 1000],
      minRating: 0,
      inStock: false,
      onSale: false
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = 
    (localFilters.categories?.length || 0) +
    (localFilters.brands?.length || 0) +
    (localFilters.colors?.length || 0) +
    (localFilters.sizes?.length || 0) +
    (localFilters.minRating > 0 ? 1 : 0) +
    (localFilters.inStock ? 1 : 0) +
    (localFilters.onSale ? 1 : 0);

  return (
    <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-black text-lg">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge className="bg-cyan-500">{activeFilterCount}</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Categories */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">Categories</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={localFilters.categories.includes(cat.name)}
                    onChange={() => toggleArrayFilter('categories', cat.name)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300 text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Brands</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {brands.slice(0, 10).map(brand => (
                  <label key={brand.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={localFilters.brands.includes(brand.name)}
                      onChange={() => toggleArrayFilter('brands', brand.name)}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-300 text-sm">{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Colors</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => toggleArrayFilter('colors', color.name)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      localFilters.colors.includes(color.name)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Sizes</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => toggleArrayFilter('sizes', size.name)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      localFilters.sizes.includes(size.name)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">
              Price Range: ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
            </label>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="1000"
                value={localFilters.priceRange[1]}
                onChange={(e) => updateFilter('priceRange', [0, parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">Minimum Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => updateFilter('minRating', localFilters.minRating === rating ? 0 : rating)}
                  className={`p-1 ${localFilters.minRating >= rating ? 'text-yellow-400' : 'text-slate-600'}`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">Quick Filters</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={localFilters.inStock}
                  onChange={(e) => updateFilter('inStock', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-slate-300 text-sm">In Stock Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={localFilters.onSale}
                  onChange={(e) => updateFilter('onSale', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-slate-300 text-sm">On Sale</span>
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}