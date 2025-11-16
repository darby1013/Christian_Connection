import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, Package } from 'lucide-react';

export default function BrandShowcase() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const brandData = {};
  products.forEach(p => {
    if (p.brand) {
      if (!brandData[p.brand]) {
        brandData[p.brand] = { count: 0, totalSales: 0 };
      }
      brandData[p.brand].count += 1;
      brandData[p.brand].totalSales += p.total_sales || 0;
    }
  });

  const topBrands = Object.entries(brandData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 24);

  const allBrands = Object.keys(brandData).sort();

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Top Selling Brands</h1>
          <p className="text-slate-400 font-semibold">Trusted brands in our collection</p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-black text-white">Featured Brands</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
          {topBrands.map(brand => (
            <Link key={brand.name} to={createPageUrl('Store') + `?brand=${brand.name}`}>
              <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 bg-white rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <span className="font-black text-slate-800 text-lg">{brand.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <h3 className="text-white font-bold mb-1">{brand.name}</h3>
                  <p className="text-slate-400 text-xs">{brand.count} products</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <Package className="w-6 h-6 text-purple-400" />
            Browse All Brands
          </h2>
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-4 gap-6">
                {['A-G', 'H-N', 'O-T', 'U-Z'].map((range, idx) => (
                  <div key={range}>
                    <h3 className="text-cyan-400 font-black text-lg mb-3">{range}</h3>
                    <div className="space-y-2">
                      {allBrands.filter(brand => {
                        const first = brand[0].toUpperCase();
                        if (idx === 0) return first >= 'A' && first <= 'G';
                        if (idx === 1) return first >= 'H' && first <= 'N';
                        if (idx === 2) return first >= 'O' && first <= 'T';
                        return first >= 'U' && first <= 'Z';
                      }).map(brand => (
                        <Link key={brand} to={createPageUrl('Store') + `?brand=${brand}`}>
                          <p className="text-slate-300 hover:text-cyan-400 transition-colors text-sm">
                            {brand}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}