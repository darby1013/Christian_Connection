import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Truck, Download } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function OrderConfirmation() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId
  });

  useEffect(() => {
    if (order) {
      const confetti = document.createElement('div');
      confetti.innerHTML = '🎉';
      confetti.style.position = 'fixed';
      confetti.style.top = '50%';
      confetti.style.left = '50%';
      confetti.style.fontSize = '100px';
      confetti.style.zIndex = '9999';
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }
  }, [order]);

  if (!order) return <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center"><p className="text-white">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4">Order Confirmed!</h1>
          <p className="text-slate-300 text-lg">Thank you for your purchase. Your order is being processed.</p>
        </div>

        <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-slate-400 text-sm mb-1">Order Number</p>
                <p className="text-white font-black text-2xl">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Order Total</p>
                <p className="text-white font-black text-2xl">${order.total_amount?.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-cyan-500/30">
              <Package className="w-12 h-12 text-cyan-400" />
              <div className="flex-1">
                <p className="text-white font-bold text-lg">Estimated Delivery</p>
                <p className="text-cyan-300">{
                  order.shipping_method === 'overnight' ? '1 business day' :
                  order.shipping_method === 'express' ? '2-3 business days' :
                  '5-7 business days'
                }</p>
              </div>
              <Badge className="bg-cyan-500">Processing</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
          <CardContent className="p-8">
            <h3 className="text-white font-black text-xl mb-6">Shipping Information</h3>
            {order.shipping_address && (
              <div className="text-slate-300 space-y-1">
                {(() => {
                  const addr = JSON.parse(order.shipping_address);
                  return (
                    <>
                      <p className="font-bold text-white">{addr.full_name}</p>
                      <p>{addr.address}</p>
                      <p>{addr.city}, {addr.state} {addr.zip}</p>
                      <p>{addr.country}</p>
                      <p className="mt-3 text-cyan-400">{addr.email}</p>
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to={createPageUrl('Store')} className="flex-1">
            <Button variant="outline" className="w-full border-slate-600 h-12">
              Continue Shopping
            </Button>
          </Link>
          <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 h-12 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}