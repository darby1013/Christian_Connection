import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShoppingBag, Search, TrendingUp, Package, Truck, CheckCircle,
  XCircle, Clock, DollarSign, Eye, Filter, Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: [],
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDetailDialogOpen(false);
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    if (confirm(`Change order status to ${newStatus}?`)) {
      updateOrderMutation.mutate({
        id: orderId,
        data: { status: newStatus }
      });
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500',
      processing: 'bg-blue-500',
      shipped: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Order Management</h2>
          <p className="text-slate-400 font-semibold">Track and manage customer orders</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-cyan-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{orders.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Orders</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalRevenue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{pendingOrders}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{pendingOrders}</p>
            <p className="text-slate-400 text-sm font-semibold">Pending</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{completedOrders}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{completedOrders}</p>
            <p className="text-slate-400 text-sm font-semibold">Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md bg-[#1a1f3a] border border-slate-700 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Order #</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Customer</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Date</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Amount</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Status</th>
                <th className="text-left p-4 text-slate-400 font-semibold text-sm">Payment</th>
                <th className="text-right p-4 text-slate-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-4">
                    <p className="text-white font-semibold">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-white font-semibold">{order.customer_name}</p>
                    <p className="text-slate-400 text-sm">{order.customer_email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300 text-sm">
                      {format(new Date(order.created_date), 'MMM d, yyyy')}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-white font-bold">${order.total_amount?.toFixed(2)}</p>
                  </td>
                  <td className="p-4">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={order.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}>
                      {order.payment_status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => viewOrderDetails(order)}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="h-8 px-2 text-sm rounded bg-slate-800 border border-slate-700 text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredOrders.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Orders Found</h3>
            <p className="text-slate-400">No orders match your search criteria</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">Order Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedOrder?.order_number || `#${selectedOrder?.id?.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Customer</p>
                  <p className="text-white font-bold">{selectedOrder.customer_name}</p>
                  <p className="text-slate-400 text-sm">{selectedOrder.customer_email}</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Order Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1 capitalize">{selectedOrder.status}</span>
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">Shipping Address</p>
                {selectedOrder.shipping_address ? (
                  <div className="text-white">
                    <p>{selectedOrder.shipping_address.street}</p>
                    <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}</p>
                    <p>{selectedOrder.shipping_address.country}</p>
                  </div>
                ) : (
                  <p className="text-slate-400">No shipping address provided</p>
                )}
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-slate-400">Payment Method</p>
                  <p className="text-white font-semibold">{selectedOrder.payment_method || 'Not specified'}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-slate-400">Payment Status</p>
                  <Badge className={selectedOrder.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                  <p className="text-white font-bold">Total Amount</p>
                  <p className="text-white font-bold text-xl">${selectedOrder.total_amount?.toFixed(2)}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Notes</p>
                  <p className="text-white">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}