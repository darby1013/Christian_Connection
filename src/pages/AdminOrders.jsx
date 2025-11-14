
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, Search, TrendingUp, Package, Truck, CheckCircle,
  XCircle, Clock, DollarSign, Eye, Filter, Download, RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseStats from '../components/admin/EnterpriseStats';
import EnterpriseTable from '../components/admin/EnterpriseTable';

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
      setDetailDialogOpen(false); // Close dialog if an update was initiated from it
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

  const stats = [
    { title: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'cyan', trend: 'up', trendValue: '+15%' },
    { title: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'amber' },
    { title: 'Completed', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: 'green' },
    { title: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'green', trend: 'up', trendValue: '+24%' },
  ];

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

  const columns = [
    { header: 'Order ID', key: 'order_number', render: (val, row) => <span className="font-mono text-cyan-400">{val || `#${row.id.slice(0, 8)}`}</span> },
    { header: 'Customer', key: 'customer_email', render: (val, row) => (
      <div>
        <p className="text-white font-semibold">{row.customer_name}</p>
        <p className="text-slate-400 text-sm">{val}</p>
      </div>
    )},
    { header: 'Date', key: 'created_date', render: (val) => (
      <p className="text-slate-300 text-sm">
        {format(new Date(val), 'MMM d, yyyy')}
      </p>
    )},
    { header: 'Amount', key: 'total_amount', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => {
        return (
          <Badge className={getStatusColor(val)}>
            {getStatusIcon(val)}
            <span className="ml-1 capitalize">{val}</span>
          </Badge>
        );
      }
    },
    { header: 'Payment', key: 'payment_status', render: (val) => (
      <Badge className={val === 'paid' ? 'bg-green-500' : 'bg-amber-500'}>
        {val}
      </Badge>
    )},
    { 
      header: 'Actions', 
      key: 'actions', 
      render: (val, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            onClick={() => viewOrderDetails(row)}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          {row.status !== 'delivered' && row.status !== 'cancelled' && (
            <select
              value={row.status}
              onChange={(e) => handleStatusChange(row.id, e.target.value)}
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
      )
    },
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Orders"
        subtitle={`${orders.length} total orders • $${totalRevenue.toLocaleString()} revenue`}
        icon={ShoppingBag}
        actions={[
          { label: 'Export Orders', icon: Download, onClick: () => console.log('Export Orders clicked') }
        ]}
      />

      <EnterpriseStats stats={stats} />

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

      <EnterpriseTable
        columns={columns}
        data={filteredOrders} // Pass filtered orders
        // The actions prop from the outline is not used here because we integrated specific actions directly into the 'Actions' column render.
        // onRowClick is also handled via explicit buttons in the 'Actions' column.
      />

      {filteredOrders.length === 0 && (
        <div className="bg-[#1a1f3a] border-slate-700 rounded-lg p-12 text-center mt-6">
          <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">No Orders Found</h3>
          <p className="text-slate-400">No orders match your search criteria</p>
        </div>
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
