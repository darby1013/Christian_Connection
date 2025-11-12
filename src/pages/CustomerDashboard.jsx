import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShoppingBag, Package, Truck, CheckCircle, Heart, MapPin,
  Calendar, DollarSign, Star, User, Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);

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

  const { data: orders = [] } = useQuery({
    queryKey: ['myOrders', user?.id],
    queryFn: () => base44.entities.Order.filter({ customer_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const wishlists = await base44.entities.Wishlist.filter({ user_id: user.id });
      return wishlists[0] || null;
    },
    enabled: !!user,
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => base44.entities.CustomerAddress.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: [],
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
      case 'confirmed': return <Calendar className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-cyan-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">My Account</h1>
            <p className="text-slate-400">Welcome back, {user?.full_name}!</p>
          </div>
          <Link to={createPageUrl("StoreAdvanced")}>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1a1f3a] border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white mb-1">{orders.length}</p>
              <p className="text-slate-400 text-sm font-semibold">Total Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Truck className="w-8 h-8 text-purple-400" />
                <Badge className="bg-purple-500">{activeOrders.length}</Badge>
              </div>
              <p className="text-2xl font-black text-white mb-1">{activeOrders.length}</p>
              <p className="text-slate-400 text-sm font-semibold">Active Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-2xl font-black text-white mb-1">${totalSpent.toFixed(0)}</p>
              <p className="text-slate-400 text-sm font-semibold">Total Spent</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-2xl font-black text-white mb-1">{wishlist?.items?.length || 0}</p>
              <p className="text-slate-400 text-sm font-semibold">Wishlist Items</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="orders" className="data-[state=active]:bg-cyan-500">
              <Package className="w-4 h-4 mr-2" />
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="addresses" className="data-[state=active]:bg-cyan-500">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses ({addresses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6 space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-lg ${getStatusColor(order.status)}/20 border-2 ${getStatusColor(order.status)}/30 flex items-center justify-center`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-bold text-lg mb-1">Order #{order.order_number}</h3>
                          <p className="text-slate-400 text-sm mb-2">
                            {format(new Date(order.created_date), 'MMM d, yyyy')}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge className="bg-purple-500">{order.items?.length || 0} items</Badge>
                            <Badge className="bg-green-500 text-lg font-black">
                              ${order.total_amount?.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {order.tracking_number && (
                        <div className="mt-3 p-2 bg-cyan-900/20 border border-cyan-500/30 rounded">
                          <p className="text-cyan-400 text-sm font-semibold">
                            <Truck className="w-3 h-3 inline mr-1" />
                            Tracking: {order.tracking_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="addresses" className="mt-6 space-y-4">
            {addresses.map((addr) => (
              <Card key={addr.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-8 h-8 text-cyan-400" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{addr.label}</h3>
                      <p className="text-slate-400 text-sm">{addr.name}</p>
                      <p className="text-slate-400 text-sm">{addr.street_line_1}</p>
                      <p className="text-slate-400 text-sm">
                        {addr.city}, {addr.state} {addr.zip}
                      </p>
                      {addr.is_default_shipping && (
                        <Badge className="bg-cyan-500 mt-2">Default Shipping</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}