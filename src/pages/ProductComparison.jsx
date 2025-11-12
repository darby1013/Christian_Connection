import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ShoppingCart, Star, Check, X, Minus,
  Package, Truck, Shield, Award, DollarSign, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProductComparison() {
  const [user, setUser] = useState(null);
  const [compareProducts, setCompareProducts] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();

    // Get products from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const productIds = urlParams.get('products')?.split(',') || [];
    
    if (productIds.length > 0) {
      loadProducts(productIds);
    }
  }, []);

  const loadProducts = async (ids) => {
    const products = await Promise.all(
      ids.map(id => base44.entities.Product.filter({ id }).then(p => p[0]))
    );
    setCompareProducts(products.filter(Boolean));
  };

  if (compareProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-12 text-center">
            <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">No Products to Compare</h2>
            <p className="text-slate-400 mb-6">Add products from the store to compare</p>
            <Link to={createPageUrl("StoreAdvanced")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Browse Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = [
    { key: 'price', label: 'Price', icon: DollarSign },
    { key: 'rating', label: 'Rating', icon: Star },
    { key: 'brand', label: 'Brand', icon: Award },
    { key: 'category', label: 'Category', icon: Package },
    { key: 'stock_quantity', label: 'Stock', icon: Package },
    { key: 'weight', label: 'Weight', icon: Package },
    { key: 'review_count', label: 'Reviews', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link to={createPageUrl("StoreAdvanced")}>
          <Button variant="outline" className="border-slate-700 text-slate-300 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
        </Link>

        <h1 className="text-4xl font-black text-white mb-8">Product Comparison</h1>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-4 text-left bg-[#1a1f3a] border border-slate-700">
                  <span className="text-white font-bold">Features</span>
                </th>
                {compareProducts.map((product) => (
                  <th key={product.id} className="p-4 bg-[#1a1f3a] border border-slate-700">
                    <Card className="bg-slate-900/50 border-0">
                      <CardContent className="p-4">
                        <div className="aspect-square mb-3 rounded overflow-hidden">
                          <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-white font-bold mb-2 line-clamp-2 text-center">{product.name}</h3>
                        <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
                          <Button className="w-full bg-cyan-500 hover:bg-cyan-600 mb-2">
                            View Details
                          </Button>
                        </Link>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.key}>
                  <td className="p-4 bg-[#1a1f3a] border border-slate-700">
                    <div className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-semibold">{feature.label}</span>
                    </div>
                  </td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-4 bg-[#1a1f3a] border border-slate-700 text-center">
                      {feature.key === 'price' && (
                        <span className="text-cyan-400 font-black text-xl">
                          ${product.price?.toFixed(2)}
                        </span>
                      )}
                      {feature.key === 'rating' && (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-white font-bold">{product.rating || 0}</span>
                        </div>
                      )}
                      {feature.key === 'stock_quantity' && (
                        <Badge className={product.stock_quantity > 0 ? "bg-green-500" : "bg-red-500"}>
                          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of Stock'}
                        </Badge>
                      )}
                      {!['price', 'rating', 'stock_quantity'].includes(feature.key) && (
                        <span className="text-slate-300">{product[feature.key] || '-'}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}