import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, Truck, Package, Mail, Phone, MapPin,
  Download, Share2, Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function OrderConfirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order');

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const results = await base44.entities.Order.filter({ id: orderId });
      return results[0] || null;
    },
    enabled: !!orderId,
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-[#1a1f3a] border-green-500/30 mb-8">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4">Order Confirmed!</h1>
            <p className="text-slate-300 text-lg mb-6">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Badge className="bg-cyan-500 text-xl px-6 py-2">
                Order #{order.order_number}
              </Badge>
              <Badge className="bg-purple-500 text-xl px-6 py-2">
                ${order.total_amount.toFixed(2)}
              </Badge>
            </div>
            <p className="text-slate-400">
              A confirmation email has been sent to <span className="text-cyan-400 font-semibold">{order.customer_email}</span>
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-white font-semibold mb-1">{order.shipping_address.name}</p>
              <p className="text-slate-400 text-sm">{order.shipping_address.street}</p>
              {order.shipping_address.street_line_2 && (
                <p className="text-slate-400 text-sm">{order.shipping_address.street_line_2}</p>
              )}
              <p className="text-slate-400 text-sm">
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
              </p>
              {order.shipping_address.phone && (
                <p className="text-slate-400 text-sm mt-2">
                  <Phone className="w-3 h-3 inline mr-1" />
                  {order.shipping_address.phone}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Date</span>
                <span className="text-white font-semibold">
                  {format(new Date(order.created_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method</span>
                <span className="text-white font-semibold">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shipping Method</span>
                <span className="text-white font-semibold">{order.shipping_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <Badge className="bg-green-500">{order.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
                <img src={item.image_url} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <h4 className="text-white font-bold">{item.product_name}</h4>
                  <p className="text-slate-400 text-sm">Qty: {item.quantity}</p>
                </div>
                <p className="text-cyan-400 font-black text-lg">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}

            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white font-bold">${order.subtotal?.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-400">Discount</span>
                  <span className="text-green-400 font-bold">-${order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Shipping</span>
                <span className="text-white font-bold">${order.shipping_cost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax</span>
                <span className="text-white font-bold">${order.tax_amount?.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between">
                <span className="text-white font-black text-lg">Total</span>
                <span className="text-cyan-400 font-black text-2xl">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to={createPageUrl("StoreAdvanced")} className="flex-1">
            <Button className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Home className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <Button className="flex-1 bg-purple-500 hover:bg-purple-600 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}