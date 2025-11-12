import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, ShoppingCart, Star, Check, Minus, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProductComparisonTool({ products, onRemove, onAddToCart }) {
  if (products.length === 0) return null;

  const features = ['Price', 'Rating', 'Brand', 'Category', 'Stock', 'Reviews'];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0f1629] border-t border-slate-700 shadow-2xl z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-black text-lg">
            Comparing {products.length} Products
          </h3>
          <Link to={createPageUrl("ProductComparison")}>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <Eye className="w-4 h-4 mr-2" />
              Full Comparison
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {products.slice(0, 4).map((product) => (
            <Card key={product.id} className="bg-[#1a1f3a] border-slate-700 relative">
              <Button
                size="icon"
                onClick={() => onRemove(product.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 w-6 h-6 z-10"
              >
                <X className="w-3 h-3" />
              </Button>
              <CardContent className="p-4">
                <div className="aspect-square mb-3 rounded overflow-hidden">
                  <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-white font-bold text-sm mb-2 line-clamp-2">{product.name}</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price:</span>
                    <span className="text-cyan-400 font-bold">${product.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-white">{product.rating || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stock:</span>
                    <Badge className={product.stock_quantity > 0 ? "bg-green-500" : "bg-red-500"}>
                      {product.stock_quantity > 0 ? 'In Stock' : 'Out'}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => onAddToCart(product)}
                  className="w-full mt-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Eye({ className }) {
  return <ArrowRight className={className} />;
}