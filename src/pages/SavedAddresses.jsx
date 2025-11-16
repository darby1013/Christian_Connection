import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SavedAddresses() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    is_default: false
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setAddressForm(prev => ({ ...prev, full_name: currentUser.full_name }));
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: addresses = [] } = useQuery({
    queryKey: ['savedAddresses', user?.id],
    queryFn: () => base44.entities.CustomerAddress.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerAddress.create({ ...data, user_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedAddresses']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomerAddress.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedAddresses']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomerAddress.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['savedAddresses'])
  });

  const resetForm = () => {
    setAddressForm({
      full_name: user?.full_name || '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      phone: '',
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleSubmit = () => {
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createMutation.mutate(addressForm);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CustomerAccount')}>
              <Button variant="outline" className="border-slate-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-black text-white">Saved Addresses</h1>
              <p className="text-slate-400 font-semibold">{addresses.length} addresses</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <MapPin className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-bold text-xl mb-2">No saved addresses</p>
              <p className="text-slate-400 mb-6">Add an address for faster checkout</p>
              <Button onClick={() => setShowDialog(true)} className="bg-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map(address => (
              <Card key={address.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-cyan-400" />
                      {address.is_default && <Badge className="bg-cyan-500">Default</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => {
                          setEditingAddress(address);
                          setAddressForm(address);
                          setShowDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Delete this address?')) deleteMutation.mutate(address.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-slate-300">
                    <p className="font-bold text-white mb-1">{address.full_name}</p>
                    <p>{address.address_line_1}</p>
                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                    <p>{address.city}, {address.state} {address.postal_code}</p>
                    <p className="text-slate-400 mt-2">{address.phone}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl font-black">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Full Name *</Label>
                <Input
                  value={addressForm.full_name}
                  onChange={(e) => setAddressForm({...addressForm, full_name: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Address Line 1 *</Label>
                <Input
                  value={addressForm.address_line_1}
                  onChange={(e) => setAddressForm({...addressForm, address_line_1: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Address Line 2</Label>
                <Input
                  value={addressForm.address_line_2}
                  onChange={(e) => setAddressForm({...addressForm, address_line_2: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">City *</Label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">State *</Label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Postal Code *</Label>
                  <Input
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({...addressForm, postal_code: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white">Phone *</Label>
                <Input
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})}
                />
                <Label className="text-white">Set as default address</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                  {editingAddress ? 'Update' : 'Add'} Address
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}