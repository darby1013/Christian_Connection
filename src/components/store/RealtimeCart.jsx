import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus, Minus, ShoppingCart, Trash2, Gift, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RealtimeCart({ userId, onClose }) {
  const [couponCode, setCouponCode] = useState('');
  const queryClient = useQueryClient();

  const { data: cartItems = [], refetch } = useQuery({
    queryKey: ['cart', userId],
    queryFn: async () => {
      const items = await base44.entities.CartItem.filter({ user_id: userId });
      return items;
    },
    refetchInterval: 2000,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => base44.entities.CartItem.update(id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: (id) => base44.entities.CartItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const applyCouponMutation = useMutation({
    mutationFn: async (code) => {
      const coupons = await base44.entities.Coupon.filter({ code, is_active: true });
      return coupons[0];
    }
  });

  const cartWithProducts = cartItems.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return { ...item, product };
  }).filter(item => item.product);

  const subtotal = cartWithProducts.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );

  const discount = applyCouponMutation.data?.discount_amount || 0;
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal - discount + tax + shipping;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-[#1a1f3a] border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-black text-white">Shopping Cart</h2>
              <Badge className="bg-white text-cyan-600">{cartItems.length} items</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {cartWithProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-semibold">Your cart is empty</p>
              </div>
            ) : (
              cartWithProducts.map(item => (
                <Card key={item.id} className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 flex items-center gap-4">
                    <img 
                      src={item.product.images?.[0] || '/placeholder.jpg'} 
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-bold">{item.product.name}</h4>
                      <p className="text-slate-400 text-sm">${item.product.price.toFixed(2)} each</p>
                      {item.variant && (
                        <Badge variant="secondary" className="mt-1">{item.variant}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-8 w-8 border-slate-600"
                        onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-8 w-8 border-slate-600"
                        onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => removeItemMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {cartWithProducts.length > 0 && (
            <>
              <div className="px-6 py-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Button 
                    onClick={() => applyCouponMutation.mutate(couponCode)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                </div>
                {applyCouponMutation.data && (
                  <Badge className="bg-green-500 mt-2">
                    <Gift className="w-3 h-3 mr-1" />
                    Coupon applied: {applyCouponMutation.data.code}
                  </Badge>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-xl pt-2 border-t border-slate-700">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link to={createPageUrl('Checkout')}>
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 font-bold h-12">
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}