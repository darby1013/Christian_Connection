import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Package, Search, DollarSign, TrendingUp, AlertCircle, Download } from 'lucide-react';

export default function AdminOrderManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    refetchInterval: 3000,
    initialData: []
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrders']);
      setShowDetails(false);
    }
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  };

  const columns = [
    { header: 'Order ID', key: 'id', render: (val) => <span className="text-cyan-400 font-bold">#{val.slice(0, 8).toUpperCase()}</span> },
    { header: 'Customer', key: 'user_id', render: (val) => <span className="text-white">{val.slice(0, 8)}</span> },
    { header: 'Amount', key: 'total_amount', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { 
      header: 'Status', 
      key: 'status', 
      render: (val) => (
        <Badge className={
          val === 'delivered' ? 'bg-green-500' :
          val === 'shipped' ? 'bg-blue-500' :
          val === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
        }>
          {val}
        </Badge>
      )
    },
    { header: 'Date', key: 'created_date', render: (val) => new Date(val).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Order Management"
        subtitle="Real-time order processing and fulfillment"
        icon={Package}
        badge="LIVE"
        actions={[
          { label: 'Export CSV', icon: Download, onClick: () => {} }
        ]}
      />

      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.total}</p>
            <p className="text-purple-300 text-sm font-bold">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.pending}</p>
            <p className="text-yellow-300 text-sm font-bold">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.shipped}</p>
            <p className="text-blue-300 text-sm font-bold">Shipped</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.delivered}</p>
            <p className="text-green-300 text-sm font-bold">Delivered</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">${stats.revenue.toFixed(0)}</p>
            <p className="text-cyan-300 text-sm font-bold">Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search by order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EnterpriseTable
            columns={columns}
            data={filteredOrders}
            onRowClick={(order) => {
              setSelectedOrder(order);
              setShowDetails(true);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Order Status</p>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(val) => updateOrderMutation.mutate({ id: selectedOrder.id, data: { status: val } })}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Amount</p>
                  <p className="text-white font-black text-2xl">${selectedOrder.total_amount?.toFixed(2)}</p>
                </div>
              </div>
              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Shipping Address</p>
                  <div className="bg-slate-900/50 p-4 rounded-lg text-slate-300">
                    {(() => {
                      const addr = JSON.parse(selectedOrder.shipping_address);
                      return (
                        <>
                          <p className="font-bold text-white">{addr.full_name}</p>
                          <p>{addr.address}</p>
                          <p>{addr.city}, {addr.state} {addr.zip}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}