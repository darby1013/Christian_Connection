import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { 
  CreditCard, Truck, MapPin, Check, Lock, Package, Clock, ShieldCheck
} from 'lucide-react';

export default function CheckoutEnterprise() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
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
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [saveInfo, setSaveInfo] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setShippingInfo(prev => ({ ...prev, full_name: currentUser.full_name, email: currentUser.email }));
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
  });

  const { data: paymentGateways = [] } = useQuery({
    queryKey: ['paymentGateways'],
    queryFn: () => base44.entities.PaymentGateway.filter({ is_active: true }),
    initialData: [],
  });

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shippingMethods'],
    queryFn: () => base44.entities.ShippingMethod.list(),
    initialData: [],
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const order = await base44.entities.Order.create({
        user_id: user.id,
        customer_name: shippingInfo.full_name,
        customer_email: shippingInfo.email,
        shipping_address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zip}`,
        total_amount: subtotal + tax + shippingCost,
        status: 'pending',
        payment_method: paymentMethod,
        shipping_method: shippingMethod
      });

      // Create order items
      for (const item of cartItems) {
        await base44.entities.OrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price
        });
      }

      // Clear cart
      for (const item of cartItems) {
        await base44.entities.CartItem.delete(item.id);
      }

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      window.location.href = createPageUrl('OrderConfirmation') + `?id=${order.id}`;
    }
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const tax = subtotal * 0.08;
  const shippingCost = shippingMethod === 'express' ? 19.99 : shippingMethod === 'overnight' ? 39.99 : 9.99;
  const total = subtotal + tax + shippingCost;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">Secure Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { num: 1, label: 'Shipping', icon: Truck },
            { num: 2, label: 'Payment', icon: CreditCard },
            { num: 3, label: 'Review', icon: Check }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                  step >= s.num ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400' : 'bg-slate-800 border-slate-700'
                }`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <p className={`text-sm font-bold mt-2 ${step >= s.num ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
              </div>
              {i < 2 && (
                <div className={`h-1 w-24 mx-4 ${step > s.num ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-white font-black text-xl mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-cyan-400" />
                    Shipping Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-bold">Full Name *</Label>
                      <Input
                        value={shippingInfo.full_name}
                        onChange={(e) => setShippingInfo({...shippingInfo, full_name: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold">Email *</Label>
                      <Input
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-white font-bold">Phone *</Label>
                      <Input
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-white font-bold">Address *</Label>
                      <Input
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold">City *</Label>
                      <Input
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold">State *</Label>
                      <Input
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold">ZIP Code *</Label>
                      <Input
                        value={shippingInfo.zip}
                        onChange={(e) => setShippingInfo({...shippingInfo, zip: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold">Country *</Label>
                      <Select value={shippingInfo.country} onValueChange={(val) => setShippingInfo({...shippingInfo, country: val})}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="USA">United States</SelectItem>
                          <SelectItem value="CAN">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Checkbox checked={saveInfo} onCheckedChange={setSaveInfo} />
                    <Label className="text-slate-300 text-sm">Save for next time</Label>
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 h-12">
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-white font-black text-xl mb-6 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-cyan-400" />
                    Payment Method
                  </h2>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      <Card className={`border-2 cursor-pointer ${paymentMethod === 'credit_card' ? 'border-cyan-500' : 'border-slate-700'}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <RadioGroupItem value="credit_card" />
                          <CreditCard className="w-5 h-5 text-cyan-400" />
                          <Label className="text-white font-bold cursor-pointer">Credit / Debit Card</Label>
                        </CardContent>
                      </Card>
                      <Card className={`border-2 cursor-pointer ${paymentMethod === 'paypal' ? 'border-cyan-500' : 'border-slate-700'}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <RadioGroupItem value="paypal" />
                          <Package className="w-5 h-5 text-blue-400" />
                          <Label className="text-white font-bold cursor-pointer">PayPal</Label>
                        </CardContent>
                      </Card>
                    </div>
                  </RadioGroup>
                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-slate-600">
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600">
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-white font-black text-xl mb-6 flex items-center gap-2">
                    <Check className="w-6 h-6 text-cyan-400" />
                    Review & Place Order
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-bold mb-2">Shipping To:</h3>
                      <p className="text-slate-300">{shippingInfo.full_name}</p>
                      <p className="text-slate-300">{shippingInfo.address}</p>
                      <p className="text-slate-300">{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}</p>
                    </div>

                    <div>
                      <h3 className="text-white font-bold mb-2">Items ({cartItems.length}):</h3>
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between text-slate-300 py-2">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-slate-600">
                      Back
                    </Button>
                    <Button
                      onClick={() => placeOrderMutation.mutate()}
                      disabled={placeOrderMutation.isLoading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 h-12 font-bold"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Place Order ${total.toFixed(2)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700 sticky top-4">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-white font-black text-lg">Order Summary</h3>
                
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-3 pb-2 border-b border-slate-700">
                      <div className="w-12 h-12 bg-slate-900 rounded flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-bold">{item.product_name}</p>
                        <p className="text-slate-400 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-white font-bold">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white text-xl font-black pt-2 border-t border-slate-700">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    <p className="text-green-300 font-bold text-sm">Secure SSL Encryption</p>
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