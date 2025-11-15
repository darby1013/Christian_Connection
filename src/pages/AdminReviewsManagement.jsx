import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Star, CheckCircle, X, MessageSquare } from 'lucide-react';

export default function AdminReviewsManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => base44.entities.ProductReview.list('-created_date'),
    refetchInterval: 5000,
    initialData: []
  });

  const approveReviewMutation = useMutation({
    mutationFn: ({ id, approved }) => base44.entities.ProductReview.update(id, { is_approved: approved }),
    onSuccess: () => queryClient.invalidateQueries(['adminReviews'])
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductReview.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['adminReviews'])
  });

  const filteredReviews = reviews.filter(r => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'approved') return r.is_approved;
    if (statusFilter === 'pending') return !r.is_approved;
    return true;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.is_approved).length,
    pending: reviews.filter(r => !r.is_approved).length,
    avgRating: (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / (reviews.length || 1)).toFixed(1)
  };

  const columns = [
    { header: 'Product', key: 'product_name', render: (val) => <span className="text-white font-bold">{val || 'N/A'}</span> },
    { header: 'Customer', key: 'user_name', render: (val) => <span className="text-slate-300">{val}</span> },
    { 
      header: 'Rating', 
      key: 'rating', 
      render: (val) => (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < val ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
          ))}
        </div>
      )
    },
    { header: 'Review', key: 'review_text', render: (val) => <span className="text-slate-300 line-clamp-1">{val}</span> },
    { header: 'Status', key: 'is_approved', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-yellow-500'}>{val ? 'Approved' : 'Pending'}</Badge> },
    { header: 'Date', key: 'created_date', render: (val) => <span className="text-slate-400 text-sm">{new Date(val).toLocaleDateString()}</span> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Reviews Management"
        subtitle="Moderate customer product reviews"
        icon={MessageSquare}
        badge="LIVE"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.total}</p>
            <p className="text-blue-300 text-sm font-bold">Total Reviews</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.approved}</p>
            <p className="text-green-300 text-sm font-bold">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.pending}</p>
            <p className="text-yellow-300 text-sm font-bold">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.avgRating}</p>
            <p className="text-amber-300 text-sm font-bold">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EnterpriseTable
            columns={columns}
            data={filteredReviews}
            actions={[
              {
                label: 'Approve',
                icon: CheckCircle,
                onClick: (review) => approveReviewMutation.mutate({ id: review.id, approved: true })
              },
              {
                label: 'Delete',
                icon: X,
                onClick: (review) => {
                  if (confirm('Delete this review?')) deleteReviewMutation.mutate(review.id);
                }
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}