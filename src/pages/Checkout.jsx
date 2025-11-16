
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, CreditCard, Truck, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Checkout() {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({
    full_name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  });
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setShippingInfo(prev => ({ ...prev, full_name: currentUser.full_name, email: currentUser.email }));
      } catch {
        setIsGuest(true);
      }
    };
    fetchUser();
  }, []);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => base44.entities.CartItem.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shippingMethods'],
    queryFn: () => base44.entities.ShippingMethod.filter({ is_active: true }),
    initialData: []
  });

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['savedAddresses', user?.id],
    queryFn: () => base44.entities.CustomerAddress.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const { data: paymentGateways = [] } = useQuery({
    queryKey: ['enabledPaymentGateways'],
    queryFn: () => base44.entities.PaymentGatewayConfig.filter({ is_enabled: true }),
    initialData: []
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      await Promise.all(cartItems.map(item => base44.entities.CartItem.delete(item.id)));
      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries(['cart']);
      navigate(createPageUrl('OrderConfirmation') + `?orderId=${order.id}`);
    }
  });

  useEffect(() => {
    if (selectedShipping) {
      const method = shippingMethods.find(m => m.id === selectedShipping);
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (method?.free_shipping_threshold && subtotal >= method.free_shipping_threshold) {
        setShippingCost(0);
      } else {
        const baseCost = method?.cost || 0;
        const stateSurcharge = shippingInfo.state === 'HI' || shippingInfo.state === 'AK' ? 10 : 0;
        setShippingCost(baseCost + stateSurcharge);
      }
    }
  }, [selectedShipping, shippingInfo.state, cartItems, shippingMethods]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const handlePlaceOrder = () => {
    placeOrderMutation.mutate({
      customer_id: user?.id || 'guest',
      customer_email: shippingInfo.email,
      items: cartItems,
      subtotal,
      tax_amount: tax,
      shipping_cost: shippingCost,
      total_amount: total,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'pending',
      shipping_address: JSON.stringify(shippingInfo),
      shipping_method: shippingMethods.find(m => m.id === selectedShipping)?.name
    });
  };

  const steps = [
    { number: 1, title: 'Shipping', icon: Truck },
    { number: 2, title: 'Payment', icon: CreditCard },
    { number: 3, title: 'Review', icon: ShoppingBag }
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0e27] py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-white text-xl">Your cart is empty</p>
        </div>
      </div>
    );
  }

  const getPaymentIcon = (gateway) => {
    const icons = {
      stripe: '💳',
      paypal: '🅿️',
      square: '🔲',
      apple_pay: '',
      google_pay: 'G',
      cashapp: '$'
    };
    return icons[gateway.gateway_name] || '💳';
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">Checkout</h1>

        <div className="flex items-center justify-center mb-12">
          {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= step.number ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-700'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <step.icon className="w-6 h-6 text-white" />
                  )}
                </div>
                <p className="text-white text-sm mt-2 font-bold">{step.title}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-24 h-1 mx-4 ${currentStep > step.number ? 'bg-cyan-500' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-black text-white mb-6">Shipping Information</h2>
                  
                  {!user && (
                    <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <p className="text-cyan-400 font-bold">Guest Checkout</p>
                      <p className="text-slate-300 text-sm">Create an account after checkout to track your order</p>
                    </div>
                  )}

                  {savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <Label className="text-white mb-3 block">Use Saved Address</Label>
                      <div className="space-y-2">
                        {savedAddresses.map(addr => (
                          <button
                            key={addr.id}
                            onClick={() => setShippingInfo({
                              full_name: addr.full_name,
                              email: shippingInfo.email,
                              address: addr.address_line_1,
                              city: addr.city,
                              state: addr.state,
                              zip: addr.postal_code,
                              phone: addr.phone
                            })}
                            className="w-full p-4 bg-slate-900 border border-slate-700 rounded-lg text-left hover:border-cyan-500 transition-colors"
                          >
                            <p className="text-white font-bold">{addr.full_name}</p>
                            <p className="text-slate-300 text-sm">{addr.address_line_1}, {addr.city}, {addr.state} {addr.postal_code}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Full Name *</Label>
                        <Input
                          value={shippingInfo.full_name}
                          onChange={(e) => setShippingInfo({...shippingInfo, full_name: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Email *</Label>
                        <Input
                          type="email"
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white">Address *</Label>
                      <Input
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-white">City *</Label>
                        <Input
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">State *</Label>
                        <Input
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">ZIP *</Label>
                        <Input
                          value={shippingInfo.zip}
                          onChange={(e) => setShippingInfo({...shippingInfo, zip: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white">Phone *</Label>
                      <Input
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <div className="pt-4">
                      <Label className="text-white mb-3 block">Shipping Method</Label>
                      <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping}>
                        {shippingMethods.map(method => (
                          <div key={method.id} className="flex items-center space-x-2 p-4 bg-slate-900 rounded-lg border border-slate-700">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-bold">{method.name}</p>
                                  <p className="text-slate-400 text-sm">{method.estimated_days}</p>
                                </div>
                                <p className="text-cyan-400 font-bold">
                                  {method.free_shipping_threshold && subtotal >= method.free_shipping_threshold 
                                    ? 'FREE' 
                                    : `$${method.cost?.toFixed(2)}`}
                                </p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setCurrentStep(2)} 
                    disabled={!shippingInfo.full_name || !shippingInfo.email || !selectedShipping}
                    className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 h-12 font-bold"
                  >
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-black text-white mb-6">Payment Method</h2>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {paymentGateways.map(gateway => (
                        <div key={gateway.id} className="flex items-center space-x-2 p-4 bg-slate-900 rounded-lg border border-slate-700">
                          <RadioGroupItem value={gateway.gateway_name} id={gateway.gateway_name} />
                          <Label htmlFor={gateway.gateway_name} className="flex-1 cursor-pointer flex items-center gap-3">
                            <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                              <span className="text-2xl">{getPaymentIcon(gateway)}</span>
                            </div>
                            <div>
                              <p className="text-white font-bold">{gateway.display_name}</p>
                              {gateway.is_test_mode && (
                                <Badge className="bg-yellow-500 text-xs">Test Mode</Badge>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 border-slate-600">
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep(3)} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-black text-white mb-6">Order Review</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-bold mb-2">Shipping Address</h3>
                      <div className="p-4 bg-slate-900 rounded-lg text-slate-300">
                        <p className="font-bold text-white">{shippingInfo.full_name}</p>
                        <p>{shippingInfo.address}</p>
                        <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}</p>
                        <p>{shippingInfo.phone}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-bold mb-2">Payment Method</h3>
                      <Badge className="bg-cyan-500">{paymentMethod.toUpperCase()}</Badge>
                    </div>

                    <div>
                      <h3 className="text-white font-bold mb-2">Order Items</h3>
                      <div className="space-y-2">
                        {cartItems.map(item => (
                          <div key={item.id} className="flex justify-between p-3 bg-slate-900 rounded-lg">
                            <span className="text-white">x{item.quantity}</span>
                            <span className="text-cyan-400 font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 border-slate-600">
                      Back
                    </Button>
                    <Button onClick={handlePlaceOrder} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 font-bold">
                      Place Order - ${total.toFixed(2)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-white font-black text-xl mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Shipping</span>
                    <span className="font-bold">${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tax</span>
                    <span className="font-bold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="text-white font-black text-lg">Total</span>
                    <span className="text-cyan-400 font-black text-2xl">${total.toFixed(2)}</span>
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
