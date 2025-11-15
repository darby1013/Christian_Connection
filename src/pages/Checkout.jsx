import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Truck, Lock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Checkout() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  });

  const [paymentInfo, setPaymentInfo] = useState({
    card_number: '',
    card_name: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setShippingInfo(prev => ({
          ...prev,
          full_name: currentUser.full_name,
          email: currentUser.email
        }));
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      const items = await base44.entities.CartItem.filter({ user_id: user?.id });
      return items;
    },
    enabled: !!user,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      // Clear cart
      for (const item of cartItems) {
        await base44.entities.CartItem.delete(item.id);
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

  const subtotal = cartWithProducts.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );

  const shippingCosts = {
    standard: 9.99,
    express: 19.99,
    overnight: 39.99
  };

  const shipping = subtotal > 50 && shippingMethod === 'standard' ? 0 : shippingCosts[shippingMethod];
  const tax = subtotal * 0.08;
  const total = subtotal + tax + shipping;

  const handlePlaceOrder = () => {
    placeOrderMutation.mutate({
      user_id: user.id,
      status: 'pending',
      total_amount: total,
      shipping_address: JSON.stringify(shippingInfo),
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      items: cartWithProducts.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price
      }))
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">Checkout</h1>

        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className={`font-semibold ${step >= s ? 'text-white' : 'text-slate-400'}`}>
                {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
              </span>
              {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-cyan-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                    <Truck className="w-6 h-6 text-cyan-400" />
                    Shipping Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Full Name</Label>
                      <Input 
                        value={shippingInfo.full_name}
                        onChange={(e) => setShippingInfo({...shippingInfo, full_name: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Email</Label>
                      <Input 
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Phone</Label>
                      <Input 
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Address</Label>
                      <Input 
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">City</Label>
                      <Input 
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">State</Label>
                      <Input 
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label className="text-white mb-3 block">Shipping Method</Label>
                    <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                      <Card className="bg-slate-900/50 border-slate-700 p-4 mb-2 cursor-pointer hover:border-cyan-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="standard" />
                            <div>
                              <p className="text-white font-bold">Standard Shipping</p>
                              <p className="text-slate-400 text-sm">5-7 business days</p>
                            </div>
                          </div>
                          <p className="text-white font-bold">{subtotal > 50 ? 'FREE' : '$9.99'}</p>
                        </div>
                      </Card>
                      <Card className="bg-slate-900/50 border-slate-700 p-4 mb-2 cursor-pointer hover:border-cyan-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="express" />
                            <div>
                              <p className="text-white font-bold">Express Shipping</p>
                              <p className="text-slate-400 text-sm">2-3 business days</p>
                            </div>
                          </div>
                          <p className="text-white font-bold">$19.99</p>
                        </div>
                      </Card>
                      <Card className="bg-slate-900/50 border-slate-700 p-4 cursor-pointer hover:border-cyan-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="overnight" />
                            <div>
                              <p className="text-white font-bold">Overnight Shipping</p>
                              <p className="text-slate-400 text-sm">1 business day</p>
                            </div>
                          </div>
                          <p className="text-white font-bold">$39.99</p>
                        </div>
                      </Card>
                    </RadioGroup>
                  </div>

                  <Button onClick={() => setStep(2)} className="w-full mt-6 bg-cyan-500 hover:bg-cyan-600 h-12 font-bold">
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-green-400" />
                    Payment Method
                  </h2>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mb-6">
                    <Card className="bg-slate-900/50 border-slate-700 p-4 mb-2">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="credit_card" />
                        <p className="text-white font-bold">Credit Card</p>
                      </div>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700 p-4 mb-2">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="paypal" />
                        <p className="text-white font-bold">PayPal</p>
                      </div>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700 p-4">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="apple_pay" />
                        <p className="text-white font-bold">Apple Pay</p>
                      </div>
                    </Card>
                  </RadioGroup>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Card Number</Label>
                        <Input 
                          placeholder="1234 5678 9012 3456"
                          value={paymentInfo.card_number}
                          onChange={(e) => setPaymentInfo({...paymentInfo, card_number: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Cardholder Name</Label>
                        <Input 
                          value={paymentInfo.card_name}
                          onChange={(e) => setPaymentInfo({...paymentInfo, card_name: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Expiry Date</Label>
                          <Input 
                            placeholder="MM/YY"
                            value={paymentInfo.expiry}
                            onChange={(e) => setPaymentInfo({...paymentInfo, expiry: e.target.value})}
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">CVV</Label>
                          <Input 
                            placeholder="123"
                            value={paymentInfo.cvv}
                            onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-slate-600">
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1 bg-cyan-500 hover:bg-cyan-600 font-bold">
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-black text-white mb-6">Review Your Order</h2>
                  
                  <div className="space-y-4 mb-6">
                    {cartWithProducts.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <img src={item.product.images?.[0]} alt={item.product.name} className="w-20 h-20 object-cover rounded" />
                        <div className="flex-1">
                          <p className="text-white font-bold">{item.product.name}</p>
                          <p className="text-slate-400 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-white font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-slate-600">
                      Back
                    </Button>
                    <Button 
                      onClick={handlePlaceOrder}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 font-bold h-12"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Place Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-xl font-black text-white mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-xl pt-3 border-t border-slate-700">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <Badge className="bg-green-500 w-full justify-center py-2">
                  <Lock className="w-3 h-3 mr-1" />
                  Secure Checkout
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}