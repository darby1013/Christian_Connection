import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Gift, Plus, CreditCard, DollarSign, Users, TrendingUp,
  Copy, Mail, Calendar, CheckCircle, AlertCircle, Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminGiftCards() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [giftCardForm, setGiftCardForm] = useState({
    card_code: '',
    initial_value: 50,
    recipient_email: '',
    recipient_name: '',
    personal_message: '',
    expiration_date: '',
    is_physical: false,
    status: 'active'
  });

  const queryClient = useQueryClient();

  const { data: giftCards = [] } = useQuery({
    queryKey: ['giftCards'],
    queryFn: () => base44.entities.GiftCard.list('-created_date'),
    initialData: [],
  });

  const createGiftCardMutation = useMutation({
    mutationFn: (data) => base44.entities.GiftCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftCards'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const generateCode = () => {
    const code = 'GC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setGiftCardForm({...giftCardForm, card_code: code});
  };

  const handleSubmit = () => {
    const data = {
      ...giftCardForm,
      current_balance: giftCardForm.initial_value,
      times_used: 0
    };
    createGiftCardMutation.mutate(data);
  };

  const resetForm = () => {
    setGiftCardForm({
      card_code: '',
      initial_value: 50,
      recipient_email: '',
      recipient_name: '',
      personal_message: '',
      expiration_date: '',
      is_physical: false,
      status: 'active'
    });
  };

  const totalValue = giftCards.reduce((sum, c) => sum + c.current_balance, 0);
  const activeCards = giftCards.filter(c => c.status === 'active');
  const redeemedCards = giftCards.filter(c => c.status === 'redeemed');

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge className="bg-amber-500">Pending</Badge>,
      active: <Badge className="bg-green-500">Active</Badge>,
      redeemed: <Badge className="bg-cyan-500">Redeemed</Badge>,
      expired: <Badge className="bg-red-500">Expired</Badge>,
      cancelled: <Badge className="bg-slate-500">Cancelled</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Gift Card Manager</h2>
          <p className="text-slate-400 font-semibold">Issue and track digital gift cards</p>
        </div>
        <Button onClick={() => { generateCode(); setDialogOpen(true); }} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Issue Gift Card
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{giftCards.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{giftCards.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Cards</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalValue.toFixed(2)}</p>
            <p className="text-slate-400 text-sm font-semibold">Outstanding Balance</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{activeCards.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Cards</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{redeemedCards.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Redeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* Gift Cards List */}
      <div className="grid gap-3">
        {giftCards.map((card) => (
          <Card key={card.id} className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-black text-xl">{card.card_code}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(card.card_code);
                            alert('Code copied!');
                          }}
                          className="text-slate-400 hover:text-white h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {card.recipient_name && (
                        <p className="text-slate-400 text-sm mb-2">
                          To: {card.recipient_name} ({card.recipient_email})
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(card.status)}
                        <Badge className="bg-green-500 text-lg font-black">
                          ${card.current_balance.toFixed(2)} / ${card.initial_value.toFixed(2)}
                        </Badge>
                        {card.times_used > 0 && (
                          <Badge className="bg-cyan-500">Used {card.times_used}x</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {card.expiration_date && (
                    <p className="text-amber-400 text-sm mt-2">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Expires: {format(new Date(card.expiration_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Gift Card Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black">Issue New Gift Card</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Gift Card Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={giftCardForm.card_code}
                    onChange={(e) => setGiftCardForm({...giftCardForm, card_code: e.target.value.toUpperCase()})}
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                  />
                  <Button onClick={generateCode} className="bg-purple-500 hover:bg-purple-600">
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-white mb-2 block">Card Value ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={giftCardForm.initial_value}
                  onChange={(e) => setGiftCardForm({...giftCardForm, initial_value: parseFloat(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Recipient Name</Label>
                <Input
                  placeholder="John Doe"
                  value={giftCardForm.recipient_name}
                  onChange={(e) => setGiftCardForm({...giftCardForm, recipient_name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={giftCardForm.recipient_email}
                  onChange={(e) => setGiftCardForm({...giftCardForm, recipient_email: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Personal Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message..."
                value={giftCardForm.personal_message}
                onChange={(e) => setGiftCardForm({...giftCardForm, personal_message: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-20"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Expiration Date (Optional)</Label>
              <Input
                type="date"
                value={giftCardForm.expiration_date ? format(new Date(giftCardForm.expiration_date), 'yyyy-MM-dd') : ''}
                onChange={(e) => setGiftCardForm({...giftCardForm, expiration_date: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!giftCardForm.card_code || giftCardForm.initial_value === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Issue Gift Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}