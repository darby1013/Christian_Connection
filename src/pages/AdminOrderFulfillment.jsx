import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Package, Truck, CheckCircle, Clock, AlertTriangle,
  MapPin, Search, Filter, Edit, Eye, ArrowRight,
  Printer, Send, RefreshCw, BarChart3
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export default function AdminOrderFulfillment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    tracking_number: '',
    carrier: 'usps',
    tracking_url: ''
  });

  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: [],
  });

  const { data: fulfillments = [] } = useQuery({
    queryKey: ['fulfillments'],
    queryFn: () => base44.entities.OrderFulfillment.list('-created_date'),
    initialData: [],
  });

  const createFulfillmentMutation = useMutation({
    mutationFn: (data) => base44.entities.OrderFulfillment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
    },
  });

  const updateFulfillmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrderFulfillment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
      setTrackingDialogOpen(false);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const markAsPicked = async (order) => {
    const existingFulfillment = fulfillments.find(f => f.order_id === order.id);

    if (existingFulfillment) {
      await updateFulfillmentMutation.mutateAsync({
        id: existingFulfillment.id,
        data: {
          fulfillment_status: 'processing',
          picked_at: new Date().toISOString(),
          picked_by: 'Admin'
        }
      });
    } else {
      await createFulfillmentMutation.mutateAsync({
        order_id: order.id,
        order_number: order.order_number,
        fulfillment_status: 'processing',
        picked_at: new Date().toISOString(),
        picked_by: 'Admin',
        items: order.items || []
      });
    }
  };

  const markAsShipped = async (order) => {
    setSelectedOrder(order);
    setTrackingDialogOpen(true);
  };

  const submitTracking = async () => {
    const fulfillment = fulfillments.find(f => f.order_id === selectedOrder.id);

    if (fulfillment) {
      await updateFulfillmentMutation.mutateAsync({
        id: fulfillment.id,
        data: {
          fulfillment_status: 'shipped',
          shipped_at: new Date().toISOString(),
          tracking_number: trackingForm.tracking_number,
          carrier: trackingForm.carrier,
          tracking_url: trackingForm.tracking_url
        }
      });
    }

    await updateOrderMutation.mutateAsync({
      id: selectedOrder.id,
      data: {
        status: 'shipped',
        fulfillment_status: 'fulfilled',
        tracking_number: trackingForm.tracking_number,
        tracking_url: trackingForm.tracking_url
      }
    });

    setTrackingForm({ tracking_number: '', carrier: 'usps', tracking_url: '' });
  };

  const filteredOrders = orders.filter(order =>
    order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const processingOrders = filteredOrders.filter(o => o.status === 'processing');
  const shippedOrders = filteredOrders.filter(o => o.status === 'shipped');
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge className="bg-amber-500">Pending</Badge>,
      confirmed: <Badge className="bg-blue-500">Confirmed</Badge>,
      processing: <Badge className="bg-purple-500">Processing</Badge>,
      shipped: <Badge className="bg-cyan-500">Shipped</Badge>,
      delivered: <Badge className="bg-green-500">Delivered</Badge>,
      cancelled: <Badge className="bg-red-500">Cancelled</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Order Fulfillment Center</h2>
          <p className="text-slate-400 font-semibold">Pick, pack, and ship orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{pendingOrders.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{pendingOrders.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Pending Orders</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{processingOrders.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{processingOrders.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Processing</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{shippedOrders.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{shippedOrders.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Shipped</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{deliveredOrders.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{deliveredOrders.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search by order number, customer name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-500">
            <Clock className="w-4 h-4 mr-1" />
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="processing" className="data-[state=active]:bg-cyan-500">
            <Package className="w-4 h-4 mr-1" />
            Processing ({processingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="shipped" className="data-[state=active]:bg-cyan-500">
            <Truck className="w-4 h-4 mr-1" />
            Shipped ({shippedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="delivered" className="data-[state=active]:bg-cyan-500">
            <CheckCircle className="w-4 h-4 mr-1" />
            Delivered ({deliveredOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 grid gap-3">
          {pendingOrders.map((order) => (
            <Card key={order.id} className="bg-[#1a1f3a] border-amber-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/30">
                    <Clock className="w-8 h-8 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold text-lg mb-1">Order #{order.order_number}</h3>
                        <p className="text-slate-400 text-sm">{order.customer_name} • {order.customer_email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(order.status)}
                          <Badge className="bg-cyan-500">{order.items?.length || 0} items</Badge>
                          <Badge className="bg-green-500 text-lg font-black">${order.total_amount?.toFixed(2)}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => markAsPicked(order)}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Start Processing
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailsDialogOpen(true);
                          }}
                          className="bg-cyan-500 hover:bg-cyan-600"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="processing" className="mt-6 grid gap-3">
          {processingOrders.map((order) => {
            const fulfillment = fulfillments.find(f => f.order_id === order.id);
            return (
              <Card key={order.id} className="bg-[#1a1f3a] border-purple-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/30">
                      <Package className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-bold text-lg mb-1">Order #{order.order_number}</h3>
                          <p className="text-slate-400 text-sm">{order.customer_name}</p>
                          {fulfillment?.picked_at && (
                            <p className="text-green-400 text-xs mt-1">
                              Picked: {format(new Date(fulfillment.picked_at), 'MMM d, h:mm a')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => markAsShipped(order)}
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Mark Shipped
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="shipped" className="mt-6 grid gap-3">
          {shippedOrders.map((order) => {
            const fulfillment = fulfillments.find(f => f.order_id === order.id);
            return (
              <Card key={order.id} className="bg-[#1a1f3a] border-cyan-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-cyan-500/20 flex items-center justify-center border-2 border-cyan-500/30">
                      <Truck className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">Order #{order.order_number}</h3>
                      <p className="text-slate-400 text-sm mb-2">{order.customer_name}</p>
                      {order.tracking_number && (
                        <Badge className="bg-cyan-500 mb-2">
                          <MapPin className="w-3 h-3 mr-1" />
                          {order.tracking_number}
                        </Badge>
                      )}
                      <p className="text-cyan-400 text-xs">
                        Shipped: {fulfillment?.shipped_at ? format(new Date(fulfillment.shipped_at), 'MMM d, h:mm a') : 'Recently'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="delivered" className="mt-6 grid gap-3">
          {deliveredOrders.map((order) => (
            <Card key={order.id} className="bg-[#1a1f3a] border-green-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-green-500/20 flex items-center justify-center border-2 border-green-500/30">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">Order #{order.order_number}</h3>
                    <p className="text-slate-400 text-sm mb-2">{order.customer_name}</p>
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Delivered
                    </Badge>
                    {order.delivered_at && (
                      <p className="text-green-400 text-xs mt-1">
                        {format(new Date(order.delivered_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white font-black">Add Tracking Information</DialogTitle>
            <DialogDescription className="text-slate-400">
              Order #{selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-white mb-2 block">Carrier</Label>
              <select
                value={trackingForm.carrier}
                onChange={(e) => setTrackingForm({...trackingForm, carrier: e.target.value})}
                className="w-full h-10 px-3 rounded-md bg-slate-900 border border-slate-700 text-white"
              >
                <option value="usps">USPS</option>
                <option value="ups">UPS</option>
                <option value="fedex">FedEx</option>
                <option value="dhl">DHL</option>
              </select>
            </div>

            <div>
              <Label className="text-white mb-2 block">Tracking Number *</Label>
              <Input
                placeholder="Enter tracking number"
                value={trackingForm.tracking_number}
                onChange={(e) => setTrackingForm({...trackingForm, tracking_number: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Tracking URL (Optional)</Label>
              <Input
                placeholder="https://..."
                value={trackingForm.tracking_url}
                onChange={(e) => setTrackingForm({...trackingForm, tracking_url: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={submitTracking}
              disabled={!trackingForm.tracking_number}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Mark as Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}