import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Star, ShoppingCart, Heart, Share2, Check, Truck, Shield, RefreshCcw, Tag } from 'lucide-react';

export default function ProductDetail() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get('id');
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);
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

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['productReviews', productId],
    queryFn: () => base44.entities.ProductReview.filter({ product_id: productId }),
    initialData: []
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['relatedProducts', product?.category],
    queryFn: () => base44.entities.Product.filter({ category: product?.category }),
    enabled: !!product?.category,
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
      alert('💝 Added to wishlist!');
    }
  });

  const addToCart = () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    addToCartMutation.mutate({
      user_id: user.id,
      product_id: product.id,
      quantity,
      variant: selectedVariant,
      price: product.price
    });
  };

  if (!product) return <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center"><p className="text-white">Loading...</p></div>;

  const images = Array.isArray(product.images) 
    ? product.images 
    : (product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : []) : []);
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const inStock = (product.stock_quantity || 0) > 0;

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-900">
              <img 
                src={images[selectedImage] || '/placeholder.jpg'} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, i) => (
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
          </div>

          <div>
            <Badge className={inStock ? 'bg-green-500' : 'bg-red-500'} mb={2}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
            <h1 className="text-4xl font-black text-white mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                ))}
              </div>
              <span className="text-slate-400">{reviews.length} reviews</span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <p className="text-5xl font-black text-white">${product.price?.toFixed(2)}</p>
                {product.compare_at_price && (
                  <>
                    <p className="text-2xl text-slate-500 line-through">${product.compare_at_price.toFixed(2)}</p>
                    <Badge className="bg-red-500">
                      {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <p className="text-slate-300 mb-6 leading-relaxed">{product.description}</p>

            {product.variants && (
              <div className="mb-6">
                <label className="text-white font-bold mb-2 block">Select Variant</label>
                <div className="flex gap-2 flex-wrap">
                  {JSON.parse(product.variants).map((variant, i) => (
                    <Button
                      key={i}
                      variant={selectedVariant === variant ? 'default' : 'outline'}
                      onClick={() => setSelectedVariant(variant)}
                      className={selectedVariant === variant ? 'bg-cyan-500' : 'border-slate-600'}
                    >
                      {variant}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="text-white font-bold mb-2 block">Quantity</label>
              <div className="flex items-center gap-2">
                <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="outline" className="border-slate-600">-</Button>
                <span className="text-white font-bold w-12 text-center">{quantity}</span>
                <Button onClick={() => setQuantity(quantity + 1)} variant="outline" className="border-slate-600">+</Button>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <Button 
                onClick={addToCart}
                disabled={!inStock}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 h-14 font-bold text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button 
                onClick={() => addToWishlistMutation.mutate({ user_id: user?.id, product_id: product.id })}
                variant="outline" 
                className="border-slate-600 h-14 px-6"
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" className="border-slate-600 h-14 px-6">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <Truck className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-bold">Free Shipping</p>
                  <p className="text-slate-400 text-xs">Orders over $50</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-bold">Secure Payment</p>
                  <p className="text-slate-400 text-xs">100% protected</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <RefreshCcw className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-bold">Easy Returns</p>
                  <p className="text-slate-400 text-xs">30-day policy</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Tabs defaultValue="reviews" className="mb-12">
          <TabsList className="bg-slate-900 border-slate-700">
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="shipping">Shipping Info</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {reviews.map(review => (
                <Card key={review.id} className="bg-slate-900 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-bold">{review.user_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-cyan-500">{review.verified_purchase ? 'Verified Purchase' : 'Unverified'}</Badge>
                    </div>
                    <p className="text-slate-300">{review.review_text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="specs" className="mt-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <p className="text-slate-300">Product specifications and details will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <p className="text-slate-300">Shipping information and delivery options.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div>
          <h2 className="text-3xl font-black text-white mb-6">Related Products</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map(p => {
              const relImages = Array.isArray(p.images) 
                ? p.images 
                : (p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : []) : []);
              return (
                <Card key={p.id} className="bg-slate-900 border-slate-700 hover:border-cyan-500 transition-all">
                  <CardContent className="p-4">
                    <img src={relImages[0] || '/placeholder.jpg'} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                    <h4 className="text-white font-bold mb-2">{p.name}</h4>
                    <p className="text-cyan-400 font-black text-xl">${p.price?.toFixed(2)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}