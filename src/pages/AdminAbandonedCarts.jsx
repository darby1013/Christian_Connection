import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { ShoppingCart, Mail, DollarSign, TrendingDown } from 'lucide-react';

export default function AdminAbandonedCarts() {
  const queryClient = useQueryClient();

  const { data: abandonedCarts = [] } = useQuery({
    queryKey: ['abandonedCarts'],
    queryFn: async () => {
      const carts = await base44.entities.CartItem.list('-updated_date');
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const grouped = carts.reduce((acc, item) => {
        if (!acc[item.user_id]) {
          acc[item.user_id] = { user_id: item.user_id, items: [], total: 0, updated_date: item.updated_date };
        }
        acc[item.user_id].items.push(item);
        acc[item.user_id].total += (item.price * item.quantity);
        return acc;
      }, {});
      
      return Object.values(grouped).filter(cart => new Date(cart.updated_date) < oneDayAgo);
    },
    refetchInterval: 10000,
    initialData: []
  });

  const sendRecoveryEmailMutation = useMutation({
    mutationFn: async ({ user_id, total }) => {
      const users = await base44.entities.User.filter({ id: user_id });
      const user = users[0];
      if (user?.email) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: '🛒 You left items in your cart!',
          body: `Hi ${user.full_name},\n\nYou have ${total.toFixed(2)} worth of items waiting in your cart. Complete your purchase now and get 10% off with code COMEBACK10!\n\nClick here to complete your order.`
        });
      }
    },
    onSuccess: () => {
      alert('✅ Recovery email sent!');
    }
  });

  const stats = {
    total: abandonedCarts.length,
    revenue: abandonedCarts.reduce((sum, cart) => sum + cart.total, 0),
    avgValue: abandonedCarts.length > 0 ? abandonedCarts.reduce((sum, cart) => sum + cart.total, 0) / abandonedCarts.length : 0
  };

  const columns = [
    { header: 'User ID', key: 'user_id', render: (val) => <span className="text-cyan-400 font-bold">{val.slice(0, 8)}</span> },
    { header: 'Items', key: 'items', render: (val) => <Badge className="bg-purple-500">{val.length}</Badge> },
    { header: 'Cart Value', key: 'total', render: (val) => <span className="text-green-400 font-bold">${val.toFixed(2)}</span> },
    { header: 'Last Updated', key: 'updated_date', render: (val) => new Date(val).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Abandoned Cart Recovery"
        subtitle="Recover lost sales with automated email campaigns"
        icon={ShoppingCart}
        badge="LIVE"
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.total}</p>
            <p className="text-red-300 text-sm font-bold">Abandoned Carts</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">${stats.revenue.toFixed(0)}</p>
            <p className="text-amber-300 text-sm font-bold">Lost Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white">${stats.avgValue.toFixed(2)}</p>
            <p className="text-cyan-300 text-sm font-bold">Avg Cart Value</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={abandonedCarts}
        actions={[
          {
            label: 'Send Recovery Email',
            icon: Mail,
            onClick: (cart) => sendRecoveryEmailMutation.mutate({ user_id: cart.user_id, total: cart.total })
          }
        ]}
      />
    </div>
  );
}