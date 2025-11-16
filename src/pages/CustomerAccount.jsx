import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Package, Heart, MapPin, Settings, Award, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';

export default function CustomerAccount() {
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
    initialData: []
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: () => base44.entities.WishlistItem.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['savedAddresses', user?.id],
    queryFn: () => base44.entities.CustomerAddress.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const { data: loyalty } = useQuery({
    queryKey: ['customerLoyalty', user?.id],
    queryFn: async () => {
      const records = await base44.entities.CustomerLoyalty.filter({ user_id: user?.id });
      return records[0];
    },
    enabled: !!user
  });

  const menuItems = [
    { title: 'Order History', icon: Package, url: createPageUrl('OrderHistory'), count: orders.length },
    { title: 'Wishlist', icon: Heart, url: createPageUrl('Wishlist'), count: wishlistItems.length },
    { title: 'Saved Addresses', icon: MapPin, url: createPageUrl('SavedAddresses'), count: savedAddresses.length },
    { title: 'Account Settings', icon: Settings, url: createPageUrl('AccountSettings') },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">My Account</h1>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-xl">{user.full_name}</p>
                  <p className="text-slate-400">{user.email}</p>
                </div>
              </div>
              {loyalty && (
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <Badge className="bg-amber-500">{loyalty.tier_name || 'Bronze'} Member</Badge>
                  <span className="text-amber-400 font-bold">{loyalty.points || 0} pts</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
            <CardContent className="p-6">
              <ShoppingBag className="w-12 h-12 text-cyan-400 mb-3" />
              <p className="text-3xl font-black text-white">{orders.length}</p>
              <p className="text-cyan-300 font-bold">Total Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
            <CardContent className="p-6">
              <Heart className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-3xl font-black text-white">{wishlistItems.length}</p>
              <p className="text-green-300 font-bold">Wishlist Items</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link key={item.title} to={item.url}>
              <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-black text-xl">{item.title}</h3>
                        {item.count !== undefined && (
                          <p className="text-slate-400">{item.count} items</p>
                        )}
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}