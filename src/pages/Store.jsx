
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Star, Heart, Eye, Filter, Grid, List, GitCompare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RealtimeCart from '../components/store/RealtimeCart';
import ProductQuickView from '../components/store/ProductQuickView';
import AIChatbot from '../components/ai/AIChatbot';
import AIPersonalization from '../components/ai/AIPersonalization';
import SmartProductRecommendations from '../components/ai/SmartProductRecommendations';
import DynamicPromotionBanner from '../components/personalization/DynamicPromotionBanner';

export default function Store() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [viewMode, setViewMode] = useState('grid');
  const [showCart, setShowCart] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [filters, setFilters] = useState({
    colors: [],
    sizes: [],
    brands: [],
    materials: [],
    styles: [],
    weights: [],
    special: [],
    rating: 0
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    fetchUser();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['storeProducts'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    refetchInterval: 3000,
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

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CartItem.filter({ user_id: user.id });
    },
    refetchInterval: 2000,
    enabled: !!user,
    initialData: []
  });

  const { data: personalization } = useQuery({
    queryKey: ['personalization', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const existing = await base44.entities.UserPersonalization.filter({ user_id: user.id });
      return existing[0] || null;
    },
    enabled: !!user
  });

  const { data: userPreferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const existing = await base44.entities.UserPreferenceCenter.filter({ user_id: user.id });
      return existing[0] || null;
    },
    enabled: !!user
  });

  const addToCartMutation = useMutation({
    mutationFn: (data) => base44.entities.CartItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      alert('✅ Added to cart!');
    }
  });

  const addToWishlistMutation = useMutation({
    mutationFn: (data) => base44.entities.WishlistItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      alert('💝 Added to wishlist!');
    }
  });

  const quickAddToCart = (product) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    addToCartMutation.mutate({
      user_id: user.id,
      product_id: product.id,
      quantity: 1,
      price: product.price
    });
  };

  const toggleCompare = (productId) => {
    setCompareList(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : prev.length < 4 ? [...prev, productId] : prev
    );
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
    setPriceRange([0, 1000]);
    setFilters({ colors: [], sizes: [], brands: [], materials: [], styles: [], weights: [], special: [], rating: 0 });
  };

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

  const styleAttrs = attributes.filter(a => a.attribute_type === 'style');
  const materialAttrs = attributes.filter(a => a.attribute_type === 'fabric_material');
  const weightAttrs = attributes.filter(a => a.attribute_type === 'fabric_weight');
  const colorAttrs = attributes.filter(a => a.attribute_type === 'color');
  const sizeAttrs = attributes.filter(a => a.attribute_type === 'size');
  const specialAttrs = attributes.filter(a => a.attribute_type === 'special');
  
  const availableBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const applyAIPersonalization = (prods) => {
    let scoredProducts = prods.map(p => {
      let score = 0;

      // From personalization (AI segment based)
      if (personalization?.favorite_categories?.includes(p.category)) score += 15;
      if (personalization?.favorite_brands?.includes(p.brand)) score += 10;
      
      // From userPreferences (explicit user choices)
      if (userPreferences?.favorite_categories?.includes(p.category)) score += 20;
      if (userPreferences?.favorite_brands?.includes(p.brand)) score += 15;
      
      if (userPreferences?.preferred_colors?.some(c => p.colors?.includes(c))) score += 8;
      if (userPreferences?.preferred_sizes?.some(s => p.sizes?.includes(s))) score += 8;
      
      if (userPreferences?.price_range_min !== undefined && userPreferences?.price_range_max !== undefined) {
        if (p.price >= userPreferences.price_range_min && p.price <= userPreferences.price_range_max) score += 5;
      } else if (userPreferences?.price_range_min !== undefined) {
        if (p.price >= userPreferences.price_range_min) score += 5;
      } else if (userPreferences?.price_range_max !== undefined) {
        if (p.price <= userPreferences.price_range_max) score += 5;
      }
      
      // General product attributes
      if (p.is_featured) score += 5;
      if (p.rating >= 4.5) score += 3;
      
      return { ...p, ai_score: score };
    });

    return scoredProducts.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
  };

  let filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesColor = filters.colors.length === 0 || (p.colors && filters.colors.some(c => p.colors.includes(c)));
    const matchesSize = filters.sizes.length === 0 || (p.sizes && filters.sizes.some(s => p.sizes.includes(s)));
    const matchesBrand = filters.brands.length === 0 || filters.brands.includes(p.brand);
    const matchesMaterial = filters.materials.length === 0 || filters.materials.includes(p.material);
    const matchesStyle = filters.styles.length === 0 || (p.style_attributes && filters.styles.some(s => p.style_attributes.includes(s)));
    const matchesWeight = filters.weights.length === 0 || filters.weights.includes(p.fabric_weight);
    const matchesSpecial = filters.special.length === 0 || (p.tags && filters.special.some(s => p.tags.includes(s.toLowerCase())));
    const matchesRating = filters.rating === 0 || (p.rating || 0) >= filters.rating;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesColor && 
           matchesSize && matchesBrand && matchesMaterial && matchesStyle && 
           matchesWeight && matchesSpecial && matchesRating;
  });

  // Apply AI personalization scoring and default sort (by AI score)
  filteredProducts = applyAIPersonalization(filteredProducts);

  // Then apply any explicit user sort preference, overriding the AI sort if selected
  if (sortBy === 'price_low') filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sortBy === 'price_high') filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (sortBy === 'name') filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  else if (sortBy === 'rating') filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  // If sortBy === 'featured' (AI Recommended), the sort from applyAIPersonalization persists.

  const activeFiltersCount = filters.colors.length + filters.sizes.length + filters.brands.length + filters.materials.length + filters.styles.length + filters.weights.length + filters.special.length + (filters.rating > 0 ? 1 : 0);

  const applyPersonalizedPrice = (price) => {
    if (!personalization?.personalized_discount) return price;
    return price * (1 - personalization.personalized_discount / 100);
  };

  return (
    <AIPersonalization userId={user?.id}>
      <div className="min-h-screen bg-[#0a0e27] py-12">
        <DynamicPromotionBanner userId={user?.id} cartItems={cartItems} />
        
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">Church Store</h1>
              <p className="text-slate-400 font-semibold">Quality products to support your faith journey</p>
              {personalization && (
                <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500">
                  Personalized for {personalization.segment} member
                </Badge>
              )}
            </div>
            <div className="flex gap-3">
              {compareList.length > 0 && (
                <Button 
                  onClick={() => navigate(createPageUrl('ProductComparison') + `?ids=${compareList.join(',')}`)}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare ({compareList.length})
                </Button>
              )}
              <Button 
                onClick={() => setShowCart(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 h-12 px-6 font-bold relative"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 h-6 w-6 flex items-center justify-center p-0">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <SmartProductRecommendations userId={user?.id} />

          <div className="grid lg:grid-cols-4 gap-8">
            <Card className="bg-[#1a1f3a] border-slate-700 h-fit sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5 text-cyan-400" />
                    Filters
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-cyan-500">{activeFiltersCount}</Badge>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Search</label>
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {availableBrands.length > 0 && (
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Brands</label>
                      <Select 
                        value={filters.brands[0] || 'all'} 
                        onValueChange={(val) => setFilters({...filters, brands: val === 'all' ? [] : [val]})}
                      >
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                          <SelectItem value="all">All Brands</SelectItem>
                          {availableBrands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {colorAttrs.length > 0 && (
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Colors</label>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {colorAttrs.map(attr => {
                          const hexColor = attr.metadata?.hex || '#808080';
                          return (
                            <button
                              key={attr.id}
                              onClick={() => toggleFilter('colors', attr.name)}
                              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                filters.colors.includes(attr.name)
                                  ? 'border-cyan-400 scale-110 shadow-lg'
                                  : 'border-slate-600 hover:border-slate-500'
                              }`}
                              style={{ backgroundColor: hexColor }}
                              title={attr.name}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sizeAttrs.length > 0 && (
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Sizes</label>
                      <div className="flex flex-wrap gap-2">
                        {sizeAttrs.map(size => (
                          <button
                            key={size.id}
                            onClick={() => toggleFilter('sizes', size.name)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              filters.sizes.includes(size.name)
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

                  {materialAttrs.length > 0 && (
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Materials</label>
                      <Select 
                        value={filters.materials[0] || 'all'} 
                        onValueChange={(val) => setFilters({...filters, materials: val === 'all' ? [] : [val]})}
                      >
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue placeholder="All Materials" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                          <SelectItem value="all">All Materials</SelectItem>
                          {materialAttrs.map(attr => (
                            <SelectItem key={attr.id} value={attr.name}>{attr.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {weightAttrs.length > 0 && (
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Weight</label>
                      <Select 
                        value={filters.weights[0] || 'all'} 
                        onValueChange={(val) => setFilters({...filters, weights: val === 'all' ? [] : [val]})}
                      >
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue placeholder="All Weights" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {weightAttrs.map(attr => (
                            <SelectItem key={attr.id} value={attr.name}>{attr.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {styleAttrs.length > 0 && (
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Style</label>
                      <div className="space-y-1 max-h-48 overflow-y-auto bg-slate-900 p-3 rounded-lg border border-slate-700">
                        {styleAttrs.slice(0, 15).map(attr => (
                          <label key={attr.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.styles.includes(attr.name)}
                              onChange={() => toggleFilter('styles', attr.name)}
                              className="w-4 h-4"
                            />
                            <span className="text-slate-300 text-xs">{attr.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {specialAttrs.length > 0 && (
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Special</label>
                      <div className="flex flex-wrap gap-2">
                        {specialAttrs.map(attr => (
                          <button
                            key={attr.id}
                            onClick={() => toggleFilter('special', attr.slug)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              filters.special.includes(attr.slug)
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {attr.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Min Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setFilters({...filters, rating: filters.rating === rating ? 0 : rating})}
                          className={`p-1 ${filters.rating >= rating ? 'text-yellow-400' : 'text-slate-600'}`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="featured">AI Recommended</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name: A to Z</SelectItem>
                        <SelectItem value="rating">Rating: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-slate-600"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <p className="text-slate-400 font-semibold">{filteredProducts.length} products found</p>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-cyan-500' : 'border-slate-600'}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-cyan-500' : 'border-slate-600'}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-16 text-center">
                    <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-white font-bold text-xl mb-2">No products found</p>
                    <p className="text-slate-400">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredProducts.map(product => {
                    const images = parseImages(product.images);
                    const inStock = (product.stock_quantity || 0) > 0;
                    const isFeatured = product.tags?.includes('featured');
                    const isInCompare = compareList.includes(product.id);
                    const personalizedPrice = applyPersonalizedPrice(product.price);

                    return (
                      <Card 
                        key={product.id} 
                        className={`bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group overflow-hidden ${isInCompare ? 'ring-2 ring-purple-500' : ''}`}
                      >
                        <CardContent className="p-0">
                          <div className="relative">
                            {isFeatured && (
                              <Badge className="absolute top-3 left-3 bg-yellow-500 z-10">Featured</Badge>
                            )}
                            {!inStock && (
                              <Badge className="absolute top-3 right-3 bg-red-500 z-10">Out of Stock</Badge>
                            )}
                            {product.compare_at_price && inStock && (
                              <Badge className="absolute top-3 right-3 bg-red-500 z-10">
                                {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                              </Badge>
                            )}
                            {personalization?.personalized_discount > 0 && inStock && (
                              <Badge className="absolute top-10 right-3 bg-purple-500 z-10 text-xs">
                                Your +{personalization.personalized_discount}%
                              </Badge>
                            )}
                            <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                              <img 
                                src={images[0] || '/placeholder.jpg'} 
                                alt={product.name}
                                className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </Link>
                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                className={`${isInCompare ? 'bg-purple-500' : 'bg-white'} text-slate-900 hover:bg-slate-100 h-8 w-8`}
                                onClick={() => toggleCompare(product.id)}
                              >
                                <GitCompare className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                className="bg-white text-slate-900 hover:bg-slate-100 h-8 w-8"
                                onClick={() => addToWishlistMutation.mutate({ 
                                  user_id: user?.id, 
                                  product_id: product.id,
                                  product_name: product.name,
                                  product_price: product.price,
                                  product_image: images[0]
                                })}
                              >
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                className="bg-white text-slate-900 hover:bg-slate-100 h-8 w-8"
                                onClick={() => setQuickViewProduct(product)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {product.brand && (
                                <Badge className="bg-blue-500 text-xs">{product.brand}</Badge>
                              )}
                              {product.category && (
                                <Badge className="bg-purple-500 text-xs">{product.category}</Badge>
                              )}
                            </div>
                            <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                              <h3 className="text-white font-bold text-lg mb-2 hover:text-cyan-400 transition-colors">
                                {product.name}
                              </h3>
                            </Link>
                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < (product.rating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                                ))}
                              </div>
                              <span className="text-slate-400 text-sm">({product.rating || 4.8})</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-cyan-400 font-black text-2xl">
                                  ${personalizedPrice?.toFixed(2)}
                                </p>
                                {(product.compare_at_price || personalization?.personalized_discount > 0) && (
                                  <p className="text-slate-500 line-through text-sm">
                                    ${product.price?.toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={() => quickAddToCart(product)}
                                disabled={!inStock}
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
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

        {showCart && <RealtimeCart userId={user?.id} onClose={() => setShowCart(false)} />}
        {quickViewProduct && (
          <ProductQuickView 
            product={quickViewProduct} 
            onClose={() => setQuickViewProduct(null)}
            user={user}
          />
        )}
        <AIChatbot user={user} />
      </div>
    </AIPersonalization>
  );
}
