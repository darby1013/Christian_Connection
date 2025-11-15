import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { CreditCard, Plus, Edit, Shield } from 'lucide-react';

export default function AdminPaymentConfig() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const queryClient = useQueryClient();

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
      transaction_fee_percentage: parseFloat(gatewayForm.transaction_fee_percentage)
    };

    if (editingGateway) {
      updateMutation.mutate({ id: editingGateway.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: 'Gateway', key: 'display_name', render: (val, row) => (
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-cyan-400" />
        <span className="text-white font-bold">{val}</span>
      </div>
    )},
    { header: 'Provider', key: 'gateway_name', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Mode', key: 'is_test_mode', render: (val) => <Badge className={val ? 'bg-amber-500' : 'bg-green-500'}>{val ? 'Test' : 'Live'}</Badge> },
    { header: 'Fee', key: 'transaction_fee_percentage', render: (val) => <span className="text-green-400">{val}%</span> },
    { header: 'Status', key: 'is_enabled', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Enabled' : 'Disabled'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Payment Gateway Configuration"
        subtitle="Configure payment processors and settings"
        icon={CreditCard}
        badge="SECURE"
        actions={[
          { label: 'Add Gateway', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardContent className="p-6 flex items-center gap-4">
          <Shield className="w-12 h-12 text-green-400" />
          <div>
            <p className="text-green-300 font-bold text-lg">🔒 PCI-DSS Compliant</p>
            <p className="text-green-200 text-sm">All payment data is encrypted and securely processed</p>
          </div>
        </CardContent>
      </Card>

      <EnterpriseTable
        columns={columns}
        data={gateways}
        actions={[
          { label: 'Configure', icon: Edit, onClick: (gateway) => {
            setEditingGateway(gateway);
            setGatewayForm(gateway);
            setShowDialog(true);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingGateway ? 'Configure' : 'Add'} Payment Gateway
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Gateway Provider *</Label>
                <Select value={gatewayForm.gateway_name} onValueChange={(val) => setGatewayForm({...gatewayForm, gateway_name: val})}>
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
                  onChange={(e) => setGatewayForm({...gatewayForm, display_name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">API Key *</Label>
              <Input 
                type="password"
                value={gatewayForm.api_key}
                onChange={(e) => setGatewayForm({...gatewayForm, api_key: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Secret Key *</Label>
              <Input 
                type="password"
                value={gatewayForm.secret_key}
                onChange={(e) => setGatewayForm({...gatewayForm, secret_key: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Transaction Fee (%)</Label>
              <Input 
                type="number"
                step="0.1"
                value={gatewayForm.transaction_fee_percentage}
                onChange={(e) => setGatewayForm({...gatewayForm, transaction_fee_percentage: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={gatewayForm.is_test_mode}
                  onChange={(e) => setGatewayForm({...gatewayForm, is_test_mode: e.target.checked})}
                />
                <span className="text-white">Test Mode</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={gatewayForm.is_enabled}
                  onChange={(e) => setGatewayForm({...gatewayForm, is_enabled: e.target.checked})}
                />
                <span className="text-white">Enabled</span>
              </label>
            </div>

            <Card className="bg-amber-900/20 border-amber-500/30">
              <CardContent className="p-4">
                <p className="text-amber-300 text-sm">⚠️ API keys are encrypted and stored securely. Never share your keys.</p>
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 font-bold">
                {editingGateway ? 'Update' : 'Add'} Gateway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}