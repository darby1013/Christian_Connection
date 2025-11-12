import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag,
  ShoppingBag, Heart, Lock, Truck, AlertCircle, X, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Cart() {
  const [user, setUser] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [processingCoupon, setProcessingCoupon] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: cart } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const carts = await base44.entities.ShoppingCart.filter({ user_id: user.id, is_active: true });
      return carts[0] || null;
    },
    enabled: !!user,
  });

  const updateCartMutation = useMutation({
    mutationFn: ({ cartId, data }) => base44.entities.ShoppingCart.update(cartId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateQuantity = (itemIndex, newQuantity) => {
    if (!cart || newQuantity < 1) return;

    const newItems = [...cart.items];
    newItems[itemIndex].quantity = newQuantity;

    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = appliedCoupon ? calculateDiscount(subtotal) : 0;

    updateCartMutation.mutate({
      cartId: cart.id,
      data: {
        items: newItems,
        subtotal,
        discount_amount: discount,
        total: subtotal - discount,
        last_updated: new Date().toISOString()
      }
    });
  };

  const removeItem = (itemIndex) => {
    if (!cart) return;

    const newItems = cart.items.filter((_, idx) => idx !== itemIndex);
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = appliedCoupon ? calculateDiscount(subtotal) : 0;

    updateCartMutation.mutate({
      cartId: cart.id,
      data: {
        items: newItems,
        subtotal,
        discount_amount: discount,
        total: subtotal - discount,
        last_updated: new Date().toISOString()
      }
    });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setProcessingCoupon(true);
    try {
      const coupons = await base44.entities.Coupon.filter({
        code: couponCode.toUpperCase(),
        is_active: true
      });

      if (coupons.length === 0) {
        alert('❌ Invalid coupon code');
        return;
      }

      const coupon = coupons[0];

      // Validate coupon
      if (coupon.minimum_purchase && cart.subtotal < coupon.minimum_purchase) {
        alert(`Minimum purchase of $${coupon.minimum_purchase} required`);
        return;
      }

      if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
        alert('This coupon has reached its usage limit');
        return;
      }

      if (coupon.end_date && new Date(coupon.end_date) < new Date()) {
        alert('This coupon has expired');
        return;
      }

      setAppliedCoupon(coupon);
      const discount = calculateDiscount(cart.subtotal, coupon);

      await updateCartMutation.mutateAsync({
        cartId: cart.id,
        data: {
          applied_coupons: [coupon.code],
          discount_amount: discount,
          total: cart.subtotal - discount
        }
      });

      alert('✅ Coupon applied!');
    } catch (error) {
      alert('Error applying coupon');
    } finally {
      setProcessingCoupon(false);
    }
  };

  const calculateDiscount = (subtotal, coupon = appliedCoupon) => {
    if (!coupon) return 0;

    switch(coupon.discount_type) {
      case 'percentage':
        const percentDiscount = subtotal * (coupon.discount_value / 100);
        return coupon.maximum_discount ? Math.min(percentDiscount, coupon.maximum_discount) : percentDiscount;
      case 'fixed_amount':
        return Math.min(coupon.discount_value, subtotal);
      default:
        return 0;
    }
  };

  const removeCoupon = async () => {
    setAppliedCoupon(null);
    setCouponCode("");

    await updateCartMutation.mutateAsync({
      cartId: cart.id,
      data: {
        applied_coupons: [],
        discount_amount: 0,
        total: cart.subtotal
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-12 text-center">
            <Lock className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Sign In Required</h2>
            <p className="text-slate-400 mb-6">Please sign in to view your cart</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Your Cart is Empty</h2>
            <p className="text-slate-400 mb-6">Add some products to get started</p>
            <Link to={createPageUrl("StoreAdvanced")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Continue Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = cart.subtotal || 0;
  const discount = cart.discount_amount || 0;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = (subtotal - discount + shipping) * 0.08;
  const total = subtotal - discount + shipping + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, idx) => (
              <Card key={idx} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{item.product_name}</h3>
                      {item.variant_name && (
                        <p className="text-slate-400 text-sm mb-2">{item.variant_name}</p>
                      )}
                      <p className="text-cyan-400 font-bold text-lg">${item.price.toFixed(2)}</p>
                      {!item.is_in_stock && (
                        <Badge className="bg-red-500 mt-2">Out of Stock</Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          className="bg-slate-700 hover:bg-slate-600 w-8 h-8"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          className="bg-slate-700 hover:bg-slate-600 w-8 h-8"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-white font-black text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Coupon Input */}
                <div>
                  <Label className="text-white font-bold mb-2 block">Coupon Code</Label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 font-bold">{appliedCoupon.code}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeCoupon}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                      <Button
                        onClick={applyCoupon}
                        disabled={processingCoupon || !couponCode.trim()}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        {processingCoupon ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-400">Discount</span>
                      <span className="text-green-400 font-bold">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping</span>
                    <span className="text-white font-bold">
                      {shipping === 0 ? (
                        <Badge className="bg-green-500">FREE</Badge>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {subtotal < 50 && (
                    <div className="p-2 bg-amber-900/20 border border-amber-500/30 rounded text-center">
                      <p className="text-amber-300 text-xs">
                        Add ${(50 - subtotal).toFixed(2)} more for FREE shipping!
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax (8%)</span>
                    <span className="text-white font-bold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="text-white font-black text-lg">Total</span>
                    <span className="text-cyan-400 font-black text-2xl">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link to={createPageUrl("Checkout")}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold text-lg h-12">
                    <Lock className="w-5 h-5 mr-2" />
                    Secure Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Secure
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Fast Shipping
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Guaranteed
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className, ...props }) {
  return <label className={className} {...props}>{children}</label>;
}