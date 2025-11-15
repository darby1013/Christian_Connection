import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, X } from 'lucide-react';

export default function ProductQuickView({ product, onClose, user }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: (data) => base44.entities.CartItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      alert('✅ Added to cart!');
      onClose();
    }
  });

  if (!product) return null;

  const images = Array.isArray(product.images) 
    ? product.images 
    : (product.images ? JSON.parse(product.images) : []);
  const inStock = (product.stock_quantity || 0) > 0;

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <img 
              src={images[selectedImage] || '/placeholder.jpg'} 
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg mb-4"
            />
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded overflow-hidden border-2 ${
                    selectedImage === i ? 'border-cyan-500' : 'border-slate-700'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Badge className={inStock ? 'bg-green-500' : 'bg-red-500'} mb={2}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
            <h2 className="text-3xl font-black text-white mb-4">{product.name}</h2>
            <div className="mb-4">
              <p className="text-4xl font-black text-white">${product.price?.toFixed(2)}</p>
              {product.compare_at_price && (
                <p className="text-slate-500 line-through">${product.compare_at_price.toFixed(2)}</p>
              )}
            </div>
            <p className="text-slate-300 mb-6">{product.description}</p>
            <div className="mb-6">
              <label className="text-white font-bold mb-2 block">Quantity</label>
              <div className="flex items-center gap-2">
                <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="outline" className="border-slate-600">-</Button>
                <span className="text-white font-bold w-12 text-center">{quantity}</span>
                <Button onClick={() => setQuantity(quantity + 1)} variant="outline" className="border-slate-600">+</Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  if (!user) {
                    base44.auth.redirectToLogin();
                    return;
                  }
                  addToCartMutation.mutate({
                    user_id: user.id,
                    product_id: product.id,
                    quantity,
                    price: product.price
                  });
                }}
                disabled={!inStock}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 h-12 font-bold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" className="border-slate-600 h-12 px-6">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}