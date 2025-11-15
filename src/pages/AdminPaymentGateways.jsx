import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { CreditCard, Plus, Edit, Lock, AlertCircle } from 'lucide-react';

export default function AdminPaymentGateways() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [gatewayForm, setGatewayForm] = useState({
    gateway_name: 'stripe',
    display_name: '',
    is_enabled: false,
    is_test_mode: true,
    api_key: '',
    secret_key: '',
    supported_currencies: ['USD'],
    transaction_fee_percentage: 2.9
  });
  const queryClient = useQueryClient();

  const { data: gateways = [] } = useQuery({
    queryKey: ['paymentGateways'],
    queryFn: () => base44.entities.PaymentGatewayConfig.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentGatewayConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['paymentGateways']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentGatewayConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['paymentGateways']);
      setShowDialog(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setGatewayForm({
      gateway_name: 'stripe',
      display_name: '',
      is_enabled: false,
      is_test_mode: true,
      api_key: '',
      secret_key: '',
      supported_currencies: ['USD'],
      transaction_fee_percentage: 2.9
    });
    setEditingGateway(null);
  };

  const handleSubmit = () => {
    const data = {
      ...gatewayForm,
      transaction_fee_percentage: parseFloat(gatewayForm.transaction_fee_percentage) || 0
    };

    if (editingGateway) {
      updateMutation.mutate({ id: editingGateway.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: 'Gateway',
      key: 'display_name',
      render: (_, gateway) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold">{gateway.display_name}</p>
            <p className="text-slate-400 text-xs">{gateway.gateway_name}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Status', 
      key: 'is_enabled', 
      render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Enabled' : 'Disabled'}</Badge> 
    },
    { 
      header: 'Mode', 
      key: 'is_test_mode', 
      render: (val) => <Badge className={val ? 'bg-yellow-500' : 'bg-blue-500'}>{val ? 'Test' : 'Live'}</Badge> 
    },
    { 
      header: 'Fee', 
      key: 'transaction_fee_percentage', 
      render: (val) => <span className="text-slate-300">{val}%</span> 
    },
    { 
      header: 'Currencies', 
      key: 'supported_currencies', 
      render: (val) => (
        <div className="flex gap-1">
          {val?.slice(0, 3).map((currency, i) => (
            <Badge key={i} className="bg-cyan-500 text-xs">{currency}</Badge>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Payment Gateways"
        subtitle="Configure payment processing methods"
        icon={CreditCard}
        badge="SECURE"
        actions={[
          { label: 'Add Gateway', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <Card className="bg-amber-900/20 border-amber-500/30">
        <CardContent className="p-6 flex items-start gap-3">
          <Lock className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-300 font-bold mb-1">Security Notice</p>
            <p className="text-amber-200 text-sm">
              API keys and secrets are encrypted and securely stored. Never share your credentials.
              Always use test mode before going live.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{gateways.length}</p>
            <p className="text-purple-300 text-sm font-bold">Total Gateways</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{gateways.filter(g => g.is_enabled).length}</p>
            <p className="text-green-300 text-sm font-bold">Enabled</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{gateways.filter(g => !g.is_test_mode).length}</p>
            <p className="text-blue-300 text-sm font-bold">Live Mode</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{gateways.filter(g => g.is_test_mode).length}</p>
            <p className="text-yellow-300 text-sm font-bold">Test Mode</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={gateways}
        actions={[
          {
            label: 'Edit',
            icon: Edit,
            onClick: (gateway) => {
              setEditingGateway(gateway);
              setGatewayForm({
                gateway_name: gateway.gateway_name,
                display_name: gateway.display_name,
                is_enabled: gateway.is_enabled,
                is_test_mode: gateway.is_test_mode,
                api_key: gateway.api_key || '',
                secret_key: gateway.secret_key || '',
                supported_currencies: gateway.supported_currencies || ['USD'],
                transaction_fee_percentage: gateway.transaction_fee_percentage || 2.9
              });
              setShowDialog(true);
            }
          }
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Gateway Type *</Label>
                <Select 
                  value={gatewayForm.gateway_name} 
                  onValueChange={(val) => setGatewayForm({ ...gatewayForm, gateway_name: val })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Display Name *</Label>
                <Input
                  value={gatewayForm.display_name}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, display_name: e.target.value })}
                  placeholder="e.g., Credit Card (Stripe)"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">API Key *</Label>
              <Input
                type="password"
                value={gatewayForm.api_key}
                onChange={(e) => setGatewayForm({ ...gatewayForm, api_key: e.target.value })}
                placeholder="pk_test_..."
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Secret Key *</Label>
              <Input
                type="password"
                value={gatewayForm.secret_key}
                onChange={(e) => setGatewayForm({ ...gatewayForm, secret_key: e.target.value })}
                placeholder="sk_test_..."
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Transaction Fee (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={gatewayForm.transaction_fee_percentage}
                onChange={(e) => setGatewayForm({ ...gatewayForm, transaction_fee_percentage: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={gatewayForm.is_enabled}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, is_enabled: e.target.checked })}
                />
                <Label className="text-white">Enabled</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={gatewayForm.is_test_mode}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, is_test_mode: e.target.checked })}
                />
                <Label className="text-white">Test Mode</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="flex-1 border-slate-600"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
                {editingGateway ? 'Update Gateway' : 'Add Gateway'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}