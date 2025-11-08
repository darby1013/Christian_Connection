import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shirt, Plus, Pencil, Trash2, Package, Palette, Ruler } from "lucide-react";

export default function AdminProductVariants() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const queryClient = useQueryClient();

  const [variantForm, setVariantForm] = useState({
    product_id: "",
    size: "M",
    color: "",
    color_hex: "#000000",
    material: "100% Cotton",
    brand: "Gildan",
    fit_type: "Regular",
    stock_quantity: 0,
    sku: "",
    price_adjustment: 0,
    weight: "5.3 oz",
    is_available: true
  });

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: [],
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['adminProductVariants'],
    queryFn: () => base44.entities.ProductVariant.list('-created_date'),
    initialData: [],
  });

  const createVariantMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductVariant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProductVariants'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductVariant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProductVariants'] });
    },
  });

  const resetForm = () => {
    setVariantForm({
      product_id: "",
      size: "M",
      color: "",
      color_hex: "#000000",
      material: "100% Cotton",
      brand: "Gildan",
      fit_type: "Regular",
      stock_quantity: 0,
      sku: "",
      price_adjustment: 0,
      weight: "5.3 oz",
      is_available: true
    });
  };

  const handleSubmit = () => {
    createVariantMutation.mutate(variantForm);
  };

  const filteredVariants = selectedProduct
    ? variants.filter(v => v.product_id === selectedProduct)
    : variants;

  const getProduct = (productId) => products.find(p => p.id === productId);

  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  const materials = ["100% Cotton", "Cotton Blend", "Polyester", "Tri-Blend", "Organic Cotton", "Performance Fabric"];
  const fitTypes = ["Regular", "Slim", "Relaxed", "Athletic", "Oversized"];
  const brands = ["Gildan", "Bella+Canvas", "Next Level", "Hanes", "Fruit of the Loom", "Custom Brand"];

  const popularColors = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Navy", hex: "#000080" },
    { name: "Gray", hex: "#808080" },
    { name: "Red", hex: "#FF0000" },
    { name: "Royal Blue", hex: "#4169E1" },
    { name: "Forest Green", hex: "#228B22" },
    { name: "Purple", hex: "#800080" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Total Variants</p>
                <p className="text-3xl font-black text-white mt-1">{variants.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Shirt className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Total Stock</p>
                <p className="text-3xl font-black text-white mt-1">
                  {variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Unique Colors</p>
                <p className="text-3xl font-black text-white mt-1">
                  {new Set(variants.map(v => v.color)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Unique Sizes</p>
                <p className="text-3xl font-black text-white mt-1">
                  {new Set(variants.map(v => v.size)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Ruler className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Variants */}
      <Card className="bg-[#1a1f3a] border-0">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-white font-black text-xl flex items-center gap-2">
            <Shirt className="w-6 h-6 text-cyan-400" />
            Product Variants (T-Shirts & Merchandise)
          </CardTitle>
          <div className="flex gap-3">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-64 bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value=" " className="text-white">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id} className="text-white">
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Create Product Variant</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white font-bold">Select Product</Label>
                    <Select value={variantForm.product_id} onValueChange={(value) => setVariantForm({...variantForm, product_id: value})}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id} className="text-white">
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white font-bold">Size</Label>
                      <Select value={variantForm.size} onValueChange={(value) => setVariantForm({...variantForm, size: value})}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {sizes.map((size) => (
                            <SelectItem key={size} value={size} className="text-white">{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white font-bold">Material</Label>
                      <Select value={variantForm.material} onValueChange={(value) => setVariantForm({...variantForm, material: value})}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {materials.map((material) => (
                            <SelectItem key={material} value={material} className="text-white">{material}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white font-bold">Fit Type</Label>
                      <Select value={variantForm.fit_type} onValueChange={(value) => setVariantForm({...variantForm, fit_type: value})}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {fitTypes.map((fit) => (
                            <SelectItem key={fit} value={fit} className="text-white">{fit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">Color</Label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {popularColors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setVariantForm({...variantForm, color: color.name, color_hex: color.hex})}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            variantForm.color === color.name ? 'border-cyan-500' : 'border-slate-700'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded mb-1"
                            style={{ backgroundColor: color.hex, border: color.hex === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
                          />
                          <p className="text-xs text-white font-semibold">{color.name}</p>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Custom color name"
                        value={variantForm.color}
                        onChange={(e) => setVariantForm({...variantForm, color: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                      <Input
                        type="color"
                        value={variantForm.color_hex}
                        onChange={(e) => setVariantForm({...variantForm, color_hex: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-bold">Brand</Label>
                      <Select value={variantForm.brand} onValueChange={(value) => setVariantForm({...variantForm, brand: value})}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {brands.map((brand) => (
                            <SelectItem key={brand} value={brand} className="text-white">{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white font-bold">Fabric Weight</Label>
                      <Input
                        value={variantForm.weight}
                        onChange={(e) => setVariantForm({...variantForm, weight: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 text-white mt-2"
                        placeholder="e.g., 5.3 oz"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white font-bold">Stock Quantity</Label>
                      <Input
                        type="number"
                        value={variantForm.stock_quantity}
                        onChange={(e) => setVariantForm({...variantForm, stock_quantity: parseInt(e.target.value)})}
                        className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-white font-bold">SKU</Label>
                      <Input
                        value={variantForm.sku}
                        onChange={(e) => setVariantForm({...variantForm, sku: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 text-white mt-2"
                        placeholder="e.g., TSH-BLK-M"
                      />
                    </div>

                    <div>
                      <Label className="text-white font-bold">Price Adjustment ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variantForm.price_adjustment}
                        onChange={(e) => setVariantForm({...variantForm, price_adjustment: parseFloat(e.target.value)})}
                        className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
                    disabled={createVariantMutation.isPending || !variantForm.product_id}
                  >
                    Create Variant
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold">Product</TableHead>
                <TableHead className="text-slate-400 font-bold">Size</TableHead>
                <TableHead className="text-slate-400 font-bold">Color</TableHead>
                <TableHead className="text-slate-400 font-bold">Material</TableHead>
                <TableHead className="text-slate-400 font-bold">Brand</TableHead>
                <TableHead className="text-slate-400 font-bold">Fit</TableHead>
                <TableHead className="text-slate-400 font-bold">Stock</TableHead>
                <TableHead className="text-slate-400 font-bold">SKU</TableHead>
                <TableHead className="text-slate-400 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariants.map((variant) => {
                const product = getProduct(variant.product_id);
                return (
                  <TableRow key={variant.id} className="border-white/5">
                    <TableCell>
                      <p className="text-white font-semibold">{product?.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500">{variant.size}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-slate-600"
                          style={{ backgroundColor: variant.color_hex }}
                        />
                        <span className="text-white text-sm">{variant.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">{variant.material}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{variant.brand}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{variant.fit_type}</TableCell>
                    <TableCell>
                      <Badge className={variant.stock_quantity > 10 ? 'bg-green-500' : variant.stock_quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'}>
                        {variant.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm font-mono">{variant.sku}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteVariantMutation.mutate(variant.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}