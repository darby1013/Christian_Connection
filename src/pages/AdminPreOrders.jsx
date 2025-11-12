import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Clock, CheckCircle, Truck, Package, Calendar,
  DollarSign, Users, TrendingUp, AlertCircle, Mail
} from "lucide-react";
import { format } from "date-fns";

export default function AdminPreOrders() {
  const [activeTab, setActiveTab] = useState("pending");

  const queryClient = useQueryClient();

  const { data: preOrders = [] } = useQuery({
    queryKey: ['preOrders'],
    queryFn: () => base44.entities.PreOrder.list('-created_date'),
    initialData: [],
  });

  const updatePreOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PreOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preOrders'] });
    },
  });

  const markAsProduction = (preOrder) => {
    updatePreOrderMutation.mutate({
      id: preOrder.id,
      data: { status: 'production' }
    });
  };

  const markAsShipped = (preOrder) => {
    updatePreOrderMutation.mutate({
      id: preOrder.id,
      data: {
        status: 'shipped',
        actual_ship_date: new Date().toISOString()
      }
    });
  };

  const pendingOrders = preOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const productionOrders = preOrders.filter(o => o.status === 'production');
  const shippedOrders = preOrders.filter(o => o.status === 'shipped');

  const totalRevenue = preOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalDeposits = preOrders.reduce((sum, o) => sum + (o.deposit_amount || 0), 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-500';
      case 'confirmed': return 'bg-blue-500';
      case 'production': return 'bg-purple-500';
      case 'ready_to_ship': return 'bg-cyan-500';
      case 'shipped': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Pre-Order Management</h2>
        <p className="text-slate-400 font-semibold">Manage upcoming product orders</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{preOrders.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{preOrders.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Pre-Orders</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalRevenue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Expected Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{productionOrders.length}</p>
            <p className="text-slate-400 text-sm font-semibold">In Production</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalDeposits.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Deposits Collected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-500">
            <Clock className="w-4 h-4 mr-1" />
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="production" className="data-[state=active]:bg-cyan-500">
            <Package className="w-4 h-4 mr-1" />
            Production ({productionOrders.length})
          </TabsTrigger>
          <TabsTrigger value="shipped" className="data-[state=active]:bg-cyan-500">
            <Truck className="w-4 h-4 mr-1" />
            Shipped ({shippedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-3">
          {pendingOrders.map((order) => (
            <Card key={order.id} className="bg-[#1a1f3a] border-amber-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Clock className="w-10 h-10 text-amber-400" />
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{order.product_name}</h3>
                    <p className="text-slate-400 text-sm mb-2">{order.customer_name} • {order.customer_email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <Badge className="bg-purple-500">Qty: {order.quantity}</Badge>
                      <Badge className="bg-green-500">${order.total_amount.toFixed(2)}</Badge>
                      {order.deposit_paid && (
                        <Badge className="bg-cyan-500">Deposit Paid</Badge>
                      )}
                    </div>
                    {order.expected_ship_date && (
                      <p className="text-amber-400 text-sm mt-2">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Expected: {format(new Date(order.expected_ship_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => markAsProduction(order)}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Start Production
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="production" className="mt-6 space-y-3">
          {productionOrders.map((order) => (
            <Card key={order.id} className="bg-[#1a1f3a] border-purple-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Package className="w-10 h-10 text-purple-400" />
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{order.product_name}</h3>
                    <p className="text-slate-400 text-sm mb-2">{order.customer_name}</p>
                    <Badge className="bg-purple-500">In Production</Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => markAsShipped(order)}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Truck className="w-3 h-3 mr-1" />
                    Mark Shipped
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="shipped" className="mt-6 space-y-3">
          {shippedOrders.map((order) => (
            <Card key={order.id} className="bg-[#1a1f3a] border-green-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{order.product_name}</h3>
                    <p className="text-slate-400 text-sm mb-2">{order.customer_name}</p>
                    <Badge className="bg-green-500">Shipped</Badge>
                    {order.actual_ship_date && (
                      <p className="text-green-400 text-xs mt-2">
                        Shipped: {format(new Date(order.actual_ship_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}