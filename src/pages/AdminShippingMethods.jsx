import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Truck, Plus, Edit, Trash2, Clock, DollarSign,
  Package, Shield, MapPin, Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminShippingMethods() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm, setMethodForm] = useState({
    name: '',
    carrier: 'custom',
    service_level: '',
    base_cost: 0,
    estimated_days_min: 3,
    estimated_days_max: 7,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ['shippingMethods'],
    queryFn: () => base44.entities.ShippingMethod.list('sort_order'),
    initialData: [],
  });

  const createMethodMutation = useMutation({
    mutationFn: (data) => base44.entities.ShippingMethod.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingMethods'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMethodMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShippingMethod.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingMethods'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMethodMutation = useMutation({
    mutationFn: (id) => base44.entities.ShippingMethod.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingMethods'] });
    },
  });

  const handleSubmit = () => {
    if (editingMethod) {
      updateMethodMutation.mutate({ id: editingMethod.id, data: methodForm });
    } else {
      createMethodMutation.mutate(methodForm);
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setMethodForm(method);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setMethodForm({
      name: '',
      carrier: 'custom',
      service_level: '',
      base_cost: 0,
      estimated_days_min: 3,
      estimated_days_max: 7,
      is_active: true
    });
    setEditingMethod(null);
  };

  const getCarrierIcon = (carrier) => {
    switch(carrier) {
      case 'usps': return '🇺🇸';
      case 'ups': return '📦';
      case 'fedex': return '✈️';
      case 'dhl': return '🌍';
      default: return '🚚';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Shipping Methods</h2>
          <p className="text-slate-400 font-semibold">Configure shipping options and rates</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-cyan-500 hover:bg-cyan-600 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Add Shipping Method
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{shippingMethods.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{shippingMethods.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Methods</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {shippingMethods.filter(m => m.is_active).length}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Active Methods</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              ${shippingMethods.filter(m => m.free_shipping_threshold).length > 0 ? 'Yes' : 'No'}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Free Shipping Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Methods */}
      <div className="grid gap-3">
        {shippingMethods.map((method) => (
          <Card key={method.id} className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{getCarrierIcon(method.carrier)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{method.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-purple-500">{method.carrier.toUpperCase()}</Badge>
                        <Badge className="bg-cyan-500">{method.service_level}</Badge>
                        <Badge className="bg-green-500 text-lg font-black">
                          ${method.base_cost.toFixed(2)}
                        </Badge>
                        {method.free_shipping_threshold && (
                          <Badge className="bg-amber-500">
                            Free over ${method.free_shipping_threshold}
                          </Badge>
                        )}
                        {method.is_active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-500">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(method)} className="bg-cyan-500 hover:bg-cyan-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this shipping method?')) {
                            deleteMethodMutation.mutate(method.id);
                          }
                        }}
                        className="border-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="p-2 bg-slate-900/50 rounded text-center">
                      <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                      <p className="text-white text-sm font-semibold">
                        {method.estimated_days_min}-{method.estimated_days_max} days
                      </p>
                      <p className="text-slate-400 text-xs">Delivery</p>
                    </div>
                    {method.tracking_available && (
                      <div className="p-2 bg-slate-900/50 rounded text-center">
                        <MapPin className="w-4 h-4 text-green-400 mx-auto mb-1" />
                        <p className="text-white text-sm font-semibold">Tracking</p>
                        <p className="text-slate-400 text-xs">Available</p>
                      </div>
                    )}
                    {method.insurance_included && (
                      <div className="p-2 bg-slate-900/50 rounded text-center">
                        <Shield className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                        <p className="text-white text-sm font-semibold">Insured</p>
                        <p className="text-slate-400 text-xs">Included</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Method Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black">
              {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Method Name *</Label>
                <Input
                  placeholder="e.g., Standard Shipping"
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({...methodForm, name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Carrier</Label>
                <Select value={methodForm.carrier} onValueChange={(value) => setMethodForm({...methodForm, carrier: value})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="usps" className="text-white">USPS</SelectItem>
                    <SelectItem value="ups" className="text-white">UPS</SelectItem>
                    <SelectItem value="fedex" className="text-white">FedEx</SelectItem>
                    <SelectItem value="dhl" className="text-white">DHL</SelectItem>
                    <SelectItem value="custom" className="text-white">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Service Level</Label>
                <Input
                  placeholder="e.g., Ground, 2-Day, Overnight"
                  value={methodForm.service_level}
                  onChange={(e) => setMethodForm({...methodForm, service_level: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Base Cost ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={methodForm.base_cost}
                  onChange={(e) => setMethodForm({...methodForm, base_cost: parseFloat(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Min Delivery Days</Label>
                <Input
                  type="number"
                  value={methodForm.estimated_days_min}
                  onChange={(e) => setMethodForm({...methodForm, estimated_days_min: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Max Delivery Days</Label>
                <Input
                  type="number"
                  value={methodForm.estimated_days_max}
                  onChange={(e) => setMethodForm({...methodForm, estimated_days_max: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
              <input
                type="checkbox"
                checked={methodForm.is_active}
                onChange={(e) => setMethodForm({...methodForm, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label className="text-white">Active (show to customers)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!methodForm.name || methodForm.base_cost < 0}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {editingMethod ? 'Update' : 'Create'} Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function handleSubmit() {
    if (editingMethod) {
      updateMethodMutation.mutate({ id: editingMethod.id, data: methodForm });
    } else {
      createMethodMutation.mutate(methodForm);
    }
  }

  function resetForm() {
    setMethodForm({
      name: '',
      carrier: 'custom',
      service_level: '',
      base_cost: 0,
      estimated_days_min: 3,
      estimated_days_max: 7,
      is_active: true
    });
    setEditingMethod(null);
  }
}