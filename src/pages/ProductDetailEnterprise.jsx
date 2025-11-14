import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ShoppingCart, Heart, Share2, Star, Package, Truck, Shield, 
  Clock, CheckCircle, Minus, Plus, MessageSquare, Eye, Zap
} from 'lucide-react';

export default function ProductDetailEnterprise() {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [user, setUser] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProductId(params.get('id'));
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {}
    };
    fetchUser();
  }, []);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.list();
      return products.find(p => p.id === productId);
    },
    enabled: !!productId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => base44.entities.Review.filter({ product_id: productId }),
    enabled: !!productId,
    initialData: [],
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['relatedProducts', product?.category],
    queryFn: async () => {
      if (!product?.category) return [];
      const products = await base44.entities.Product.filter({ category: product.category });
      return products.filter(p => p.id !== productId).slice(0, 4);
    },
    enabled: !!product?.category,
    initialData: [],
  });

  const addToCartMutation = useMutation({
    mutationFn: () => base44.entities.CartItem.create({
      user_id: user.id,
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: quantity,
      product_image: product.images?.[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert(`✅ Added ${quantity} item(s) to cart!`);
    }
  });

  const addReviewMutation = useMutation({
    mutationFn: () => base44.entities.Review.create({
      product_id: productId,
      user_id: user.id,
      user_name: user.full_name,
      rating: reviewRating,
      review_text: reviewText
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setReviewText('');
      setReviewRating(5);
      alert('✅ Review posted!');
    }
  });

  if (!product) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-slate-800 rounded-2xl overflow-hidden mb-4 border border-slate-700">
              {product.images?.[selectedImage] ? (
                <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-32 h-32 text-slate-600" />
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === i ? 'border-cyan-500' : 'border-slate-700'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-purple-500 mb-2">{product.category}</Badge>
              <h1 className="text-4xl font-black text-white mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                  ))}
                </div>
                <span className="text-white font-bold">{avgRating.toFixed(1)}</span>
                <span className="text-slate-400">({reviews.length} reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <p className="text-5xl font-black text-white">${product.price}</p>
              {product.compare_at_price && (
                <>
                  <p className="text-2xl text-slate-500 line-through">${product.compare_at_price}</p>
                  <Badge className="bg-red-500">
                    {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed">{product.description}</p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="border-slate-600"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center bg-slate-900 border-slate-700 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="border-slate-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Badge className={(product.stock_quantity || 0) > 10 ? 'bg-green-500' : 'bg-amber-500'}>
                {product.stock_quantity || 0} in stock
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={!user || (product.stock_quantity || 0) <= 0}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 h-14 text-lg font-bold"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" className="border-slate-600" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" className="border-slate-600" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 flex items-center gap-3">
                  <Truck className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-white font-bold text-sm">Free Shipping</p>
                    <p className="text-slate-400 text-xs">On orders $50+</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white font-bold text-sm">Secure Payment</p>
                    <p className="text-slate-400 text-xs">100% protected</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-xl mb-4">Product Details</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed">{product.description}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {user && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <h3 className="text-white font-bold mb-4">Write a Review</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-white text-sm font-bold mb-2 block">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setReviewRating(star)}>
                              <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        placeholder="Share your experience..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                      <Button onClick={() => addReviewMutation.mutate()} className="bg-cyan-500">
                        Post Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {reviews.map(review => (
                <Card key={review.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>{review.user_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-white font-bold">{review.user_name}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-300">{review.review_text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="related" className="mt-6">
            <div className="grid md:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <Card key={p.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-slate-900 rounded-lg mb-3 overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-white font-bold mb-2">{p.name}</h4>
                    <p className="text-2xl font-black text-white">${p.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}