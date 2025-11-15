import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Heart, ShoppingBag, User, MapPin, CreditCard, Gift, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CustomerDashboard() {
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
    queryKey: ['customerOrders', user?.id],
    queryFn: () => base44.entities.Order.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: () => base44.entities.WishlistItem.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => base44.entities.CustomerAddress.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">My Account</h1>
            <p className="text-slate-400 font-semibold">Welcome back, {user?.full_name}</p>
          </div>
          <Link to={createPageUrl('Store')}>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-3xl font-black text-white">{orders.length}</p>
              <p className="text-purple-300 text-sm font-bold">Total Orders</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-3xl font-black text-white">{completedOrders}</p>
              <p className="text-green-300 text-sm font-bold">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white">{wishlistItems.length}</p>
              <p className="text-cyan-300 text-sm font-bold">Wishlist Items</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-white">${totalSpent.toFixed(2)}</p>
              <p className="text-amber-300 text-sm font-bold">Total Spent</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="bg-slate-900 border-slate-700 mb-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {orders.length === 0 ? (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-16 text-center">
                  <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-bold text-xl mb-2">No orders yet</p>
                  <p className="text-slate-400 mb-4">Start shopping to see your orders here</p>
                  <Link to={createPageUrl('Store')}>
                    <Button className="bg-cyan-500">Browse Products</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <Card key={order.id} className="bg-[#1a1f3a] border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-white font-bold text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</p>
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
                          order.status === 'pending' ? 'bg-yellow-500' :
                          order.status === 'shipped' ? 'bg-blue-500' : 'bg-slate-500'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Total Amount</p>
                          <p className="text-white font-black text-xl">${order.total_amount?.toFixed(2)}</p>
                        </div>
                        <Button variant="outline" className="border-slate-600">
                          Track Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlistItems.length === 0 ? (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-16 text-center">
                  <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-bold text-xl mb-2">Your wishlist is empty</p>
                  <p className="text-slate-400">Save items you love for later</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {wishlistItems.map(item => (
                  <Card key={item.id} className="bg-[#1a1f3a] border-slate-700">
                    <CardContent className="p-4">
                      <img src={item.product_image} alt={item.product_name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                      <h4 className="text-white font-bold mb-2">{item.product_name}</h4>
                      <p className="text-cyan-400 font-black text-xl mb-3">${item.product_price?.toFixed(2)}</p>
                      <Button className="w-full bg-cyan-500">Add to Cart</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="addresses">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-black text-xl">Saved Addresses</h3>
                  <Button className="bg-cyan-500">Add New Address</Button>
                </div>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No saved addresses</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <Card key={addr.id} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <p className="text-white font-bold mb-2">{addr.full_name}</p>
                          <p className="text-slate-400 text-sm">{addr.address_line_1}</p>
                          <p className="text-slate-400 text-sm">{addr.city}, {addr.state} {addr.postal_code}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-black text-xl mb-6">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm">Full Name</label>
                    <p className="text-white font-bold">{user?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Email</label>
                    <p className="text-white font-bold">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Account Since</label>
                    <p className="text-white font-bold">
                      {user?.created_date && new Date(user.created_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}