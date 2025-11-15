import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Star, Heart, Eye, Filter, Grid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RealtimeCart from '../components/store/RealtimeCart';

export default function Store() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [viewMode, setViewMode] = useState('grid');
  const [showCart, setShowCart] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    fetchUser();
  }, []);

  const { data: products = [], refetch } = useQuery({
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

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Church Store</h1>
            <p className="text-slate-400 font-semibold">Quality products to support your faith journey</p>
          </div>
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

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="bg-[#1a1f3a] border-slate-700 h-fit sticky top-4">
            <CardContent className="p-6">
              <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-cyan-400" />
                Filters
              </h3>

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
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white font-bold text-sm mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
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
                    className="w-full"
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-slate-600"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSortBy('featured');
                    setPriceRange([0, 1000]);
                  }}
                >
                  Clear Filters
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
                  const images = product.images ? JSON.parse(product.images) : [];
                  const inStock = (product.stock_quantity || 0) > 0;
                  const isFeatured = product.tags?.includes('featured');

                  return (
                    <Card 
                      key={product.id} 
                      className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group overflow-hidden"
                    >
                      <CardContent className="p-0">
                        <div className="relative">
                          {isFeatured && (
                            <Badge className="absolute top-3 left-3 bg-yellow-500 z-10">Featured</Badge>
                          )}
                          {!inStock && (
                            <Badge className="absolute top-3 right-3 bg-red-500 z-10">Out of Stock</Badge>
                          )}
                          {product.compare_at_price && (
                            <Badge className="absolute top-3 right-3 bg-red-500 z-10">
                              {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
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
                              className="bg-white text-slate-900 hover:bg-slate-100"
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
                            <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                              <Button size="icon" className="bg-white text-slate-900 hover:bg-slate-100">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="p-4">
                          {product.category && (
                            <Badge className="bg-purple-500 mb-2">{product.category}</Badge>
                          )}
                          <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                            <h3 className="text-white font-bold text-lg mb-2 hover:text-cyan-400 transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                            <span className="text-slate-400 text-sm">(89)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cyan-400 font-black text-2xl">${product.price?.toFixed(2)}</p>
                              {product.compare_at_price && (
                                <p className="text-slate-500 line-through text-sm">
                                  ${product.compare_at_price.toFixed(2)}
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
    </div>
  );
}