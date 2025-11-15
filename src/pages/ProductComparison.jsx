import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProductComparison() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const productIds = searchParams.get('ids')?.split(',') || [];

  const { data: products = [] } = useQuery({
    queryKey: ['compareProducts', productIds],
    queryFn: async () => {
      const prods = await Promise.all(
        productIds.map(id => base44.entities.Product.filter({ id }).then(res => res[0]))
      );
      return prods.filter(Boolean);
    },
    enabled: productIds.length > 0,
    initialData: []
  });

  const features = [
    { label: 'Price', key: 'price', format: (val) => `$${val?.toFixed(2)}` },
    { label: 'Category', key: 'category' },
    { label: 'Stock', key: 'stock_quantity', format: (val) => val > 0 ? 'In Stock' : 'Out of Stock' },
    { label: 'Rating', key: 'rating', format: (val) => `${val || 4.5}/5` },
    { label: 'Weight', key: 'weight', format: (val) => val ? `${val} lbs` : 'N/A' },
    { label: 'Dimensions', key: 'dimensions' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-white">Compare Products</h1>
          <Link to={createPageUrl('Store')}>
            <Button variant="outline" className="border-slate-600">
              Back to Store
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <p className="text-white font-bold text-xl">No products to compare</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 text-white font-black bg-[#1a1f3a]">Feature</th>
                  {products.map(product => {
                    const images = Array.isArray(product.images) 
                      ? product.images 
                      : (product.images ? JSON.parse(product.images) : []);
                    return (
                      <th key={product.id} className="p-4 bg-[#1a1f3a]">
                        <Card className="bg-slate-900 border-slate-700">
                          <CardContent className="p-4">
                            <img src={images[0] || '/placeholder.jpg'} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                            <h3 className="text-white font-bold mb-2">{product.name}</h3>
                            <div className="flex items-center gap-1 mb-3 justify-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                            <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </Button>
                          </CardContent>
                        </Card>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr key={idx} className="border-t border-slate-700">
                    <td className="p-4 bg-[#1a1f3a] text-white font-bold">{feature.label}</td>
                    {products.map(product => (
                      <td key={product.id} className="p-4 bg-slate-900/30 text-center">
                        <span className="text-slate-300">
                          {feature.format 
                            ? feature.format(product[feature.key]) 
                            : product[feature.key] || 'N/A'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}