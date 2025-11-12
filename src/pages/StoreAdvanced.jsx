import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ShoppingCart, Heart, Star, Filter, Search, Grid, List,
  TrendingUp, Zap, Tag, SlidersHorizontal, Eye, Share2, ChevronDown,
  Award, Gift, Clock, Scale, Layers, Crown
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuickViewModal from "../components/store/QuickViewModal";
import ProductComparisonTool from "../components/store/ProductComparisonTool";
import RecentlyViewedProducts from "../components/store/RecentlyViewedProducts";

export default function StoreAdvanced() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  
  // NEW: Quick View & Comparison
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [compareProducts, setCompareProducts] = useState([]);
  const [showBundles, setShowBundles] = useState(false);
  const [showPreOrders, setShowPreOrders] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: [],
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['productBundles'],
    queryFn: () => base44.entities.ProductBundle.filter({ is_active: true }),
    initialData: [],
  });

  const { data: bulkPricing = [] } = useQuery({
    queryKey: ['bulkPricing'],
    queryFn: () => base44.entities.BulkPricing.filter({ is_active: true }),
    initialData: [],
  });

  const { data: loyalty } = useQuery({
    queryKey: ['myLoyalty', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const records = await base44.entities.CustomerLoyalty.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user,
  });

  const { data: cart } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const carts = await base44.entities.ShoppingCart.filter({ user_id: user.id, is_active: true });
      return carts[0] || null;
    },
    enabled: !!user,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const wishlists = await base44.entities.Wishlist.filter({ user_id: user.id });
      return wishlists[0] || null;
    },
    enabled: !!user,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ product }) => {
      if (!user) {
        alert('Please sign in to add items to cart');
        return;
      }

      const existingCart = cart;
      const cartItem = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.images?.[0],
        sku: product.sku,
        is_in_stock: product.stock_quantity > 0
      };

      if (existingCart) {
        const existingItemIndex = existingCart.items.findIndex(i => i.product_id === product.id);
        let newItems;

        if (existingItemIndex >= 0) {
          newItems = [...existingCart.items];
          newItems[existingItemIndex].quantity += 1;
        } else {
          newItems = [...existingCart.items, cartItem];
        }

        const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return base44.entities.ShoppingCart.update(existingCart.id, {
          items: newItems,
          subtotal,
          total: subtotal,
          last_updated: new Date().toISOString()
        });
      } else {
        return base44.entities.ShoppingCart.create({
          user_id: user.id,
          items: [cartItem],
          subtotal: product.price,
          total: product.price,
          is_active: true,
          last_updated: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('✅ Added to cart!');
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async ({ product }) => {
      if (!user) {
        alert('Please sign in to add to wishlist');
        return;
      }

      const wishlistItem = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        image_url: product.images?.[0],
        added_date: new Date().toISOString(),
        priority: 'medium'
      };

      if (wishlist) {
        const items = [...wishlist.items, wishlistItem];
        return base44.entities.Wishlist.update(wishlist.id, {
          items,
          item_count: items.length,
          total_value: items.reduce((sum, i) => sum + i.price, 0)
        });
      } else {
        return base44.entities.Wishlist.create({
          user_id: user.id,
          name: 'My Wishlist',
          items: [wishlistItem],
          item_count: 1,
          total_value: product.price
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      alert('❤️ Added to wishlist!');
    },
  });

  const toggleCompare = (product) => {
    if (compareProducts.find(p => p.id === product.id)) {
      setCompareProducts(compareProducts.filter(p => p.id !== product.id));
    } else {
      if (compareProducts.length >= 4) {
        alert('Maximum 4 products for comparison');
        return;
      }
      setCompareProducts([...compareProducts, product]);
    }
  };

  const applyFilters = (productList) => {
    let filtered = [...productList];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }

    if (selectedRating > 0) {
      filtered = filtered.filter(p => (p.rating || 0) >= selectedRating);
    }

    if (inStock) {
      filtered = filtered.filter(p => p.stock_quantity > 0);
    }

    if (onSale) {
      filtered = filtered.filter(p => p.is_on_sale);
    }

    switch(sortBy) {
      case 'price_asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'name_asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)); break;
      case 'bestseller': filtered.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)); break;
      default: break;
    }

    return filtered;
  };

  const getBulkDiscount = (product) => {
    const pricing = bulkPricing.filter(bp => bp.product_id === product.id && bp.is_active);
    return pricing.length > 0 ? pricing[0] : null;
  };

  const filteredProducts = applyFilters(products.filter(p => p.status === 'active'));
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const maxPrice = Math.max(...products.map(p => p.price), 1000);

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setPriceRange([0, maxPrice]);
    setSelectedBrands([]);
    setSelectedRating(0);
    setInStock(false);
    setOnSale(false);
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== "all",
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    selectedBrands.length > 0,
    selectedRating > 0,
    inStock,
    onSale
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Loyalty Badge */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Glory Wave Store</h1>
            <p className="text-slate-400 font-semibold">Faith-inspired products for your journey</p>
          </div>
          {user && loyalty && (
            <Link to={createPageUrl("LoyaltyDashboard")}>
              <Card className={`bg-gradient-to-br ${getTierColor(loyalty.current_tier)} border-0 cursor-pointer hover:scale-105 transition-transform`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Crown className="w-8 h-8 text-white" />
                  <div>
                    <p className="text-white/80 text-xs">Your Tier</p>
                    <p className="text-white font-black capitalize">{loyalty.current_tier}</p>
                    <p className="text-white/90 text-xs">{loyalty.total_points} points</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Featured Bundles Banner */}
        {bundles.length > 0 && showBundles && (
          <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="w-10 h-10 text-purple-400" />
                  <div>
                    <h3 className="text-white font-black text-xl">Special Bundles Available!</h3>
                    <p className="text-purple-200">Save up to 30% with our curated product bundles</p>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  View Bundles ({bundles.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & View Controls */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-[#1a1f3a] border border-slate-700 text-white hover:bg-slate-800"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-cyan-500">{activeFiltersCount}</Badge>
            )}
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-[#1a1f3a] border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="featured" className="text-white">Featured</SelectItem>
              <SelectItem value="bestseller" className="text-white">Best Sellers</SelectItem>
              <SelectItem value="newest" className="text-white">Newest</SelectItem>
              <SelectItem value="price_asc" className="text-white">Price: Low to High</SelectItem>
              <SelectItem value="price_desc" className="text-white">Price: High to Low</SelectItem>
              <SelectItem value="rating" className="text-white">Top Rated</SelectItem>
              <SelectItem value="name_asc" className="text-white">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-cyan-500' : 'bg-slate-700'}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-cyan-500' : 'bg-slate-700'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Enhanced Filters Sidebar */}
          {showFilters && (
            <div className="w-80 space-y-4 flex-shrink-0">
              <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
                <CardContent className="p-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold">Filters</h3>
                    {activeFiltersCount > 0 && (
                      <Button size="sm" onClick={clearFilters} variant="outline" className="border-red-500/30 text-red-400 h-7">
                        Clear ({activeFiltersCount})
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </Label>
                    <Slider
                      value={priceRange}
                      max={maxPrice}
                      step={10}
                      onValueChange={setPriceRange}
                      className="mb-2"
                    />
                  </div>

                  {brands.length > 0 && (
                    <div>
                      <Label className="text-white font-bold mb-2 block">Brands</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map(brand => (
                          <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={() => toggleBrand(brand)}
                              className="w-4 h-4"
                            />
                            <span className="text-slate-300 text-sm">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-white font-bold mb-2 block">Minimum Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(rating === selectedRating ? 0 : rating)}
                          className={`flex-1 h-10 rounded flex items-center justify-center ${
                            selectedRating >= rating ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${selectedRating >= rating ? 'text-white fill-white' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStock}
                        onChange={(e) => setInStock(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onSale}
                        onChange={(e) => setOnSale(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">On Sale</span>
                    </label>
                  </div>

                  {/* NEW: Special Filters */}
                  <div className="border-t border-slate-700 pt-4 space-y-3">
                    <Button
                      onClick={() => setShowBundles(!showBundles)}
                      variant="outline"
                      className="w-full border-purple-500/30 text-purple-300"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Bundles ({bundles.length})
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-amber-500/30 text-amber-300"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pre-Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Product Grid/List */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <p className="text-slate-400">
                  Showing <span className="text-white font-bold">{filteredProducts.length}</span> products
                </p>
                {compareProducts.length > 0 && (
                  <Badge className="bg-purple-500 px-3 py-1">
                    <Scale className="w-3 h-3 mr-1" />
                    {compareProducts.length} selected for comparison
                  </Badge>
                )}
              </div>
              {user && (
                <div className="flex gap-2">
                  <Link to={createPageUrl("LoyaltyDashboard")}>
                    <Button variant="outline" className="border-purple-500/30 text-purple-300">
                      <Award className="w-4 h-4 mr-2" />
                      Rewards
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Cart")}>
                    <Button className="bg-cyan-500 hover:bg-cyan-600">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Cart ({cart?.items?.length || 0})
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Wishlist")}>
                    <Button variant="outline" className="border-slate-700 text-slate-300">
                      <Heart className="w-4 h-4 mr-2" />
                      Wishlist ({wishlist?.items?.length || 0})
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Bundles Section */}
            {showBundles && bundles.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                  <Gift className="w-6 h-6 text-purple-400" />
                  Value Bundles
                </h2>
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {bundles.map((bundle) => {
                    const savings = ((bundle.regular_price - bundle.bundle_price) / bundle.regular_price) * 100;
                    return (
                      <Card key={bundle.id} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 hover:scale-105 transition-transform">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Gift className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-black text-xl mb-2">{bundle.bundle_name}</h3>
                              <p className="text-purple-200 text-sm mb-3">{bundle.description}</p>
                              <div className="flex items-center gap-2 mb-3">
                                <Badge className="bg-purple-500">{bundle.products?.length} items</Badge>
                                <Badge className="bg-red-500 text-lg font-black">SAVE {savings.toFixed(0)}%</Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 line-through">${bundle.regular_price?.toFixed(2)}</span>
                                <span className="text-3xl font-black text-white">${bundle.bundle_price?.toFixed(2)}</span>
                              </div>
                              <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add Bundle to Cart
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl mb-2">No Products Found</h3>
                  <p className="text-slate-400 mb-6">Try adjusting your filters</p>
                  <Button onClick={clearFilters} className="bg-cyan-500 hover:bg-cyan-600">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredProducts.map((product) => {
                  const discount = product.compare_at_price && product.price < product.compare_at_price
                    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                    : 0;
                  const isInWishlist = wishlist?.items?.some(i => i.product_id === product.id);
                  const isInCompare = compareProducts.find(p => p.id === product.id);
                  const bulkDiscount = getBulkDiscount(product);

                  return viewMode === 'grid' ? (
                    <Card key={product.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50 transition-all group">
                      <div className="relative">
                        <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
                          <div className="relative aspect-square overflow-hidden rounded-t-lg">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center">
                                <ShoppingCart className="w-16 h-16 text-white opacity-30" />
                              </div>
                            )}
                            {product.is_new_arrival && (
                              <Badge className="absolute top-2 left-2 bg-green-500">NEW</Badge>
                            )}
                            {product.is_bestseller && (
                              <Badge className="absolute top-2 left-2 bg-purple-500">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Best Seller
                              </Badge>
                            )}
                            {discount > 0 && (
                              <Badge className="absolute top-2 right-2 bg-red-500 text-lg font-black">
                                -{discount}%
                              </Badge>
                            )}
                            {bulkDiscount && (
                              <Badge className="absolute bottom-2 left-2 bg-green-500">
                                <Layers className="w-3 h-3 mr-1" />
                                Bulk Pricing
                              </Badge>
                            )}
                          </div>
                        </Link>
                        
                        {/* NEW: Quick Action Buttons */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                          {discount === 0 && (
                            <Button
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                addToWishlistMutation.mutate({ product });
                              }}
                              className={`${
                                isInWishlist ? 'bg-red-500' : 'bg-black/50'
                              } hover:bg-red-600 backdrop-blur-sm`}
                            >
                              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-white' : ''}`} />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              setQuickViewProduct(product);
                            }}
                            className="bg-black/50 hover:bg-cyan-600 backdrop-blur-sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleCompare(product);
                            }}
                            className={`${
                              isInCompare ? 'bg-purple-500' : 'bg-black/50'
                            } hover:bg-purple-600 backdrop-blur-sm`}
                          >
                            <Scale className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
                          <h3 className="text-white font-bold mb-2 line-clamp-2 hover:text-cyan-400 transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                                }`}
                              />
                            ))}
                            <span className="text-slate-400 text-xs ml-1">({product.review_count || 0})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          {discount > 0 ? (
                            <>
                              <span className="text-2xl font-black text-white">${product.price.toFixed(2)}</span>
                              <span className="text-slate-500 line-through">${product.compare_at_price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-2xl font-black text-white">${product.price.toFixed(2)}</span>
                          )}
                        </div>
                        {loyalty && loyalty.current_tier !== 'bronze' && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 mb-2 w-full justify-center">
                            <Crown className="w-3 h-3 mr-1" />
                            Member price: ${(product.price * (1 - (currentTier?.discount_percentage || 0) / 100)).toFixed(2)}
                          </Badge>
                        )}
                        {bulkDiscount && (
                          <div className="p-2 bg-green-900/20 border border-green-500/30 rounded mb-2">
                            <p className="text-green-300 text-xs font-bold">
                              <Layers className="w-3 h-3 inline mr-1" />
                              Buy {bulkDiscount.min_quantity}+ for ${bulkDiscount.final_unit_price?.toFixed(2)} each
                            </p>
                          </div>
                        )}
                        {product.stock_quantity <= 0 ? (
                          <Badge className="bg-red-500 w-full justify-center">Out of Stock</Badge>
                        ) : product.stock_quantity <= product.low_stock_threshold ? (
                          <Badge className="bg-amber-500 w-full justify-center mb-2">
                            Only {product.stock_quantity} left!
                          </Badge>
                        ) : null}
                        <Button
                          onClick={() => addToCartMutation.mutate({ product })}
                          disabled={product.stock_quantity <= 0}
                          className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={product.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-5">
                        {/* List view content - keep existing list view */}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Recently Viewed */}
            {user && <RecentlyViewedProducts user={user} />}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        user={user}
        cart={cart}
      />

      {/* Comparison Toolbar */}
      <ProductComparisonTool
        products={compareProducts}
        onRemove={(id) => setCompareProducts(compareProducts.filter(p => p.id !== id))}
        onAddToCart={(product) => addToCartMutation.mutate({ product })}
      />
    </div>
  );
}

function Label({ children, className, ...props }) {
  return <label className={className} {...props}>{children}</label>;
}

function getTierColor(tier) {
  switch(tier) {
    case 'bronze': return 'from-amber-700 to-orange-700';
    case 'silver': return 'from-slate-400 to-slate-500';
    case 'gold': return 'from-yellow-400 to-amber-500';
    case 'platinum': return 'from-cyan-400 to-blue-500';
    case 'diamond': return 'from-purple-500 to-pink-500';
    default: return 'from-slate-500 to-slate-600';
  }
}

let currentTier = null;