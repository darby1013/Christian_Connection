import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, Star, Check, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProductComparison() {
  const [compareIds, setCompareIds] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    fetchUser();
    const stored = localStorage.getItem('compareProducts');
    if (stored) setCompareIds(JSON.parse(stored));
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['compareProducts', compareIds],
    queryFn: async () => {
      if (compareIds.length === 0) return [];
      const allProducts = await base44.entities.Product.list();
      return allProducts.filter(p => compareIds.includes(p.id));
    },
    initialData: []
  });

  const removeProduct = (id) => {
    const updated = compareIds.filter(pid => pid !== id);
    setCompareIds(updated);
    localStorage.setItem('compareProducts', JSON.stringify(updated));
  };

  const features = [
    { key: 'price', label: 'Price', render: (p) => `$${p.price?.toFixed(2)}` },
    { key: 'stock_quantity', label: 'Stock', render: (p) => p.stock_quantity || 0 },
    { key: 'category', label: 'Category', render: (p) => p.category || 'N/A' },
    { key: 'is_digital', label: 'Type', render: (p) => p.is_digital ? 'Digital' : 'Physical' },
    { key: 'weight', label: 'Weight', render: (p) => p.weight || 'N/A' },
    { key: 'dimensions', label: 'Dimensions', render: (p) => p.dimensions || 'N/A' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">Product Comparison</h1>

        {products.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <p className="text-white font-bold text-xl mb-2">No products to compare</p>
              <p className="text-slate-400 mb-6">Add products from the store to compare them</p>
              <Link to={createPageUrl('Store')}>
                <Button className="bg-cyan-500">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-4 text-left text-white font-black">Feature</th>
                  {products.map(product => {
                    const images = Array.isArray(product.images) 
                      ? product.images 
                      : (product.images ? JSON.parse(product.images) : []);
                    return (
                      <th key={product.id} className="p-4 min-w-[250px]">
                        <Card className="bg-[#1a1f3a] border-slate-700">
                          <CardContent className="p-4">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="float-right text-red-400"
                              onClick={() => removeProduct(product.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <img src={images[0]} alt="" className="w-full aspect-square object-cover rounded-lg mb-3" />
                            <h3 className="text-white font-bold mb-2">{product.name}</h3>
                            <div className="flex items-center gap-1 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                            <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                              <ShoppingCart className="w-3 h-3 mr-2" />
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
                {features.map(feature => (
                  <tr key={feature.key} className="border-b border-slate-700/50">
                    <td className="p-4 text-slate-400 font-bold">{feature.label}</td>
                    {products.map(product => (
                      <td key={product.id} className="p-4 text-white font-semibold text-center">
                        {feature.render(product)}
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