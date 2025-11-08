
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Plus, Minus, X, Star, Search, Filter
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Store() {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date'),
    initialData: [],
  });

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Church Store</h1>
            <p className="text-lg text-slate-400">Quality products to support your faith journey</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="relative bg-cyan-500 hover:bg-cyan-600 text-white">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg bg-[#1a1f3a] border-slate-700">
              <SheetHeader>
                <SheetTitle className="text-white">Shopping Cart ({cartItemCount} items)</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <Card key={item.id} className="overflow-hidden bg-[#0f1629] border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <img
                                src={item.images?.[0] || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=200'}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm mb-1 line-clamp-2 text-white">{item.name}</h4>
                                <p className="text-lg font-bold text-cyan-400">${item.price}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-slate-700 text-slate-300 hover:bg-slate-800"
                                    onClick={() => updateQuantity(item.id, -1)}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="text-sm font-medium w-8 text-center text-white">{item.quantity}</span>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-slate-700 text-slate-300 hover:bg-slate-800"
                                    onClick={() => updateQuantity(item.id, 1)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 ml-auto text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="border-t border-slate-700 pt-4 space-y-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Total:</span>
                        <span className="text-cyan-400">${cartTotal.toFixed(2)}</span>
                      </div>
                      <Link to={createPageUrl("Checkout")}>
                        <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" size="lg">
                          Proceed to Checkout
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 bg-[#1a1f3a] border-slate-700 overflow-hidden">
              <div className="relative aspect-square bg-slate-100">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.is_featured && (
                  <Badge className="absolute top-3 left-3 bg-yellow-500">Featured</Badge>
                )}
                {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                  <Badge className="absolute top-3 right-3 bg-orange-500">
                    Only {product.stock_quantity} left
                  </Badge>
                )}
                {product.stock_quantity === 0 && (
                  <Badge className="absolute top-3 right-3 bg-red-500">Out of Stock</Badge>
                )}
              </div>
              <CardContent className="p-5">
                <div className="mb-3">
                  <Badge variant="outline" className="text-xs mb-2">{product.category}</Badge>
                  <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">{product.description}</p>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-slate-500 ml-1">
                    ({product.review_count || 0})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-cyan-400">${product.price}</span>
                  <Button
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity === 0}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No products found</h3>
            <p className="text-slate-500">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
