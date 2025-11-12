import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Plus, Edit, Trash2, Globe, CheckCircle,
  AlertCircle, Calculator, TrendingUp, FileText
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

export default function AdminTaxConfiguration() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [taxForm, setTaxForm] = useState({
    region: '',
    region_name: '',
    tax_type: 'sales_tax',
    tax_rate: 0,
    tax_shipping: true,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: taxConfigs = [] } = useQuery({
    queryKey: ['taxConfigurations'],
    queryFn: () => base44.entities.TaxConfiguration.list('-priority'),
    initialData: [],
  });

  const createTaxMutation = useMutation({
    mutationFn: (data) => base44.entities.TaxConfiguration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigurations'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaxConfiguration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigurations'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteTaxMutation = useMutation({
    mutationFn: (id) => base44.entities.TaxConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfigurations'] });
    },
  });

  const handleSubmit = () => {
    if (editingTax) {
      updateTaxMutation.mutate({ id: editingTax.id, data: taxForm });
    } else {
      createTaxMutation.mutate(taxForm);
    }
  };

  const handleEdit = (tax) => {
    setEditingTax(tax);
    setTaxForm(tax);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setTaxForm({
      region: '',
      region_name: '',
      tax_type: 'sales_tax',
      tax_rate: 0,
      tax_shipping: true,
      is_active: true
    });
    setEditingTax(null);
  };

  const activeTaxes = taxConfigs.filter(t => t.is_active);
  const totalRegions = taxConfigs.length;
  const avgTaxRate = taxConfigs.length > 0
    ? (taxConfigs.reduce((sum, t) => sum + t.tax_rate, 0) / taxConfigs.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Tax Configuration</h2>
          <p className="text-slate-400 font-semibold">Manage sales tax, VAT, and GST by region</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-cyan-500 hover:bg-cyan-600 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Add Tax Rule
          </Button>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{totalRegions}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalRegions}</p>
            <p className="text-slate-400 text-sm font-semibold">Tax Regions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{activeTaxes.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{activeTaxes.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Rules</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calculator className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{avgTaxRate}%</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Tax Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Rules */}
      <div className="grid gap-3">
        {taxConfigs.map((tax) => (
          <Card key={tax.id} className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{tax.region_name || tax.region}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-purple-500">{tax.tax_type.toUpperCase()}</Badge>
                        <Badge className="bg-cyan-500 text-lg font-black">{tax.tax_rate}%</Badge>
                        {tax.tax_shipping && (
                          <Badge className="bg-green-500">Tax on Shipping</Badge>
                        )}
                        {tax.is_active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-500">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(tax)} className="bg-cyan-500 hover:bg-cyan-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this tax rule?')) {
                            deleteTaxMutation.mutate(tax.id);
                          }
                        }}
                        className="border-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="p-2 bg-slate-900/50 rounded">
                      <p className="text-slate-400 text-xs">Region Code</p>
                      <p className="text-white font-semibold">{tax.region}</p>
                    </div>
                    {tax.minimum_taxable_amount > 0 && (
                      <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-slate-400 text-xs">Minimum Amount</p>
                        <p className="text-white font-semibold">${tax.minimum_taxable_amount}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tax Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black">
              {editingTax ? 'Edit Tax Rule' : 'Add Tax Rule'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Region Code *</Label>
                <Input
                  placeholder="e.g., CA, NY, GB"
                  value={taxForm.region}
                  onChange={(e) => setTaxForm({...taxForm, region: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Region Name *</Label>
                <Input
                  placeholder="e.g., California, New York"
                  value={taxForm.region_name}
                  onChange={(e) => setTaxForm({...taxForm, region_name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Tax Type</Label>
                <Select value={taxForm.tax_type} onValueChange={(value) => setTaxForm({...taxForm, tax_type: value})}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="sales_tax" className="text-white">Sales Tax (US)</SelectItem>
                    <SelectItem value="vat" className="text-white">VAT (EU/UK)</SelectItem>
                    <SelectItem value="gst" className="text-white">GST (Canada/Australia)</SelectItem>
                    <SelectItem value="none" className="text-white">No Tax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Tax Rate (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 8.5"
                  value={taxForm.tax_rate}
                  onChange={(e) => setTaxForm({...taxForm, tax_rate: parseFloat(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
              <input
                type="checkbox"
                checked={taxForm.tax_shipping}
                onChange={(e) => setTaxForm({...taxForm, tax_shipping: e.target.checked})}
                className="w-4 h-4"
              />
              <Label className="text-white">Apply tax to shipping costs</Label>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
              <input
                type="checkbox"
                checked={taxForm.is_active}
                onChange={(e) => setTaxForm({...taxForm, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label className="text-white">Active (apply this tax rule)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!taxForm.region || !taxForm.region_name || taxForm.tax_rate === 0}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {editingTax ? 'Update' : 'Create'} Tax Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}