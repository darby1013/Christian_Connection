import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Lock, CreditCard, Truck, CheckCircle, ArrowLeft, ArrowRight,
  MapPin, Phone, Mail, User, Building, Home, AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Checkout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [processing, setProcessing] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    name: '',
    street: '',
    street_line_2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: ''
  });

  const [billingForm, setBillingForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States'
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [calculatedTax, setCalculatedTax] = useState(0);
  const [customerNotes, setCustomerNotes] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setShippingForm(prev => ({ ...prev, name: currentUser.full_name }));
        setBillingForm(prev => ({ ...prev, name: currentUser.full_name }));
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

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shippingMethods'],
    queryFn: () => base44.entities.ShippingMethod.filter({ is_active: true }, 'base_cost'),
    initialData: [],
  });

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['customerAddresses', user?.id],
    queryFn: () => base44.entities.CustomerAddress.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: [],
  });

  const updateCartMutation = useMutation({
    mutationFn: ({ cartId, data }) => base44.entities.ShoppingCart.update(cartId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.Order.create(orderData),
    onSuccess: async (order) => {
      // Mark cart as inactive
      await updateCartMutation.mutateAsync({
        cartId: cart.id,
        data: { is_active: false }
      });

      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate(createPageUrl("OrderConfirmation") + `?order=${order.id}`);
    },
  });

  const calculateTaxForRegion = async (state) => {
    const taxConfigs = await base44.entities.TaxConfiguration.filter({
      region: state,
      is_active: true
    });

    if (taxConfigs.length > 0) {
      const taxConfig = taxConfigs[0];
      const subtotal = (cart?.subtotal || 0) - (cart?.discount_amount || 0);
      const shipping = selectedShipping?.base_cost || 0;
      const taxableAmount = taxConfig.tax_shipping ? subtotal + shipping : subtotal;
      const tax = taxableAmount * (taxConfig.tax_rate / 100);
      setCalculatedTax(tax);
      return tax;
    } else {
      setCalculatedTax(0);
      return 0;
    }
  };

  useEffect(() => {
    if (shippingForm.state) {
      calculateTaxForRegion(shippingForm.state);
    }
  }, [shippingForm.state, selectedShipping, cart]);

  const loadAddress = (address) => {
    setShippingForm({
      name: address.name,
      street: address.street_line_1,
      street_line_2: address.street_line_2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone || ''
    });
  };

  const goToStep = (step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeOrder = async () => {
    if (!selectedShipping) {
      alert('Please select a shipping method');
      return;
    }

    setProcessing(true);

    try {
      const orderNumber = 'ORD-' + Date.now();
      const subtotal = cart.subtotal || 0;
      const discount = cart.discount_amount || 0;
      const shippingCost = selectedShipping.base_cost;
      const tax = calculatedTax;
      const total = subtotal - discount + shippingCost + tax;

      const orderData = {
        order_number: orderNumber,
        customer_id: user.id,
        customer_name: user.full_name,
        customer_email: user.email,
        customer_phone: shippingForm.phone,
        items: cart.items,
        subtotal,
        tax_amount: tax,
        tax_rate: calculatedTax > 0 ? (tax / (subtotal - discount + shippingCost)) * 100 : 0,
        tax_region: shippingForm.state,
        shipping_cost: shippingCost,
        discount_amount: discount,
        discount_codes: cart.applied_coupons || [],
        total_amount: total,
        status: 'confirmed',
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        shipping_address: shippingForm,
        billing_address: sameAsShipping ? shippingForm : billingForm,
        shipping_method: selectedShipping.name,
        shipping_carrier: selectedShipping.carrier,
        customer_notes: customerNotes,
        payment_method: 'credit_card',
        payment_gateway: 'stripe'
      };

      await createOrderMutation.mutateAsync(orderData);
    } catch (error) {
      alert('Error creating order: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Cart is Empty</h2>
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
  const shippingCost = selectedShipping?.base_cost || 0;
  const tax = calculatedTax;
  const total = subtotal - discount + shippingCost + tax;

  const steps = [
    { number: 1, title: 'Shipping', icon: Truck },
    { number: 2, title: 'Delivery', icon: MapPin },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Review', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8">Secure Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
              <button
                onClick={() => currentStep > step.number && goToStep(step.number)}
                className={`flex items-center gap-3 ${
                  currentStep >= step.number ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  currentStep > step.number ? 'bg-green-500' :
                  currentStep === step.number ? 'bg-cyan-500' :
                  'bg-slate-700'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <step.icon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-white font-bold">{step.title}</p>
                  <p className="text-slate-400 text-xs">Step {step.number}</p>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-slate-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <Truck className="w-6 h-6 text-cyan-400" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {savedAddresses.length > 0 && (
                    <div>
                      <Label className="text-white font-bold mb-2 block">Saved Addresses</Label>
                      <div className="grid gap-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            onClick={() => loadAddress(addr)}
                            className="text-left p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-cyan-500/50 transition-all"
                          >
                            <p className="text-white font-semibold">{addr.label}</p>
                            <p className="text-slate-400 text-sm">
                              {addr.street_line_1}, {addr.city}, {addr.state} {addr.zip}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-white font-bold mb-2 block">Full Name *</Label>
                    <Input
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm({...shippingForm, name: e.target.value})}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">Street Address *</Label>
                    <Input
                      value={shippingForm.street}
                      onChange={(e) => setShippingForm({...shippingForm, street: e.target.value})}
                      className="bg-slate-900 border-slate-700 text-white mb-2"
                    />
                    <Input
                      placeholder="Apt, suite, unit, etc. (optional)"
                      value={shippingForm.street_line_2}
                      onChange={(e) => setShippingForm({...shippingForm, street_line_2: e.target.value})}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">City *</Label>
                      <Input
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold mb-2 block">State *</Label>
                      <Input
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({...shippingForm, state: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">ZIP Code *</Label>
                      <Input
                        value={shippingForm.zip}
                        onChange={(e) => setShippingForm({...shippingForm, zip: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold mb-2 block">Phone *</Label>
                      <Input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({...shippingForm, phone: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => goToStep(2)}
                    disabled={!shippingForm.name || !shippingForm.street || !shippingForm.city || !shippingForm.state || !shippingForm.zip}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
                  >
                    Continue to Shipping Method
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 2 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-cyan-400" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {shippingMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedShipping(method)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedShipping?.id === method.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-bold mb-1">{method.name}</p>
                          <p className="text-slate-400 text-sm">
                            {method.estimated_days_min}-{method.estimated_days_max} business days
                          </p>
                        </div>
                        <p className="text-cyan-400 font-black text-xl">
                          ${method.base_cost.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => goToStep(1)}
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => goToStep(3)}
                      disabled={!selectedShipping}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 font-bold"
                    >
                      Continue to Payment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-cyan-400" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-center">
                    <Lock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-300 font-semibold mb-1">Secure Payment Processing</p>
                    <p className="text-blue-200 text-sm">Your payment information is encrypted and secure</p>
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">Card Number</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Expiration</Label>
                      <Input
                        placeholder="MM/YY"
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold mb-2 block">CVV</Label>
                      <Input
                        placeholder="123"
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label className="text-white">Billing address same as shipping</Label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => goToStep(2)}
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => goToStep(4)}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 font-bold"
                    >
                      Review Order
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review Order */}
            {currentStep === 4 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-cyan-400" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Items */}
                  <div>
                    <h3 className="text-white font-bold mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {cart.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                          <img src={item.image_url} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1">
                            <p className="text-white font-semibold">{item.product_name}</p>
                            <p className="text-slate-400 text-sm">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-cyan-400 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Addresses */}
                  <div>
                    <h3 className="text-white font-bold mb-3">Shipping To</h3>
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-white font-semibold">{shippingForm.name}</p>
                      <p className="text-slate-400 text-sm">{shippingForm.street}</p>
                      <p className="text-slate-400 text-sm">
                        {shippingForm.city}, {shippingForm.state} {shippingForm.zip}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-white font-bold mb-2 block">Order Notes (Optional)</Label>
                    <Textarea
                      placeholder="Special instructions, gift message, etc."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white h-20"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => goToStep(3)}
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={completeOrder}
                      disabled={processing}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold text-lg h-12"
                    >
                      {processing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
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
                    {selectedShipping ? `$${shippingCost.toFixed(2)}` : 'Calculate at checkout'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-white font-bold">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between">
                  <span className="text-white font-black text-lg">Total</span>
                  <span className="text-cyan-400 font-black text-2xl">${total.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Lock className="w-3 h-3" />
                    Secure SSL Encryption
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle className="w-3 h-3" />
                    30-Day Money Back Guarantee
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