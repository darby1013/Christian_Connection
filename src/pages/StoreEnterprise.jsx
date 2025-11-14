import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ShoppingCart, Heart, Eye, Star, TrendingUp, Filter, Search, 
  Grid, List, Zap, Package, Clock, Shield, ArrowUpDown, Sparkles
} from 'lucide-react';

export default function StoreEnterprise() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Guest user');
      }
    };
    fetchUser();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory, sortBy],
    queryFn: async () => {
      let items = await base44.entities.Product.list('-created_date');
      
      if (selectedCategory !== 'all') {
        items = items.filter(p => p.category === selectedCategory);
      }

      if (sortBy === 'price_low') items.sort((a, b) => (a.price || 0) - (b.price || 0));
      if (sortBy === 'price_high') items.sort((a, b) => (b.price || 0) - (a.price || 0));
      if (sortBy === 'rating') items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      if (sortBy === 'newest') items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      return items;
    },
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: [],
  });

  const { data: cart = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CartItem.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: [],
  });

  const addToCartMutation = useMutation({
    mutationFn: (product) => base44.entities.CartItem.create({
      user_id: user.id,
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: 1,
      product_image: product.images?.[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('✅ Added to cart!');
    }
  });

  const addToWishlistMutation = useMutation({
    mutationFn: (product) => base44.entities.WishlistItem.create({
      wishlist_id: user.id,
      product_id: product.id,
      added_date: new Date().toISOString()
    }),
    onSuccess: () => {
      alert('✅ Added to wishlist!');
    }
  });

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (p.price || 0) >= priceRange.min && (p.price || 0) <= priceRange.max
  );

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Enterprise Store</h1>
            <p className="text-slate-400 font-semibold">Real-time inventory • Live pricing • Instant checkout</p>
          </div>
          <Link to={createPageUrl('ShoppingCartEnterprise')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 relative">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{products.length}</p>
              <p className="text-cyan-300 text-xs font-bold">Products Live</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{products.filter(p => (p.stock_quantity || 0) > 0).length}</p>
              <p className="text-green-300 text-xs font-bold">In Stock</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">24/7</p>
              <p className="text-purple-300 text-xs font-bold">Live Support</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-amber-300 text-xs font-bold">Secure</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/10">
              <CardContent className="p-4">
                <Link to={createPageUrl('ProductDetailEnterprise') + `?id=${product.id}`}>
                  <div className="relative mb-3">
                    <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-slate-600" />
                        </div>
                      )}
                    </div>
                    {(product.stock_quantity || 0) < 5 && (product.stock_quantity || 0) > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500">Only {product.stock_quantity} left!</Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500">
                        <Sparkles className="w-3 h-3 mr-1" />Featured
                      </Badge>
                    )}
                  </div>
                </Link>

                <div className="space-y-2">
                  <Link to={createPageUrl('ProductDetailEnterprise') + `?id=${product.id}`}>
                    <h3 className="text-white font-bold hover:text-cyan-400 transition-colors">{product.name}</h3>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <span className="text-slate-400 text-xs">({product.review_count || 0})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-white">${product.price}</p>
                      {product.compare_at_price && (
                        <p className="text-slate-500 line-through text-sm">${product.compare_at_price}</p>
                      )}
                    </div>
                    {(product.stock_quantity || 0) > 0 ? (
                      <Badge className="bg-green-500">In Stock</Badge>
                    ) : (
                      <Badge className="bg-red-500">Out of Stock</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => addToCartMutation.mutate(product)}
                      disabled={!user || (product.stock_quantity || 0) <= 0}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
                      size="sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      onClick={() => addToWishlistMutation.mutate(product)}
                      disabled={!user}
                      variant="outline"
                      className="border-slate-600"
                      size="sm"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-16 text-center">
              <Package className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-bold text-xl mb-2">No products found</p>
              <p className="text-slate-400">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}