import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentlyViewedProducts({ user }) {
  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ['recentlyViewed', user?.id],
    queryFn: () => base44.entities.RecentlyViewed.filter({ user_id: user?.id }, '-viewed_at', 6),
    enabled: !!user,
    initialData: [],
  });

  if (recentlyViewed.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-cyan-400" />
        <h2 className="text-2xl font-black text-white">Recently Viewed</h2>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recentlyViewed.map((item) => (
          <Link key={item.id} to={createPageUrl("ProductDetail") + `?id=${item.product_id}`}>
            <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50 transition-all group cursor-pointer">
              <div className="relative aspect-square overflow-hidden">
                {item.product_image ? (
                  <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900" />
                )}
              </div>
              <CardContent className="p-3">
                <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{item.product_name}</h4>
                <p className="text-cyan-400 font-black">${item.product_price?.toFixed(2)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}