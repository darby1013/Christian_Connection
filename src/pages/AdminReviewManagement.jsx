import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Star, CheckCircle, X, MessageSquare } from 'lucide-react';

export default function AdminReviewManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => base44.entities.ProductReview.list('-created_date'),
    refetchInterval: 5000,
    initialData: []
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductReview.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReviews']);
      setShowDialog(false);
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductReview.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReviews']);
    }
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.approved).length,
    approved: reviews.filter(r => r.approved).length,
    avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  };

  const columns = [
    { header: 'Product ID', key: 'product_id', render: (val) => <span className="text-cyan-400 font-mono">{val.slice(0, 8)}</span> },
    { header: 'Customer', key: 'user_name', render: (val) => <span className="text-white font-bold">{val}</span> },
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
    { 
      header: 'Status', 
      key: 'approved', 
      render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-yellow-500'}>{val ? 'Approved' : 'Pending'}</Badge>
    },
    { header: 'Verified', key: 'verified_purchase', render: (val) => val ? <CheckCircle className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-slate-600" /> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Review Management"
        subtitle="Moderate customer reviews and ratings"
        icon={Star}
        badge="MODERATION"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.total}</p>
            <p className="text-purple-300 text-sm font-bold">Total Reviews</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.pending}</p>
            <p className="text-yellow-300 text-sm font-bold">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.approved}</p>
            <p className="text-green-300 text-sm font-bold">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{stats.avgRating.toFixed(1)}</p>
            <p className="text-amber-300 text-sm font-bold">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={reviews}
        onRowClick={(review) => {
          setSelectedReview(review);
          setShowDialog(true);
        }}
        actions={[
          {
            label: 'Approve',
            icon: CheckCircle,
            onClick: (review) => updateReviewMutation.mutate({ id: review.id, data: { approved: true } })
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Customer</p>
                <p className="text-white font-bold text-lg">{selectedReview.user_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Rating</p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-6 h-6 ${i < selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Review</p>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-white">{selectedReview.review_text}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => updateReviewMutation.mutate({ id: selectedReview.id, data: { approved: true } })}
                  className="flex-1 bg-green-600 font-bold"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    if (confirm('Delete this review?')) {
                      deleteReviewMutation.mutate(selectedReview.id);
                      setShowDialog(false);
                    }
                  }}
                  variant="destructive"
                  className="flex-1 font-bold"
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}