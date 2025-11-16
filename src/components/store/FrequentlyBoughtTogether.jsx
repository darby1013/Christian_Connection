import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart } from 'lucide-react';

export default function FrequentlyBoughtTogether({ productId, userId }) {
  const [selectedProducts, setSelectedProducts] = useState([productId]);
  const queryClient = useQueryClient();

  const { data: currentProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    }
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['relatedProducts', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.list();
      return products.filter(p => p.id !== productId && p.status === 'active').slice(0, 3);
    },
    initialData: []
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        base44.auth.redirectToLogin();
        return;
      }
      const products = [currentProduct, ...relatedProducts.filter(p => selectedProducts.includes(p.id))];
      await Promise.all(
        products.map(product => 
          base44.entities.CartItem.create({
            user_id: userId,
            product_id: product.id,
            quantity: 1,
            price: product.price
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      alert('✅ Items added to cart!');
    }
  });

  const toggleProduct = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const totalPrice = [currentProduct, ...relatedProducts]
    .filter(p => p && selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + (p.price || 0), 0);

  if (!currentProduct || relatedProducts.length === 0) return null;

  return (
    <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-white font-black text-xl">Frequently Bought Together</h3>
          <Badge className="bg-green-500">Save 15%</Badge>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3 flex items-center gap-4 flex-wrap">
            {/* Current Product */}
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border-2 border-cyan-500">
              <input
                type="checkbox"
                checked={selectedProducts.includes(productId)}
                readOnly
                className="w-5 h-5"
              />
              <img 
                src={(Array.isArray(currentProduct.images) ? currentProduct.images : JSON.parse(currentProduct.images || '[]'))[0] || '/placeholder.jpg'} 
                alt="" 
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <p className="text-white font-bold text-sm">{currentProduct.name}</p>
                <p className="text-cyan-400 font-bold">${currentProduct.price?.toFixed(2)}</p>
              </div>
            </div>

            <Plus className="w-6 h-6 text-slate-500" />

            {/* Related Products */}
            {relatedProducts.map((product, idx) => {
              const images = Array.isArray(product.images) 
                ? product.images 
                : (product.images ? JSON.parse(product.images || '[]') : []);
              
              return (
                <React.Fragment key={product.id}>
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedProducts.includes(product.id) 
                        ? 'bg-slate-900/50 border-2 border-cyan-500' 
                        : 'bg-slate-900/30 border-2 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="w-5 h-5"
                    />
                    <img src={images[0] || '/placeholder.jpg'} alt="" className="w-16 h-16 object-cover rounded" />
                    <div>
                      <p className="text-white font-bold text-sm">{product.name}</p>
                      <p className="text-cyan-400 font-bold">${product.price?.toFixed(2)}</p>
                    </div>
                  </div>
                  {idx < relatedProducts.length - 1 && <Plus className="w-6 h-6 text-slate-500" />}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex flex-col justify-center gap-3">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Total Price</p>
              <p className="text-white font-black text-3xl">${totalPrice.toFixed(2)}</p>
              <p className="text-green-400 text-sm font-bold">Save ${(totalPrice * 0.15).toFixed(2)}</p>
            </div>
            <Button 
              onClick={() => addToCartMutation.mutate()}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold w-full h-12"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add Selected to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}