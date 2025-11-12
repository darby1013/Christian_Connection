
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingCart, Heart, Star, Truck, Shield, RefreshCw,
  Check, Share2, Plus, Minus, ChevronLeft, ChevronRight,
  Package, TrendingUp, MessageSquare, ThumbsUp, Award, Crown
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DynamicProductBlocks from "../components/personalization/DynamicProductBlocks";
import AIRecommendations from "../components/personalization/AIRecommendations";

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    review_text: ''
  });

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

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const results = await base44.entities.Product.filter({ id: productId });
      return results[0] || null;
    },
    enabled: !!productId,
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['productVariants', productId],
    queryFn: () => base44.entities.ProductVariant.filter({ product_id: productId }),
    enabled: !!productId,
    initialData: [],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['productReviews', productId],
    queryFn: () => base44.entities.ProductReview.filter({ product_id: productId, is_approved: true }, '-created_date'),
    enabled: !!productId,
    initialData: [],
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ category: product?.category, status: 'active' }, '-created_date', 4),
    enabled: !!product?.category,
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

  const { data: userSegment } = useQuery({
    queryKey: ['userSegment', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const segments = await base44.entities.UserSegment.filter({ user_id: user.id });
      return segments[0] || null;
    },
    enabled: !!user,
  });

  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ['recentlyViewed', user?.id],
    queryFn: () => base44.entities.RecentlyViewed.filter({ user_id: user?.id }, '-viewed_at', 10),
    enabled: !!user,
    initialData: [],
  });

  const { data: pastOrders = [] } = useQuery({
    queryKey: ['myOrders', user?.id],
    queryFn: () => base44.entities.Order.filter({ customer_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  // Track product view
  useEffect(() => {
    if (user && product) {
      trackProductView();
    }
  }, [user, product]);

  const trackProductView = async () => {
    try {
      await base44.entities.RecentlyViewed.create({
        user_id: user.id,
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0],
        product_price: product.price,
        product_category: product.category,
        viewed_at: new Date().toISOString(),
        device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
    } catch (error) {
      console.log('Error tracking view', error);
    }
  };

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductReview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productReviews'] });
      setReviewForm({ rating: 5, title: '', review_text: '' });
      alert('✅ Review submitted for approval!');
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        alert('Please sign in first');
        base44.auth.redirectToLogin();
        return;
      }

      const carts = await base44.entities.ShoppingCart.filter({ user_id: user.id, is_active: true });
      const cart = carts[0];

      const cartItem = {
        product_id: product.id,
        variant_id: selectedVariant?.id,
        product_name: product.name,
        variant_name: selectedVariant ? `${selectedVariant.size} - ${selectedVariant.color}` : '',
        price: product.price,
        quantity,
        image_url: product.images?.[0],
        sku: selectedVariant?.sku || product.sku,
        is_in_stock: product.stock_quantity > 0
      };

      if (cart) {
        const existingItemIndex = cart.items.findIndex(i => 
          i.product_id === product.id && i.variant_id === selectedVariant?.id
        );
        let newItems;

        if (existingItemIndex >= 0) {
          newItems = [...cart.items];
          newItems[existingItemIndex].quantity += quantity;
        } else {
          newItems = [...cart.items, cartItem];
        }

        const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return base44.entities.ShoppingCart.update(cart.id, {
          items: newItems,
          subtotal,
          total: subtotal,
          last_updated: new Date().toISOString()
        });
      } else {
        return base44.entities.ShoppingCart.create({
          user_id: user.id,
          items: [cartItem],
          subtotal: product.price * quantity,
          total: product.price * quantity,
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

  const submitReview = () => {
    if (!user) {
      alert('Please sign in to leave a review');
      return;
    }

    createReviewMutation.mutate({
      product_id: productId,
      variant_id: selectedVariant?.id,
      user_id: user.id,
      user_name: user.full_name,
      ...reviewForm
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
          <p className="text-white font-semibold">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Product Not Found</h2>
            <Link to={createPageUrl("StoreAdvanced")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600 mt-4">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const discount = product.compare_at_price && product.price < product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link to={createPageUrl("StoreAdvanced")}>
          <Button variant="outline" className="border-slate-700 text-slate-300 mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
        </Link>

        {/* Dynamic Personalized Blocks - Above Product */}
        <DynamicProductBlocks
          product={product}
          user={user}
          loyalty={loyalty}
          userSegment={userSegment?.segment_type}
        />

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center">
                  <ShoppingCart className="w-24 h-24 text-white opacity-30" />
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-red-500 text-2xl font-black px-4 py-2">
                  SAVE {discount}%
                </Badge>
              )}
              {product.is_bestseller && (
                <Badge className="absolute top-4 left-4 bg-purple-500 px-4 py-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Best Seller
                </Badge>
              )}
              {loyalty && (
                <Badge className="absolute bottom-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-sm px-4 py-2">
                  <Crown className="w-4 h-4 mr-2" />
                  {loyalty.current_tier.toUpperCase()} Member
                </Badge>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      selectedImage === idx ? 'border-cyan-500' : 'border-slate-700'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.brand && (
              <p className="text-cyan-400 font-semibold mb-2">{product.brand}</p>
            )}
            <h1 className="text-4xl font-black text-white mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-slate-400">({reviews.length} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-8">
              {discount > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black text-white">${product.price.toFixed(2)}</span>
                  <span className="text-2xl text-slate-500 line-through">${product.compare_at_price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-5xl font-black text-white">${product.price.toFixed(2)}</span>
              )}
              
              {/* Member Price Display */}
              {loyalty && loyalty.current_tier !== 'bronze' && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      <span className="text-purple-200 font-semibold">Your {loyalty.current_tier} Member Price:</span>
                    </div>
                    <span className="text-yellow-300 font-black text-2xl">
                      ${(product.price * (1 - getTierDiscount(loyalty.current_tier) / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-300 mb-8 leading-relaxed">{product.description}</p>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mb-6">
                <Label className="text-white font-bold mb-3 block">Select Options</Label>
                <div className="grid grid-cols-3 gap-2">
                  {variants.slice(0, 12).map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stock_quantity === 0}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : variant.stock_quantity === 0
                          ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-white text-sm font-semibold">{variant.size}</p>
                      <p className="text-slate-400 text-xs">{variant.color}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <Label className="text-white font-bold mb-3 block">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center bg-slate-900 border-slate-700 text-white font-bold text-lg"
                />
                <Button
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                {product.stock_quantity > 0 && (
                  <span className="text-slate-400 text-sm">
                    {product.stock_quantity} in stock
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3 mb-8">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={product.stock_quantity === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold text-lg h-14"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="icon"
                className="bg-slate-700 hover:bg-slate-600 w-14 h-14"
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="bg-slate-700 hover:bg-slate-600 w-14 h-14"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Truck className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-white font-semibold text-sm">Free Shipping</p>
                  <p className="text-slate-400 text-xs">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-white font-semibold text-sm">Secure Checkout</p>
                  <p className="text-slate-400 text-xs">Encrypted payment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <RefreshCw className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-white font-semibold text-sm">Easy Returns</p>
                  <p className="text-slate-400 text-xs">30-day guarantee</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Package className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-white font-semibold text-sm">In Stock</p>
                  <p className="text-slate-400 text-xs">Ships in 1-2 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Powered Recommendations */}
        {user && (
          <AIRecommendations
            user={user}
            loyalty={loyalty}
            recentlyViewed={recentlyViewed}
            pastOrders={pastOrders}
          />
        )}

        {/* Reviews Section */}
        <Tabs defaultValue="reviews" className="mt-12">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="reviews" className="data-[state=active]:bg-cyan-500">
              <Star className="w-4 h-4 mr-2" />
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="write" className="data-[state=active]:bg-cyan-500">
              <MessageSquare className="w-4 h-4 mr-2" />
              Write Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-white font-bold">{review.user_name}</p>
                        {review.verified_purchase && (
                          <Badge className="bg-green-500">
                            <Check className="w-3 h-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="text-white font-bold mb-2">{review.title}</h4>
                  )}
                  <p className="text-slate-300 mb-4">{review.review_text}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <button className="text-slate-400 hover:text-white flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({review.helpful_count || 0})
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="write" className="mt-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-bold">Write a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                        className="p-2 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Review Title</Label>
                  <Input
                    placeholder="Sum up your experience"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Your Review</Label>
                  <Textarea
                    placeholder="Share your thoughts about this product..."
                    value={reviewForm.review_text}
                    onChange={(e) => setReviewForm({...reviewForm, review_text: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white h-32"
                  />
                </div>

                <Button
                  onClick={submitReview}
                  disabled={!reviewForm.review_text || !user}
                  className="bg-cyan-500 hover:bg-cyan-600 font-bold"
                >
                  Submit Review
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-white mb-6">You May Also Like</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {relatedProducts.filter(p => p.id !== productId).slice(0, 4).map((prod) => (
                <Link key={prod.id} to={createPageUrl("ProductDetail") + `?id=${prod.id}`}>
                  <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50 transition-all group cursor-pointer">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-white font-bold mb-2 line-clamp-2">{prod.name}</h3>
                      <p className="text-2xl font-black text-white">${prod.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className, ...props }) {
  return <label className={className} {...props}>{children}</label>;
}

function getTierDiscount(tier) {
  switch(tier) {
    case 'silver': return 5;
    case 'gold': return 10;
    case 'platinum': return 15;
    case 'diamond': return 20;
    default: return 0;
  }
}
