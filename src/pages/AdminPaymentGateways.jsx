
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard, DollarSign, CheckCircle, AlertCircle, Plus,
  Settings as SettingsIcon, TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminPaymentGateways() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  
  const [gatewayForm, setGatewayForm] = useState({
    name: '',
    type: 'stripe',
    is_enabled: false,
    is_live_mode: false,
    api_key: '',
    secret_key: '',
    webhook_url: '',
    supported_currencies: ['USD'],
    transaction_fee: 2.9
  });

  const queryClient = useQueryClient();

  const { data: gateways = [] } = useQuery({
    queryKey: ['paymentGateways'],
    queryFn: () => base44.entities.PaymentGateway.list(),
    initialData: [],
  });

  const createGatewayMutation = useMutation({
    mutationFn: (gatewayData) => base44.entities.PaymentGateway.create(gatewayData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentGateways'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateGatewayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentGateway.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentGateways'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setGatewayForm({
      name: '',
      type: 'stripe',
      is_enabled: false,
      is_live_mode: false,
      api_key: '',
      secret_key: '',
      webhook_url: '',
      supported_currencies: ['USD'],
      transaction_fee: 2.9
    });
    setEditingGateway(null);
  };

  const handleSubmit = () => {
    if (editingGateway) {
      updateGatewayMutation.mutate({ id: editingGateway.id, data: gatewayForm });
    } else {
      createGatewayMutation.mutate(gatewayForm);
    }
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setGatewayForm(gateway);
    setDialogOpen(true);
  };

  const enabledGateways = gateways.filter(g => g.is_enabled);
  const liveGateways = gateways.filter(g => g.is_live_mode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Payment Gateways</h2>
          <p className="text-slate-400 font-semibold">Configure payment processors for subscriptions and donations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 font-bold" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Gateway
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure a payment processor for your platform
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Gateway Name *</Label>
                  <Input
                    placeholder="e.g., Stripe Production"
                    value={gatewayForm.name}
                    onChange={(e) => setGatewayForm({...gatewayForm, name: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Type *</Label>
                  <Select value={gatewayForm.type} onValueChange={(value) => setGatewayForm({...gatewayForm, type: value})}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="stripe" className="text-white">Stripe</SelectItem>
                      <SelectItem value="paypal" className="text-white">PayPal</SelectItem>
                      <SelectItem value="square" className="text-white">Square</SelectItem>
                      <SelectItem value="cashapp" className="text-white">CashApp</SelectItem>
                      <SelectItem value="authorize_net" className="text-white">Authorize.net</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Public API Key</Label>
                  <Input
                    placeholder="pk_live_..."
                    value={gatewayForm.api_key}
                    onChange={(e) => setGatewayForm({...gatewayForm, api_key: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Secret Key</Label>
                  <Input
                    type="password"
                    placeholder="sk_live_..."
                    value={gatewayForm.secret_key}
                    onChange={(e) => setGatewayForm({...gatewayForm, secret_key: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Webhook URL</Label>
                <Input
                  placeholder="https://yoursite.com/webhooks/payment"
                  value={gatewayForm.webhook_url}
                  onChange={(e) => setGatewayForm({...gatewayForm, webhook_url: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Transaction Fee (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={gatewayForm.transaction_fee}
                  onChange={(e) => setGatewayForm({...gatewayForm, transaction_fee: parseFloat(e.target.value)})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <Label className="text-white font-bold">Enable Gateway</Label>
                  <p className="text-slate-400 text-xs">Allow this gateway to process payments</p>
                </div>
                <Switch
                  checked={gatewayForm.is_enabled}
                  onCheckedChange={(checked) => setGatewayForm({...gatewayForm, is_enabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <Label className="text-white font-bold">Live Mode</Label>
                  <p className="text-slate-400 text-xs">Use live API keys (not test mode)</p>
                </div>
                <Switch
                  checked={gatewayForm.is_live_mode}
                  onCheckedChange={(checked) => setGatewayForm({...gatewayForm, is_live_mode: checked})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="bg-cyan-500 hover:bg-cyan-600"
                disabled={createGatewayMutation.isPending || updateGatewayMutation.isPending}
              >
                {editingGateway ? 'Update Gateway' : 'Add Gateway'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{gateways.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{gateways.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Gateways</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{enabledGateways.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{enabledGateways.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Enabled</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{liveGateways.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{liveGateways.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Live Mode</p>
          </CardContent>
        </Card>
      </div>

      {/* Gateways List */}
      <div className="grid md:grid-cols-2 gap-4">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  {gateway.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {gateway.is_enabled && <Badge className="bg-green-500 text-xs">Enabled</Badge>}
                  {gateway.is_live_mode && <Badge className="bg-blue-500 text-xs">Live</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-semibold capitalize">{gateway.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Transaction Fee</span>
                  <span className="text-white font-semibold">{gateway.transaction_fee}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Currencies</span>
                  <span className="text-white font-semibold">{gateway.supported_currencies?.join(', ')}</span>
                </div>
                <Button
                  onClick={() => handleEdit(gateway)}
                  variant="outline"
                  className="w-full border-slate-700 text-slate-300"
                  size="sm"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gateways.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Payment Gateways</h3>
            <p className="text-slate-400 mb-6">Add a payment gateway to start accepting payments</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Gateway
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
