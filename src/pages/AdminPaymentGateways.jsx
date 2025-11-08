import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { CreditCard, Plus, Settings, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminPaymentGateways() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const queryClient = useQueryClient();

  const [gatewayForm, setGatewayForm] = useState({
    name: "",
    type: "stripe",
    is_enabled: false,
    is_live_mode: false,
    api_key: "",
    secret_key: "",
    webhook_url: "",
    supported_currencies: ["USD"],
    transaction_fee: 2.9
  });

  const { data: gateways = [] } = useQuery({
    queryKey: ['adminPaymentGateways'],
    queryFn: () => base44.entities.PaymentGateway.list(),
    initialData: [],
  });

  const createGatewayMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentGateway.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentGateways'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updateGatewayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentGateway.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentGateways'] });
      setEditingGateway(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setGatewayForm({
      name: "",
      type: "stripe",
      is_enabled: false,
      is_live_mode: false,
      api_key: "",
      secret_key: "",
      webhook_url: "",
      supported_currencies: ["USD"],
      transaction_fee: 2.9
    });
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setGatewayForm(gateway);
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (editingGateway) {
      updateGatewayMutation.mutate({ id: editingGateway.id, data: gatewayForm });
    } else {
      createGatewayMutation.mutate(gatewayForm);
    }
  };

  const enabledGateways = gateways.filter(g => g.is_enabled);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Total Gateways</p>
                <p className="text-3xl font-black text-white mt-1">{gateways.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Enabled</p>
                <p className="text-3xl font-black text-white mt-1">{enabledGateways.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Live Mode</p>
                <p className="text-3xl font-black text-white mt-1">
                  {gateways.filter(g => g.is_live_mode).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gateways */}
      <Card className="bg-[#1a1f3a] border-0">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-white font-black text-xl flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            Payment Gateways
          </CardTitle>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold" onClick={() => { resetForm(); setEditingGateway(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Gateway
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  {editingGateway ? 'Edit Gateway' : 'Add Payment Gateway'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold">Gateway Name</Label>
                    <Input
                      value={gatewayForm.name}
                      onChange={(e) => setGatewayForm({...gatewayForm, name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      placeholder="e.g., Stripe Payment"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold">Gateway Type</Label>
                    <Select value={gatewayForm.type} onValueChange={(value) => setGatewayForm({...gatewayForm, type: value})}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="stripe" className="text-white">Stripe</SelectItem>
                        <SelectItem value="paypal" className="text-white">PayPal</SelectItem>
                        <SelectItem value="square" className="text-white">Square</SelectItem>
                        <SelectItem value="authorize_net" className="text-white">Authorize.Net</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-white font-bold">API Key (Public)</Label>
                  <Input
                    value={gatewayForm.api_key}
                    onChange={(e) => setGatewayForm({...gatewayForm, api_key: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                    placeholder="pk_test_..."
                  />
                </div>

                <div>
                  <Label className="text-white font-bold">Secret Key</Label>
                  <Input
                    type="password"
                    value={gatewayForm.secret_key}
                    onChange={(e) => setGatewayForm({...gatewayForm, secret_key: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                    placeholder="sk_test_..."
                  />
                </div>

                <div>
                  <Label className="text-white font-bold">Webhook URL</Label>
                  <Input
                    value={gatewayForm.webhook_url}
                    onChange={(e) => setGatewayForm({...gatewayForm, webhook_url: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                    placeholder="https://yoursite.com/webhook/stripe"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold">Transaction Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={gatewayForm.transaction_fee}
                    onChange={(e) => setGatewayForm({...gatewayForm, transaction_fee: parseFloat(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <Label className="text-white font-bold">Enable Gateway</Label>
                    <Switch
                      checked={gatewayForm.is_enabled}
                      onCheckedChange={(checked) => setGatewayForm({...gatewayForm, is_enabled: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <Label className="text-white font-bold">Live Mode</Label>
                    <Switch
                      checked={gatewayForm.is_live_mode}
                      onCheckedChange={(checked) => setGatewayForm({...gatewayForm, is_live_mode: checked})}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
                  disabled={createGatewayMutation.isPending || updateGatewayMutation.isPending}
                >
                  {editingGateway ? 'Update Gateway' : 'Add Gateway'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {gateways.map((gateway) => (
              <Card key={gateway.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{gateway.name}</h3>
                        <p className="text-slate-400 text-sm capitalize">{gateway.type}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={gateway.is_enabled ? 'bg-green-500' : 'bg-gray-500'}>
                            {gateway.is_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge className={gateway.is_live_mode ? 'bg-blue-500' : 'bg-orange-500'}>
                            {gateway.is_live_mode ? 'Live' : 'Test'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-cyan-400">{gateway.transaction_fee}%</p>
                      <p className="text-xs text-slate-400 mb-3">Transaction Fee</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(gateway)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}