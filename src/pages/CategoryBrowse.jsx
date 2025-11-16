import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, ShoppingCart, Star, Eye } from 'lucide-react';
import AdvancedFilters from '../components/store/AdvancedFilters';

export default function CategoryBrowse() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const categorySlug = searchParams.get('category');
  const [filters, setFilters] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    fetchUser();
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const category = categories.find(c => c.slug === categorySlug);
  const subcategories = categories.filter(c => c.parent_category_id === category?.id);

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

  const filteredProducts = products.filter(p => {
    if (!category) return false;
    
    let matches = p.category === category.name;
    
    if (filters.categories?.length > 0) {
      matches = matches && filters.categories.includes(p.category);
    }
    if (filters.brands?.length > 0) {
      matches = matches && filters.brands.includes(p.brand);
    }
    if (filters.priceRange) {
      matches = matches && p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
    }
    if (filters.inStock) {
      matches = matches && p.stock_quantity > 0;
    }
    if (filters.onSale) {
      matches = matches && p.compare_at_price > p.price;
    }
    
    return matches;
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-[#0a0e27] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <p className="text-white font-bold text-xl">Category not found</p>
              <Link to={createPageUrl('Store')}>
                <Button className="mt-4 bg-cyan-500">Back to Store</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-slate-400 mb-6">
          <Link to={createPageUrl('Store')} className="hover:text-white">Store</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white font-bold">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-slate-400 font-semibold">{category.description}</p>
          )}
          <Badge className="mt-2 bg-cyan-500">{filteredProducts.length} products</Badge>
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {subcategories.map(sub => (
              <Link key={sub.id} to={createPageUrl('CategoryBrowse') + `?category=${sub.slug}`}>
                <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all cursor-pointer">
                  <CardContent className="p-4 text-center">
                    {sub.image_url && (
                      <img src={sub.image_url} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                    )}
                    <p className="text-white font-bold text-sm">{sub.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters */}
          <AdvancedFilters onFilterChange={setFilters} currentFilters={filters} />

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-16 text-center">
                  <p className="text-white font-bold text-xl mb-2">No products found</p>
                  <p className="text-slate-400">Try adjusting your filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  const images = parseImages(product.images);
                  const inStock = product.stock_quantity > 0;
                  
                  return (
                    <Card key={product.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group">
                      <CardContent className="p-0">
                        <div className="relative">
                          {!inStock && (
                            <Badge className="absolute top-3 right-3 bg-red-500 z-10">Out of Stock</Badge>
                          )}
                          {product.compare_at_price && (
                            <Badge className="absolute top-3 left-3 bg-red-500 z-10">
                              {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                            </Badge>
                          )}
                          <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                            <img 
                              src={images[0] || '/placeholder.jpg'} 
                              alt={product.name}
                              className="w-full aspect-square object-cover"
                            />
                          </Link>
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                              <Button size="icon" className="bg-white text-slate-900">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="p-4">
                          <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                            <h3 className="text-white font-bold text-lg mb-2 hover:text-cyan-400 transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          {product.brand && (
                            <Badge className="bg-purple-500 mb-2">{product.brand}</Badge>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < (product.rating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cyan-400 font-black text-2xl">${product.price?.toFixed(2)}</p>
                              {product.compare_at_price && (
                                <p className="text-slate-500 line-through text-sm">${product.compare_at_price.toFixed(2)}</p>
                              )}
                            </div>
                            <Button
                              disabled={!inStock}
                              className="bg-gradient-to-r from-cyan-600 to-blue-600"
                              size="sm"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}