import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Grid, List, Filter, Star, Heart, Eye, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RealtimeCart from '../components/store/RealtimeCart';

export default function StoreEnhanced() {
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

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: []
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => base44.entities.CartItem.filter({ user_id: user?.id }),
    enabled: !!user,
    refetchInterval: 2000,
    initialData: []
  });

  const addToCartMutation = useMutation({
    mutationFn: (data) => base44.entities.CartItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const addToWishlistMutation = useMutation({
    mutationFn: (data) => base44.entities.WishlistItem.create(data),
    onSuccess: () => {
      alert('💝 Added to wishlist!');
    }
  });

  const recordViewMutation = useMutation({
    mutationFn: (productId) => base44.entities.RecentlyViewed.create({
      user_id: user?.id,
      product_id: productId
    })
  });

  const handleAddToCart = (product) => {
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-black text-white mb-4">Church Store</h1>
              <p className="text-purple-200 text-lg">Quality products to support your faith journey</p>
            </div>
            <Button 
              onClick={() => setShowCart(true)}
              className="bg-cyan-500 hover:bg-cyan-600 h-14 px-8 font-bold text-lg relative"
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              Cart
              {cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full">
                  {cartItems.length}
                </Badge>
              )}
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 h-14 pl-12 text-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64 shrink-0">
            <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Categories
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'all' ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        All Products
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`w-full text-left px-3 py-2 rounded ${
                            selectedCategory === cat.name ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Price Range</h3>
                    <div className="space-y-2">
                      <Input 
                        type="number"
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                      <Input 
                        type="number"
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Sort By</h3>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name: A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400">
                Showing <span className="text-white font-bold">{sortedProducts.length}</span> products
              </p>
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

            <div className={viewMode === 'grid' ? 'grid md:grid-cols-3 gap-6' : 'space-y-4'}>
              {sortedProducts.map(product => {
                const images = product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [];
                const inStock = (product.stock_quantity || 0) > 0;
                
                return (
                  <Card 
                    key={product.id} 
                    className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-square overflow-hidden">
                        <img 
                          src={images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {!inStock && (
                          <Badge className="absolute top-4 left-4 bg-red-500">Out of Stock</Badge>
                        )}
                        {product.compare_at_price && (
                          <Badge className="absolute top-4 right-4 bg-green-500">
                            {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            size="icon"
                            className="bg-white text-black hover:bg-slate-200"
                            onClick={() => {
                              recordViewMutation.mutate(product.id);
                              window.location.href = createPageUrl('ProductDetail') + `?id=${product.id}`;
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon"
                            className="bg-white text-black hover:bg-slate-200"
                            onClick={() => addToWishlistMutation.mutate({ user_id: user?.id, product_id: product.id })}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        {product.category && (
                          <Badge className="bg-purple-500 mb-2">{product.category}</Badge>
                        )}
                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                          ))}
                          <span className="text-slate-400 text-sm ml-1">(89)</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                          <p className="text-2xl font-black text-white">${product.price?.toFixed(2)}</p>
                          {product.compare_at_price && (
                            <p className="text-slate-500 line-through">${product.compare_at_price.toFixed(2)}</p>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          disabled={!inStock}
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showCart && <RealtimeCart userId={user?.id} onClose={() => setShowCart(false)} />}
    </div>
  );
}