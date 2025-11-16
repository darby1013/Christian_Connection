import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Eye, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OrderHistory() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => base44.entities.Order.filter({ customer_id: user?.id }),
    enabled: !!user,
    refetchInterval: 5000,
    initialData: []
  });

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('CustomerAccount')}>
            <Button variant="outline" className="border-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-white">Order History</h1>
            <p className="text-slate-400 font-semibold">{orders.length} orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <Package className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-bold text-xl mb-2">No orders yet</p>
              <p className="text-slate-400 mb-6">Start shopping to see your orders here</p>
              <Link to={createPageUrl('Store')}>
                <Button className="bg-cyan-500">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-white font-black text-xl mb-1">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(order.created_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Badge className={
                      order.status === 'delivered' ? 'bg-green-500' :
                      order.status === 'shipped' ? 'bg-blue-500' :
                      order.status === 'processing' ? 'bg-yellow-500' :
                      'bg-slate-500'
                    }>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Amount</p>
                      <p className="text-white font-black text-xl">${order.total_amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Payment Method</p>
                      <p className="text-white font-bold">{order.payment_method || 'Credit Card'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Shipping Method</p>
                      <p className="text-white font-bold">{order.shipping_method || 'Standard'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link to={createPageUrl('OrderTracking') + `?orderId=${order.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-slate-600">
                        <Eye className="w-4 h-4 mr-2" />
                        Track Order
                      </Button>
                    </Link>
                    <Button variant="outline" className="border-slate-600">
                      <Download className="w-4 h-4 mr-2" />
                      Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}