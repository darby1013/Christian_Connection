import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Package, Search, Eye, Truck, DollarSign, Clock } from 'lucide-react';

export default function AdminOrdersEnhanced() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    refetchInterval: 3000,
    initialData: []
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
    }
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  const columns = [
    { 
      header: 'Order ID', 
      key: 'id',
      render: (val) => <span className="text-cyan-400 font-mono text-sm">{val.slice(0, 8).toUpperCase()}</span>
    },
    { 
      header: 'Date', 
      key: 'created_date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      header: 'Total', 
      key: 'total_amount',
      render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span>
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => {
        const colors = {
          pending: 'bg-yellow-500',
          processing: 'bg-blue-500',
          shipped: 'bg-purple-500',
          completed: 'bg-green-500',
          cancelled: 'bg-red-500'
        };
        return <Badge className={colors[val] || 'bg-slate-500'}>{val}</Badge>;
      }
    },
    {
      header: 'Payment',
      key: 'payment_method',
      render: (val) => <Badge className="bg-cyan-500">{val || 'Credit Card'}</Badge>
    },
    {
      header: 'Shipping',
      key: 'shipping_method',
      render: (val) => <Badge variant="secondary" className="bg-slate-700">{val || 'Standard'}</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Orders Management"
        subtitle="Real-time order tracking and fulfillment"
        icon={Package}
        badge="LIVE"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <Package className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-3xl font-black text-white">{orders.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <DollarSign className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-3xl font-black text-white">${totalRevenue.toFixed(0)}</p>
            <p className="text-green-300 text-sm font-bold">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <Clock className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-3xl font-black text-white">{pendingOrders}</p>
            <p className="text-yellow-300 text-sm font-bold">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <Truck className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-3xl font-black text-white">{completedOrders}</p>
            <p className="text-purple-300 text-sm font-bold">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EnterpriseTable
            columns={columns}
            data={filteredOrders}
            onRowClick={(order) => {
              setSelectedOrder(order);
              setShowDetailsDialog(true);
            }}
            actions={[
              { label: 'View Details', icon: Eye, onClick: (order) => {
                setSelectedOrder(order);
                setShowDetailsDialog(true);
              }}
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <p className="text-slate-400 text-sm mb-2">Order Status</p>
                    <Select 
                      value={selectedOrder.status} 
                      onValueChange={(val) => updateStatusMutation.mutate({ id: selectedOrder.id, status: val })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                    <p className="text-3xl font-black text-white">${selectedOrder.total_amount?.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-white font-bold mb-3">Shipping Address</p>
                  {selectedOrder.shipping_address && (
                    <div className="text-slate-300 text-sm space-y-1">
                      {(() => {
                        try {
                          const addr = JSON.parse(selectedOrder.shipping_address);
                          return (
                            <>
                              <p className="text-white font-semibold">{addr.full_name}</p>
                              <p>{addr.address}</p>
                              <p>{addr.city}, {addr.state} {addr.zip}</p>
                              <p>{addr.phone}</p>
                            </>
                          );
                        } catch {
                          return <p>Invalid address data</p>;
                        }
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}