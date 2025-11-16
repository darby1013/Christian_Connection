import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingCart, Truck, CreditCard, CheckCircle, Download } from 'lucide-react';

export default function Checkout() {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({
    full_name: '',
    email: '',
    address_line_1: '',
    city: '',
    state: '',
    postal_code: '',
    phone: ''
  });
  const [selectedShipping, setSelectedShipping] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setShippingInfo({
          full_name: currentUser.full_name || '',
          email: currentUser.email || '',
          address_line_1: '',
          city: '',
          state: '',
          postal_code: '',
          phone: ''
        });
      } catch {
        setIsGuest(true);
      }
    };
    fetchUser();
  }, []);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CartItem.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: digitalProducts = [] } = useQuery({
    queryKey: ['digitalProducts'],
    queryFn: () => base44.entities.DigitalProductEnhanced.list(),
    initialData: []
  });

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shippingMethods'],
    queryFn: () => base44.entities.ShippingMethod.filter({ is_active: true }),
    initialData: []
  });

  const { data: paymentGateways = [] } = useQuery({
    queryKey: ['paymentGateways'],
    queryFn: () => base44.entities.PaymentGatewayConfig.filter({ is_enabled: true }),
    initialData: []
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      
      for (const item of orderData.items) {
        if (item.is_digital) {
          const digitalProduct = digitalProducts.find(dp => dp.id === item.product_id);
          if (digitalProduct) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + digitalProduct.access_duration_days);

            await base44.entities.DigitalDownload.create({
              user_id: user.id,
              user_email: user.email,
              product_id: digitalProduct.id,
              product_name: digitalProduct.name,
              order_id: order.id,
              download_url: digitalProduct.file_url,
              max_downloads: digitalProduct.download_limit,
              expires_at: expiresAt.toISOString()
            });

            if (digitalProduct.email_delivery) {
              await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: `Your ${digitalProduct.name} is ready`,
                body: `Download your digital product: ${window.location.origin}${createPageUrl('MyDigitalLibrary')}`
              });
            }
          }
        }
      }
      
      if (user) {
        await base44.entities.CartItem.filter({ user_id: user.id }).then(items => 
          Promise.all(items.map(item => base44.entities.CartItem.delete(item.id)))
        );
      }
      
      return order;
    },
    onSuccess: (order) => {
      navigate(createPageUrl('OrderConfirmation') + `?orderId=${order.id}`);
    }
  });

  const cartWithProducts = cartItems.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return { ...item, product };
  }).filter(item => item.product);

  const hasDigitalItems = cartWithProducts.some(item => item.product?.is_digital);
  const hasPhysicalItems = cartWithProducts.some(item => !item.product?.is_digital);

  const subtotal = cartWithProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const needsShipping = hasPhysicalItems;
  const calculatedShipping = needsShipping ? shippingCost : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + calculatedShipping + tax;

  const handlePlaceOrder = () => {
    const orderData = {
      user_id: user?.id || 'guest',
      total,
      subtotal,
      tax,
      shipping_cost: calculatedShipping,
      status: 'pending',
      shipping_address: needsShipping ? shippingInfo : null,
      payment_method: paymentMethod,
      items: cartWithProducts.map(item => ({
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        is_digital: item.product.is_digital
      }))
    };

    placeOrderMutation.mutate(orderData);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0e27] py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingCart className="w-20 h-20 text-slate-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">Your cart is empty</h1>
          <p className="text-slate-400 mb-6">Add some items to get started</p>
          <Button onClick={() => navigate(createPageUrl('Store'))} className="bg-cyan-500">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {hasDigitalItems && (
              <Card className="bg-purple-900/20 border-purple-500/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Download className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-white font-bold">Digital Products Included</p>
                      <p className="text-purple-300 text-sm">Instant download after payment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {needsShipping && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Truck className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-white font-black text-xl">Shipping Information</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Full Name *</Label>
                      <Input value={shippingInfo.full_name} onChange={(e) => setShippingInfo({...shippingInfo, full_name: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-white">Email *</Label>
                      <Input value={shippingInfo.email} onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-white">Address *</Label>
                      <Input value={shippingInfo.address_line_1} onChange={(e) => setShippingInfo({...shippingInfo, address_line_1: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-white">City *</Label>
                      <Input value={shippingInfo.city} onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-white">State *</Label>
                      <Input value={shippingInfo.state} onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-white">Postal Code *</Label>
                      <Input value={shippingInfo.postal_code} onChange={(e) => setShippingInfo({...shippingInfo, postal_code: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-white">Phone</Label>
                      <Input value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label className="text-white mb-3 block">Shipping Method</Label>
                    <div className="space-y-2">
                      {shippingMethods.map(method => (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedShipping(method.id);
                            setShippingCost(method.cost);
                          }}
                          className={`w-full p-4 rounded-lg border-2 transition-all ${
                            selectedShipping === method.id
                              ? 'border-cyan-500 bg-cyan-900/20'
                              : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-left">
                              <p className="text-white font-bold">{method.name}</p>
                              <p className="text-slate-400 text-sm">{method.estimated_days}</p>
                            </div>
                            <p className="text-cyan-400 font-bold">${method.cost?.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-green-400" />
                  <h2 className="text-white font-black text-xl">Payment Method</h2>
                </div>
                <div className="space-y-2">
                  {paymentGateways.map(gateway => (
                    <button
                      key={gateway.id}
                      onClick={() => setPaymentMethod(gateway.gateway_name)}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === gateway.gateway_name
                          ? 'border-green-500 bg-green-900/20'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-white font-bold">{gateway.display_name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handlePlaceOrder}
              disabled={!paymentMethod || (needsShipping && !selectedShipping)}
              className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 font-black text-xl"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              Place Order - ${total.toFixed(2)}
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-white font-black text-xl mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cartWithProducts.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-slate-900 rounded flex items-center justify-center">
                        {item.product?.is_digital ? (
                          <Download className="w-6 h-6 text-purple-400" />
                        ) : (
                          <img src={item.product?.images?.[0] || '/placeholder.jpg'} alt="" className="w-full h-full object-cover rounded" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{item.product?.name}</p>
                        <p className="text-slate-400 text-xs">Qty: {item.quantity}</p>
                        {item.product?.is_digital && (
                          <Badge className="bg-purple-500 text-xs mt-1">Digital</Badge>
                        )}
                      </div>
                      <p className="text-cyan-400 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 border-t border-slate-700 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {needsShipping && (
                    <div className="flex justify-between text-slate-300">
                      <span>Shipping</span>
                      <span>${calculatedShipping.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-xl pt-3 border-t border-slate-700">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
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