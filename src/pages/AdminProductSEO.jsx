import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Globe, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminProductSEO() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const optimizeSEO = async (product) => {
    setOptimizing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Optimize SEO for this product:
Name: ${product.name}
Description: ${product.description}
Category: ${product.category}

Generate:
1. SEO-optimized product title (60 chars max)
2. Meta description (160 chars max)
3. 5-7 relevant keywords
4. Alt text for main image`,
        response_json_schema: {
          type: 'object',
          properties: {
            seo_title: { type: 'string' },
            meta_description: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            alt_text: { type: 'string' }
          }
        }
      });

      await base44.entities.Product.update(product.id, {
        tags: result.keywords?.join(', ')
      });

      queryClient.invalidateQueries(['products']);
      alert('✅ SEO optimized!');
    } catch (error) {
      alert('Error optimizing SEO');
    } finally {
      setOptimizing(false);
    }
  };

  const seoScores = products.map(p => {
    let score = 0;
    if (p.name && p.name.length > 10 && p.name.length < 60) score += 25;
    if (p.description && p.description.length > 50) score += 25;
    if (p.tags && p.tags.split(',').length >= 3) score += 25;
    if (p.images && p.images.length > 0) score += 25;
    
    return { ...p, seo_score: score };
  });

  const columns = [
    { header: 'Product', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { 
      header: 'SEO Score', 
      key: 'seo_score',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-slate-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${val >= 75 ? 'bg-green-500' : val >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${val}%` }}
            />
          </div>
          <span className="text-white text-sm font-bold">{val}%</span>
        </div>
      )
    },
    { header: 'Keywords', key: 'tags', render: (val) => <Badge className="bg-purple-500">{val?.split(',').length || 0}</Badge> },
    { 
      header: 'Status', 
      key: 'seo_score',
      render: (val) => (
        <Badge className={val >= 75 ? 'bg-green-500' : val >= 50 ? 'bg-amber-500' : 'bg-red-500'}>
          {val >= 75 ? 'Good' : val >= 50 ? 'Needs Work' : 'Poor'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product SEO Optimizer"
        subtitle="AI-powered SEO optimization for product listings"
        icon={Globe}
        badge="AI POWERED"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{seoScores.filter(p => p.seo_score >= 75).length}</p>
            <p className="text-green-300 text-sm font-bold">Good SEO</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{seoScores.filter(p => p.seo_score >= 50 && p.seo_score < 75).length}</p>
            <p className="text-amber-300 text-sm font-bold">Needs Work</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{seoScores.filter(p => p.seo_score < 50).length}</p>
            <p className="text-red-300 text-sm font-bold">Poor SEO</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              {(seoScores.reduce((sum, p) => sum + p.seo_score, 0) / seoScores.length).toFixed(0)}%
            </p>
            <p className="text-blue-300 text-sm font-bold">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={seoScores}
        actions={[
          { 
            label: 'Optimize', 
            icon: Sparkles, 
            onClick: (p) => optimizeSEO(p)
          }
        ]}
      />
    </div>
  );
}