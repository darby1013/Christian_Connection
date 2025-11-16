import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Heart, Bell, Mail, Tag, DollarSign, Save } from 'lucide-react';

export default function UserPreferences() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState({
    favorite_categories: [],
    favorite_brands: [],
    preferred_colors: [],
    preferred_sizes: [],
    price_range_min: 0,
    price_range_max: 1000,
    interests: [],
    email_notifications: true,
    sms_notifications: false,
    new_arrivals_alert: true,
    sale_alerts: true,
    personalized_offers: true
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const existing = await base44.entities.UserPreferenceCenter.filter({ user_id: currentUser.id });
        if (existing[0]) {
          setPreferences(existing[0]);
        }
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list(),
    initialData: []
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.ProductAttribute.list(),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = await base44.entities.UserPreferenceCenter.filter({ user_id: user.id });
      if (existing[0]) {
        return base44.entities.UserPreferenceCenter.update(existing[0].id, data);
      }
      return base44.entities.UserPreferenceCenter.create({ user_id: user.id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['preferences']);
      alert('✅ Preferences saved!');
    }
  });

  const toggleArrayItem = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const colors = attributes.filter(a => a.attribute_type === 'color');
  const sizes = attributes.filter(a => a.attribute_type === 'size');

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <Settings className="w-10 h-10 text-cyan-400" />
              Preference Center
            </h1>
            <p className="text-slate-400 font-semibold">Personalize your shopping experience</p>
          </div>
          <Button onClick={() => saveMutation.mutate(preferences)} className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold h-12">
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-6 h-6 text-pink-400" />
                <h2 className="text-white font-black text-xl">Favorite Categories</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleArrayItem('favorite_categories', cat.name)}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      preferences.favorite_categories.includes(cat.name)
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-6 h-6 text-blue-400" />
                <h2 className="text-white font-black text-xl">Favorite Brands</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {brands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => toggleArrayItem('favorite_brands', brand)}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      preferences.favorite_brands.includes(brand)
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h2 className="text-white font-black text-lg mb-4">Preferred Colors</h2>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map(color => {
                    const hexColor = color.metadata?.hex || '#808080';
                    const isSelected = preferences.preferred_colors.includes(color.name);
                    return (
                      <button
                        key={color.id}
                        onClick={() => toggleArrayItem('preferred_colors', color.name)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          isSelected ? 'border-cyan-400 scale-110' : 'border-slate-600'
                        }`}
                        style={{ backgroundColor: hexColor }}
                        title={color.name}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h2 className="text-white font-black text-lg mb-4">Preferred Sizes</h2>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size.id}
                      onClick={() => toggleArrayItem('preferred_sizes', size.name)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        preferences.preferred_sizes.includes(size.name)
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h2 className="text-white font-black text-xl">Price Range</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">${preferences.price_range_min}</span>
                  <span className="text-white font-bold">${preferences.price_range_max}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={preferences.price_range_max}
                  onChange={(e) => setPreferences({...preferences, price_range_max: parseInt(e.target.value)})}
                  className="w-full accent-cyan-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-yellow-400" />
                <h2 className="text-white font-black text-xl">Notification Preferences</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-bold">Email Notifications</p>
                      <p className="text-slate-400 text-sm">Receive updates via email</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={(e) => setPreferences({...preferences, email_notifications: e.target.checked})}
                    className="w-6 h-6"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-bold">New Arrivals Alert</p>
                      <p className="text-slate-400 text-sm">Get notified about new products</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.new_arrivals_alert}
                    onChange={(e) => setPreferences({...preferences, new_arrivals_alert: e.target.checked})}
                    className="w-6 h-6"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Percent className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-bold">Sale Alerts</p>
                      <p className="text-slate-400 text-sm">Notify me about sales and discounts</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.sale_alerts}
                    onChange={(e) => setPreferences({...preferences, sale_alerts: e.target.checked})}
                    className="w-6 h-6"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-bold">Personalized Offers</p>
                      <p className="text-slate-400 text-sm">Receive AI-powered recommendations</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.personalized_offers}
                    onChange={(e) => setPreferences({...preferences, personalized_offers: e.target.checked})}
                    className="w-6 h-6"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}