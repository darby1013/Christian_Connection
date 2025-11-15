import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [searchedId, setSearchedId] = useState('');

  const { data: order } = useQuery({
    queryKey: ['trackOrder', searchedId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: searchedId });
      return orders[0];
    },
    enabled: !!searchedId
  });

  const trackingSteps = [
    { status: 'pending', label: 'Order Placed', icon: Package },
    { status: 'processing', label: 'Processing', icon: Clock },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const getCurrentStep = () => {
    const statusIndex = trackingSteps.findIndex(s => s.status === order?.status);
    return statusIndex >= 0 ? statusIndex : 0;
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8 text-center">Track Your Order</h1>

        <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
          <CardContent className="p-8">
            <div className="flex gap-3">
              <Input
                placeholder="Enter your order ID..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white flex-1"
              />
              <Button 
                onClick={() => setSearchedId(orderId)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold px-8"
              >
                Track Order
              </Button>
            </div>
          </CardContent>
        </Card>

        {order && (
          <>
            <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-slate-400 text-sm">Order Number</p>
                    <p className="text-white font-black text-2xl">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <Badge className={
                    order.status === 'delivered' ? 'bg-green-500' :
                    order.status === 'shipped' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }>
                    {order.status}
                  </Badge>
                </div>

                <div className="relative">
                  <div className="absolute top-8 left-0 right-0 h-1 bg-slate-700">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${(getCurrentStep() / (trackingSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                  <div className="relative grid grid-cols-4 gap-4">
                    {trackingSteps.map((step, index) => {
                      const isCompleted = index <= getCurrentStep();
                      const isCurrent = index === getCurrentStep();
                      return (
                        <div key={step.status} className="flex flex-col items-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-cyan-500 to-blue-500' 
                              : 'bg-slate-700'
                          } ${isCurrent ? 'ring-4 ring-cyan-500/30 scale-110' : ''} transition-all duration-300`}>
                            <step.icon className="w-8 h-8 text-white" />
                          </div>
                          <p className={`text-sm font-bold text-center ${
                            isCompleted ? 'text-white' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    Shipping Address
                  </h3>
                  {order.shipping_address && (
                    <div className="text-slate-300">
                      {(() => {
                        const addr = JSON.parse(order.shipping_address);
                        return (
                          <>
                            <p className="font-bold text-white">{addr.full_name}</p>
                            <p>{addr.address}</p>
                            <p>{addr.city}, {addr.state} {addr.zip}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-black text-lg mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Order Total</span>
                      <span className="font-bold text-white">${order.total_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Payment Method</span>
                      <span className="font-bold text-white">{order.payment_method}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Shipping Method</span>
                      <span className="font-bold text-white">{order.shipping_method}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}