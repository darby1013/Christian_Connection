import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Gift, Plus, Edit, DollarSign } from 'lucide-react';

export default function AdminGiftCardManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm, setCardForm] = useState({
    code: '',
    initial_balance: '',
    current_balance: '',
    recipient_email: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: giftCards = [] } = useQuery({
    queryKey: ['giftCards'],
    queryFn: () => base44.entities.GiftCard.list('-created_date'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GiftCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['giftCards']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GiftCard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['giftCards']);
      setShowDialog(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setCardForm({
      code: '',
      initial_balance: '',
      current_balance: '',
      recipient_email: '',
      is_active: true
    });
    setEditingCard(null);
  };

  const generateCode = () => {
    const code = 'GC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setCardForm({ ...cardForm, code });
  };

  const handleSubmit = () => {
    const data = {
      ...cardForm,
      initial_balance: parseFloat(cardForm.initial_balance),
      current_balance: editingCard ? parseFloat(cardForm.current_balance) : parseFloat(cardForm.initial_balance)
    };
    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const stats = {
    total: giftCards.length,
    active: giftCards.filter(c => c.is_active).length,
    value: giftCards.reduce((sum, c) => sum + (c.current_balance || 0), 0),
    used: giftCards.reduce((sum, c) => sum + ((c.initial_balance || 0) - (c.current_balance || 0)), 0)
  };

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="text-cyan-400 font-black">{val}</span> },
    { header: 'Initial', key: 'initial_balance', render: (val) => <span className="text-green-400">${val?.toFixed(2)}</span> },
    { header: 'Current', key: 'current_balance', render: (val) => <span className="text-white font-bold">${val?.toFixed(2)}</span> },
    { header: 'Recipient', key: 'recipient_email', render: (val) => <span className="text-slate-300">{val || 'N/A'}</span> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Gift Card Manager"
        subtitle="Create and manage digital gift cards"
        icon={Gift}
        badge="ENTERPRISE"
        actions={[
          { label: 'Create Gift Card', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.total}</p>
            <p className="text-purple-300 text-sm font-bold">Total Cards</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.active}</p>
            <p className="text-green-300 text-sm font-bold">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">${stats.value.toFixed(0)}</p>
            <p className="text-cyan-300 text-sm font-bold">Total Value</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">${stats.used.toFixed(0)}</p>
            <p className="text-amber-300 text-sm font-bold">Redeemed</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={giftCards}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (card) => {
            setEditingCard(card);
            setCardForm({
              code: card.code,
              initial_balance: card.initial_balance?.toString(),
              current_balance: card.current_balance?.toString(),
              recipient_email: card.recipient_email || '',
              is_active: card.is_active
            });
            setShowDialog(true);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingCard ? 'Edit Gift Card' : 'Create Gift Card'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Gift Card Code *</Label>
              <div className="flex gap-2">
                <Input
                  value={cardForm.code}
                  onChange={(e) => setCardForm({...cardForm, code: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white flex-1"
                />
                <Button onClick={generateCode} className="bg-purple-600">
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Initial Balance ($) *</Label>
                <Input
                  type="number"
                  value={cardForm.initial_balance}
                  onChange={(e) => setCardForm({...cardForm, initial_balance: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              {editingCard && (
                <div>
                  <Label className="text-white">Current Balance ($)</Label>
                  <Input
                    type="number"
                    value={cardForm.current_balance}
                    onChange={(e) => setCardForm({...cardForm, current_balance: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              )}
            </div>
            <div>
              <Label className="text-white">Recipient Email (Optional)</Label>
              <Input
                type="email"
                value={cardForm.recipient_email}
                onChange={(e) => setCardForm({...cardForm, recipient_email: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={cardForm.is_active}
                onChange={(e) => setCardForm({...cardForm, is_active: e.target.checked})}
              />
              <Label className="text-white">Active</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
                {editingCard ? 'Update' : 'Create'} Gift Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}