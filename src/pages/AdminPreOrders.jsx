import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Clock, Package, DollarSign } from 'lucide-react';

export default function AdminPreOrders() {
  const { data: preOrders = [] } = useQuery({
    queryKey: ['preOrders'],
    queryFn: () => base44.entities.PreOrder.list('-created_date'),
    refetchInterval: 5000,
    initialData: []
  });

  const stats = {
    total: preOrders.length,
    pending: preOrders.filter(p => p.status === 'pending').length,
    revenue: preOrders.reduce((sum, p) => sum + (p.total_amount || 0), 0)
  };

  const columns = [
    { header: 'Product', key: 'product_name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Customer', key: 'user_id', render: (val) => <span className="text-slate-300">{val.slice(0, 8)}</span> },
    { header: 'Quantity', key: 'quantity', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Amount', key: 'total_amount', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Release Date', key: 'expected_release_date', render: (val) => <span className="text-cyan-400">{new Date(val).toLocaleDateString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <Badge className={val === 'fulfilled' ? 'bg-green-500' : 'bg-yellow-500'}>{val}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Pre-Order Management"
        subtitle="Manage upcoming product pre-orders"
        icon={Clock}
        badge="ENTERPRISE"
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.total}</p>
            <p className="text-blue-300 text-sm font-bold">Total Pre-Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.pending}</p>
            <p className="text-yellow-300 text-sm font-bold">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-3xl font-black text-white">${stats.revenue.toFixed(0)}</p>
            <p className="text-green-300 text-sm font-bold">Pre-Order Revenue</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable columns={columns} data={preOrders} />
    </div>
  );
}