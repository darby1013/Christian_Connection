import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Zap, Archive, Tag, TrendingUp, RefreshCw, DollarSign, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminProductQuickActions() {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const quickActionMutation = useMutation({
    mutationFn: async ({ action, filters }) => {
      const targetProducts = products.filter(filters);
      await Promise.all(targetProducts.map(p => {
        const updates = action(p);
        return base44.entities.Product.update(p.id, updates);
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      alert('✅ Quick action completed!');
    }
  });

  const quickActions = [
    {
      title: 'Clear Out of Stock',
      description: 'Archive all out of stock products',
      icon: Archive,
      color: 'red',
      count: products.filter(p => p.stock_quantity === 0).length,
      action: () => quickActionMutation.mutate({
        action: () => ({ status: 'archived' }),
        filters: (p) => p.stock_quantity === 0
      })
    },
    {
      title: 'Mark Best Sellers',
      description: 'Tag top 20 products as featured',
      icon: Star,
      color: 'yellow',
      count: 20,
      action: () => {
        const topProducts = products
          .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
          .slice(0, 20);
        Promise.all(topProducts.map(p => 
          base44.entities.Product.update(p.id, { is_featured: true })
        ));
        queryClient.invalidateQueries(['products']);
        alert('✅ Marked top 20 as featured!');
      }
    },
    {
      title: 'Restock Alert',
      description: 'Tag low stock items',
      icon: Package,
      color: 'amber',
      count: products.filter(p => p.stock_quantity < 10).length,
      action: () => quickActionMutation.mutate({
        action: (p) => ({ tags: (p.tags || '') + ',low-stock' }),
        filters: (p) => p.stock_quantity < 10
      })
    },
    {
      title: 'Apply 10% Discount',
      description: 'Add 10% discount to all active products',
      icon: DollarSign,
      color: 'green',
      count: products.filter(p => p.status === 'active').length,
      action: () => quickActionMutation.mutate({
        action: (p) => ({ compare_at_price: p.price, price: p.price * 0.9 }),
        filters: (p) => p.status === 'active'
      })
    },
    {
      title: 'Reset Prices',
      description: 'Remove all discounts',
      icon: RefreshCw,
      color: 'blue',
      count: products.filter(p => p.compare_at_price > 0).length,
      action: () => quickActionMutation.mutate({
        action: (p) => ({ price: p.compare_at_price || p.price, compare_at_price: null }),
        filters: (p) => p.compare_at_price > 0
      })
    },
    {
      title: 'Activate Drafts',
      description: 'Publish all draft products',
      icon: TrendingUp,
      color: 'cyan',
      count: products.filter(p => p.status === 'draft').length,
      action: () => quickActionMutation.mutate({
        action: () => ({ status: 'active' }),
        filters: (p) => p.status === 'draft'
      })
    }
  ];

  const colorClasses = {
    red: 'from-red-900/30 to-rose-900/30 border-red-500/30',
    yellow: 'from-yellow-900/30 to-amber-900/30 border-yellow-500/30',
    amber: 'from-amber-900/30 to-orange-900/30 border-amber-500/30',
    green: 'from-green-900/30 to-emerald-900/30 border-green-500/30',
    blue: 'from-blue-900/30 to-cyan-900/30 border-blue-500/30',
    cyan: 'from-cyan-900/30 to-blue-900/30 border-cyan-500/30'
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Quick Actions Panel"
        subtitle="One-click bulk operations for common tasks"
        icon={Zap}
        badge="PRODUCTIVITY"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((qa, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${colorClasses[qa.color]} hover:scale-105 transition-transform`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <qa.icon className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20">{qa.count} items</Badge>
              </div>
              <h3 className="text-white font-black text-lg mb-2">{qa.title}</h3>
              <p className="text-slate-300 text-sm mb-4">{qa.description}</p>
              <Button 
                onClick={qa.action}
                disabled={qa.count === 0}
                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 font-bold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}