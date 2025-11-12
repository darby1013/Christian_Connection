import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, RefreshCw,
  Search, Filter, Download, Plus, Edit, Warehouse, BarChart3,
  ArrowUpCircle, ArrowDownCircle, Calendar, DollarSign, MapPin
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminInventoryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity_change: 0,
    reason: 'recount',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('-last_stock_count'),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Inventory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAdjustDialogOpen(false);
      setSelectedInventory(null);
    },
  });

  const handleAdjustment = async () => {
    if (!selectedInventory || adjustmentForm.quantity_change === 0) return;

    const newQuantity = selectedInventory.quantity_available + adjustmentForm.quantity_change;
    const adjustment = {
      date: new Date().toISOString(),
      quantity_change: adjustmentForm.quantity_change,
      reason: adjustmentForm.reason,
      adjusted_by: 'Admin',
      notes: adjustmentForm.notes
    };

    const updatedAdjustments = [
      ...(selectedInventory.inventory_adjustments || []),
      adjustment
    ];

    await updateInventoryMutation.mutateAsync({
      id: selectedInventory.id,
      data: {
        quantity_available: Math.max(0, newQuantity),
        inventory_adjustments: updatedAdjustments,
        last_stock_count: new Date().toISOString(),
        low_stock_alert: newQuantity <= selectedInventory.reorder_point,
        total_value: newQuantity * (selectedInventory.cost_per_unit || 0)
      }
    });

    setAdjustmentForm({ quantity_change: 0, reason: 'recount', notes: '' });
  };

  const filteredInventory = inventory.filter(item => {
    const product = products.find(p => p.id === item.product_id);
    const matchesSearch = !searchQuery || 
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocation === 'all' || item.warehouse_location === filterLocation;
    return matchesSearch && matchesLocation;
  });

  const lowStockItems = filteredInventory.filter(i => i.quantity_available <= i.reorder_point);
  const outOfStockItems = filteredInventory.filter(i => i.quantity_available === 0);
  const incomingStock = filteredInventory.filter(i => i.quantity_incoming > 0);

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.total_value || 0), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity_available, 0);

  const getStatusBadge = (item) => {
    if (item.quantity_available === 0) return <Badge className="bg-red-500">Out of Stock</Badge>;
    if (item.quantity_available <= item.reorder_point) return <Badge className="bg-amber-500">Low Stock</Badge>;
    return <Badge className="bg-green-500">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Inventory Management</h2>
          <p className="text-slate-400 font-semibold">Real-time stock tracking across all locations</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-700/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalItems.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Units</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-700/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalInventoryValue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Inventory Value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-700/20 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{lowStockItems.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{lowStockItems.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Low Stock Alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/20 to-red-700/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-red-400" />
              <Badge className="bg-red-500">{outOfStockItems.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{outOfStockItems.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search by SKU or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
          />
        </div>
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-[200px] bg-[#1a1f3a] border-slate-700 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Locations</SelectItem>
            <SelectItem value="main" className="text-white">Main Warehouse</SelectItem>
            <SelectItem value="warehouse_a" className="text-white">Warehouse A</SelectItem>
            <SelectItem value="warehouse_b" className="text-white">Warehouse B</SelectItem>
            <SelectItem value="warehouse_c" className="text-white">Warehouse C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All Items ({filteredInventory.length})
          </TabsTrigger>
          <TabsTrigger value="low_stock" className="data-[state=active]:bg-cyan-500">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Low Stock ({lowStockItems.length})
          </TabsTrigger>
          <TabsTrigger value="out_of_stock" className="data-[state=active]:bg-cyan-500">
            Out of Stock ({outOfStockItems.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="data-[state=active]:bg-cyan-500">
            Incoming ({incomingStock.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-3">
            {filteredInventory.map((item) => {
              const product = products.find(p => p.id === item.product_id);
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-slate-800 flex items-center justify-center">
                        {product?.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <Package className="w-8 h-8 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{product?.name || 'Unknown Product'}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-slate-600">SKU: {item.sku}</Badge>
                          <Badge className="bg-purple-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {item.warehouse_location}
                          </Badge>
                          {item.bin_location && (
                            <Badge className="bg-cyan-500">Bin: {item.bin_location}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item)}
                          <div className="text-right">
                            <p className="text-2xl font-black text-white">{item.quantity_available}</p>
                            <p className="text-xs text-slate-400">Available</p>
                          </div>
                        </div>
                        {item.quantity_reserved > 0 && (
                          <Badge className="bg-amber-500">
                            {item.quantity_reserved} Reserved
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-right min-w-[100px]">
                        <p className="text-sm text-slate-400">Reorder at: {item.reorder_point}</p>
                        {item.quantity_incoming > 0 && (
                          <p className="text-sm text-green-400">+{item.quantity_incoming} incoming</p>
                        )}
                        {item.cost_per_unit && (
                          <p className="text-sm text-cyan-400">
                            Value: ${(item.quantity_available * item.cost_per_unit).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInventory(item);
                          setAdjustDialogOpen(true);
                        }}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="low_stock" className="mt-6">
          <div className="grid gap-3">
            {lowStockItems.map((item) => {
              const product = products.find(p => p.id === item.product_id);
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-amber-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="w-10 h-10 text-amber-400" />
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{product?.name}</h3>
                        <p className="text-amber-400 text-sm">
                          Only {item.quantity_available} left - Reorder threshold: {item.reorder_point}
                        </p>
                        <Badge className="bg-amber-500 mt-2">
                          Suggested reorder: {item.reorder_quantity} units
                        </Badge>
                      </div>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        <Plus className="w-3 h-3 mr-1" />
                        Reorder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="out_of_stock" className="mt-6">
          <div className="grid gap-3">
            {outOfStockItems.map((item) => {
              const product = products.find(p => p.id === item.product_id);
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-red-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-red-900/20 flex items-center justify-center border-2 border-red-500/30">
                        <TrendingDown className="w-8 h-8 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{product?.name}</h3>
                        <p className="text-red-400 text-sm mb-2">OUT OF STOCK since {item.out_of_stock_date ? new Date(item.out_of_stock_date).toLocaleDateString() : 'recently'}</p>
                        {item.expected_restock_date && (
                          <Badge className="bg-green-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            Restock: {new Date(item.expected_restock_date).toLocaleDateString()}
                          </Badge>
                        )}
                        {item.quantity_reserved > 0 && (
                          <Badge className="bg-amber-500 ml-2">
                            {item.quantity_reserved} on backorder
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInventory(item);
                          setAdjustDialogOpen(true);
                        }}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Stock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="incoming" className="mt-6">
          <div className="grid gap-3">
            {incomingStock.map((item) => {
              const product = products.find(p => p.id === item.product_id);
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-blue-900/20 flex items-center justify-center border-2 border-blue-500/30">
                        <ArrowDownCircle className="w-8 h-8 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{product?.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500">
                            +{item.quantity_incoming} incoming
                          </Badge>
                          <Badge className="bg-green-500">
                            {item.quantity_available} in stock
                          </Badge>
                        </div>
                        {item.expected_restock_date && (
                          <p className="text-blue-400 text-sm mt-2">
                            Expected: {new Date(item.expected_restock_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white font-black">Adjust Inventory</DialogTitle>
          </DialogHeader>
          {selectedInventory && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-white font-bold mb-1">
                  {products.find(p => p.id === selectedInventory.product_id)?.name}
                </p>
                <p className="text-slate-400 text-sm">SKU: {selectedInventory.sku}</p>
                <p className="text-cyan-400 text-sm mt-2">
                  Current: {selectedInventory.quantity_available} units
                </p>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Quantity Change</Label>
                <Input
                  type="number"
                  placeholder="Enter positive or negative number"
                  value={adjustmentForm.quantity_change}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity_change: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-sm text-slate-400 mt-1">
                  New quantity: {selectedInventory.quantity_available + adjustmentForm.quantity_change}
                </p>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Reason</Label>
                <Select value={adjustmentForm.reason} onValueChange={(value) => setAdjustmentForm({...adjustmentForm, reason: value})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="recount" className="text-white">Physical Recount</SelectItem>
                    <SelectItem value="received" className="text-white">Stock Received</SelectItem>
                    <SelectItem value="damaged" className="text-white">Damaged Goods</SelectItem>
                    <SelectItem value="returned" className="text-white">Customer Return</SelectItem>
                    <SelectItem value="shrinkage" className="text-white">Shrinkage/Loss</SelectItem>
                    <SelectItem value="correction" className="text-white">System Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Notes</Label>
                <Textarea
                  placeholder="Additional details..."
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, notes: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-20"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleAdjustment}
              disabled={adjustmentForm.quantity_change === 0}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}