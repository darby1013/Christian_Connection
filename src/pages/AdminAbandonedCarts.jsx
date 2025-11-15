import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { ShoppingCart, Mail, DollarSign, TrendingDown } from 'lucide-react';

export default function AdminAbandonedCarts() {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const [emailTemplate, setEmailTemplate] = useState('');
  const queryClient = useQueryClient();

  const { data: cartItems = [] } = useQuery({
    queryKey: ['allCartItems'],
    queryFn: () => base44.entities.CartItem.list('-created_date'),
    refetchInterval: 10000,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const sendRecoveryEmailMutation = useMutation({
    mutationFn: async ({ email, message }) => {
      return await base44.integrations.Core.SendEmail({
        to: email,
        subject: '🛒 You left something in your cart!',
        body: message
      });
    },
    onSuccess: () => {
      alert('✅ Recovery email sent!');
      setShowEmailDialog(false);
    }
  });

  const abandonedCarts = cartItems.reduce((acc, item) => {
    const timeSinceAdded = Date.now() - new Date(item.created_date).getTime();
    const hoursSinceAdded = timeSinceAdded / (1000 * 60 * 60);
    
    if (hoursSinceAdded > 1) {
      const existing = acc.find(cart => cart.user_id === item.user_id);
      const product = products.find(p => p.id === item.product_id);
      
      if (existing) {
        existing.items.push({ ...item, product });
        existing.total += (product?.price || 0) * item.quantity;
      } else {
        acc.push({
          user_id: item.user_id,
          items: [{ ...item, product }],
          total: (product?.price || 0) * item.quantity,
          created_date: item.created_date
        });
      }
    }
    return acc;
  }, []);

  const stats = {
    total: abandonedCarts.length,
    revenue: abandonedCarts.reduce((sum, cart) => sum + cart.total, 0),
    avgValue: abandonedCarts.length > 0 ? abandonedCarts.reduce((sum, cart) => sum + cart.total, 0) / abandonedCarts.length : 0
  };

  const columns = [
    { 
      header: 'Customer', 
      key: 'user_id', 
      render: (userId) => {
        const user = users.find(u => u.id === userId);
        return <span className="text-white font-bold">{user?.email || userId.slice(0, 8)}</span>;
      }
    },
    { header: 'Items', key: 'items', render: (items) => <Badge className="bg-cyan-500">{items.length}</Badge> },
    { header: 'Value', key: 'total', render: (val) => <span className="text-green-400 font-bold">${val.toFixed(2)}</span> },
    { 
      header: 'Time', 
      key: 'created_date', 
      render: (date) => {
        const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
        return <span className="text-slate-300">{hours}h ago</span>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Abandoned Carts"
        subtitle="Recover lost sales with email campaigns"
        icon={ShoppingCart}
        badge="RECOVERY"
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
            <p className="text-amber-300 text-sm font-bold">Potential Revenue</p>
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
            onClick: (cart) => {
              setSelectedCart(cart);
              const user = users.find(u => u.id === cart.user_id);
              setEmailTemplate(`Hi ${user?.full_name || 'there'},\n\nWe noticed you left ${cart.items.length} item(s) in your cart worth $${cart.total.toFixed(2)}.\n\nComplete your purchase now and get 10% off with code COMEBACK10!\n\nBest regards,\nYour Store Team`);
              setShowEmailDialog(true);
            }
          }
        ]}
      />

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Send Recovery Email</DialogTitle>
          </DialogHeader>
          {selectedCart && (
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Cart Details</p>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  {selectedCart.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-white mb-2">
                      <span>{item.product?.name}</span>
                      <span className="font-bold">${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between text-white font-black">
                    <span>Total</span>
                    <span>${selectedCart.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-white font-bold mb-2 block">Email Message</label>
                <Textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white h-48"
                />
              </div>
              <Button
                onClick={() => {
                  const user = users.find(u => u.id === selectedCart.user_id);
                  if (user?.email) {
                    sendRecoveryEmailMutation.mutate({ email: user.email, message: emailTemplate });
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 font-bold h-12"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}