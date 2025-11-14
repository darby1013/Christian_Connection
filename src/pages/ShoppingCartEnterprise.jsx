import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Trash2, Plus, Minus, ShoppingBag, Clock, Package, Gift, 
  Truck, CreditCard, Tag, Heart, Save, AlertCircle, Sparkles
} from 'lucide-react';

export default function ShoppingCartEnterprise() {
  const [user, setUser] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        window.location.href = createPageUrl('Home');
      }
    };
    fetchUser();
  }, []);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => base44.entities.CartItem.filter({ user_id: user.id }),
    enabled: !!user,
    initialData: [],
    refetchInterval: 3000, // Real-time updates
  });

  const { data: appliedCoupon } = useQuery({
    queryKey: ['coupon', couponCode],
    queryFn: async () => {
      if (!couponCode) return null;
      const coupons = await base44.entities.Coupon.filter({ code: couponCode });
      return coupons[0] || null;
    },
    enabled: !!couponCode,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => base44.entities.CartItem.update(id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: (id) => base44.entities.CartItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const saveForLaterMutation = useMutation({
    mutationFn: (item) => {
      return base44.entities.WishlistItem.create({
        wishlist_id: user.id,
        product_id: item.product_id,
        added_date: new Date().toISOString()
      });
    },
    onSuccess: (_, item) => {
      removeItemMutation.mutate(item.id);
      alert('✅ Saved to wishlist!');
    }
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const discount = appliedCoupon ? (subtotal * (appliedCoupon.discount_percentage || 0) / 100) : 0;
  const tax = (subtotal - discount) * 0.08;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const giftWrapCost = giftWrap ? 4.99 : 0;
  const total = subtotal - discount + tax + shipping + giftWrapCost;

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Shopping Cart</h1>
            <p className="text-slate-400 font-semibold">{cartItems.length} items • Real-time pricing</p>
          </div>
          <Link to={createPageUrl('StoreEnterprise')}>
            <Button variant="outline" className="border-slate-600">
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-16 text-center">
                  <ShoppingBag className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-bold text-xl mb-2">Your cart is empty</p>
                  <p className="text-slate-400 mb-4">Start shopping to add items</p>
                  <Link to={createPageUrl('StoreEnterprise')}>
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                      Browse Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {cartItems.map(item => (
                  <Card key={item.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-white font-bold text-lg">{item.product_name}</h3>
                              <p className="text-slate-400 text-sm">SKU: {item.product_id}</p>
                            </div>
                            <p className="text-2xl font-black text-white">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                          </div>

                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: Math.max(1, (item.quantity || 1) - 1) })}
                                className="h-8 w-8 border-slate-600"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantityMutation.mutate({ id: item.id, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-16 text-center bg-slate-900 border-slate-700 text-white h-8"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: (item.quantity || 1) + 1 })}
                                className="h-8 w-8 border-slate-600"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveForLaterMutation.mutate(item)}
                              className="text-cyan-400"
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              Save for Later
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemMutation.mutate(item.id)}
                              className="text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Special Features */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={giftWrap} onCheckedChange={setGiftWrap} />
                      <Gift className="w-5 h-5 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-white font-bold">Add Gift Wrapping</p>
                        <p className="text-slate-400 text-sm">Beautiful packaging • $4.99</p>
                      </div>
                    </div>

                    {giftWrap && (
                      <Textarea
                        placeholder="Gift message (optional)"
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    )}

                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Special Instructions</label>
                      <Textarea
                        placeholder="Delivery notes, preferences..."
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-white font-black text-xl mb-4">Order Summary</h2>

                {/* Coupon Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Button variant="outline" className="border-slate-600">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>

                {appliedCoupon && (
                  <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                    <p className="text-green-300 font-bold text-sm">✓ Coupon applied: {appliedCoupon.discount_percentage}% OFF</p>
                  </div>
                )}

                <div className="space-y-3 py-4 border-t border-slate-700">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span className="font-bold">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Tax (8%)</span>
                    <span className="font-bold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Shipping</span>
                    <span className="font-bold">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {giftWrap && (
                    <div className="flex justify-between text-slate-300">
                      <span>Gift Wrapping</span>
                      <span className="font-bold">${giftWrapCost.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-white text-xl font-black pt-4 border-t border-slate-700">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <Link to={createPageUrl('CheckoutEnterprise')}>
                  <Button
                    disabled={cartItems.length === 0}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 h-14 text-lg font-bold"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Truck className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold">Free Shipping</p>
                    <p className="text-slate-400 text-sm">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold">Estimated Delivery</p>
                    <p className="text-slate-400 text-sm">{estimatedDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-bold text-sm">Secure Checkout</p>
                <p className="text-green-200 text-xs">256-bit SSL encryption</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}