import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Sparkles, ArrowLeft, ShoppingBag, Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BundleBuilder from "../components/bundles/BundleBuilder";

export default function BuildYourBundle() {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }),
    initialData: [],
  });

  const categories = [
    {
      name: 'Faith Essentials',
      description: 'Build your spiritual toolkit',
      icon: '📖',
      products: products.filter(p => p.category === 'Books' || p.category === 'Faith')
    },
    {
      name: 'Worship Bundle',
      description: 'Create your worship experience',
      icon: '🎵',
      products: products.filter(p => p.category === 'Music' || p.category === 'Worship')
    },
    {
      name: 'Ministry Kit',
      description: 'Tools for ministry leaders',
      icon: '⛪',
      products: products.filter(p => p.category === 'Ministry' || p.category === 'Leadership')
    },
    {
      name: 'Gift Package',
      description: 'Perfect gifts for loved ones',
      icon: '🎁',
      products: products.slice(0, 20)
    }
  ];

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl("StoreAdvanced")}>
            <Button variant="outline" className="border-slate-700 text-slate-300 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
          </Link>

          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-4">Build Your Own Bundle</h1>
            <p className="text-slate-400 text-lg">
              Choose products, save 10%, powered by AI suggestions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Card
                key={cat.name}
                onClick={() => setSelectedCategory(cat)}
                className="bg-[#1a1f3a] border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer group"
              >
                <CardContent className="p-8">
                  <div className="text-6xl mb-4">{cat.icon}</div>
                  <h3 className="text-white font-black text-2xl mb-2 group-hover:text-purple-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-slate-400 mb-4">{cat.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500">{cat.products.length} products</Badge>
                    <Badge className="bg-green-500">Save 10%</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          onClick={() => setSelectedCategory(null)}
          variant="outline"
          className="border-slate-700 text-slate-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Change Category
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl">{selectedCategory.icon}</span>
            <div>
              <h1 className="text-4xl font-black text-white">{selectedCategory.name}</h1>
              <p className="text-slate-400">{selectedCategory.description}</p>
            </div>
          </div>
        </div>

        <BundleBuilder
          category={selectedCategory.name}
          availableProducts={selectedCategory.products}
          user={user}
        />
      </div>
    </div>
  );
}