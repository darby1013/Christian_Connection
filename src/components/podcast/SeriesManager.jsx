import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Edit, Trash2, Folder, Film, DollarSign, Crown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SeriesManager({ user }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [seriesForm, setSeriesForm] = useState({
    series_title: '',
    description: '',
    cover_image: '',
    category: '',
    tags: [],
    subscription_enabled: false,
    series_subscription_price: 0
  });

  const queryClient = useQueryClient();

  const { data: series = [] } = useQuery({
    queryKey: ['podcastSeries'],
    queryFn: () => base44.entities.PodcastSeries.list('-created_date'),
    initialData: [],
  });

  const { data: podcasts = [] } = useQuery({
    queryKey: ['allPodcasts'],
    queryFn: () => base44.entities.Podcast.list(),
    initialData: [],
  });

  const createSeriesMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastSeries.create({
      ...data,
      creator_id: user.id,
      creator_name: user.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastSeries'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PodcastSeries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastSeries'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: (id) => base44.entities.PodcastSeries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastSeries'] });
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSeriesForm(prev => ({ ...prev, cover_image: file_url }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const handleSubmit = () => {
    if (editingSeries) {
      updateSeriesMutation.mutate({ id: editingSeries.id, data: seriesForm });
    } else {
      createSeriesMutation.mutate(seriesForm);
    }
  };

  const handleEdit = (s) => {
    setEditingSeries(s);
    setSeriesForm(s);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this series? Episodes will remain but be unlinked.')) {
      deleteSeriesMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setSeriesForm({
      series_title: '',
      description: '',
      cover_image: '',
      category: '',
      tags: [],
      subscription_enabled: false,
      series_subscription_price: 0
    });
    setEditingSeries(null);
  };

  const getSeriesStats = (seriesId) => {
    const seriesEpisodes = podcasts.filter(p => p.series_id === seriesId);
    const totalPlays = seriesEpisodes.reduce((sum, p) => sum + (p.plays || 0), 0);
    const seasons = new Set(seriesEpisodes.map(p => p.season)).size;
    
    return {
      episodes: seriesEpisodes.length,
      seasons,
      totalPlays
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-2xl mb-2">Podcast Series</h3>
          <p className="text-slate-400 font-semibold">Organize episodes into multi-season series</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              New Series
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingSeries ? 'Edit Series' : 'Create New Series'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Series Title *</Label>
                <Input
                  placeholder="e.g., Faith & Life Podcast"
                  value={seriesForm.series_title}
                  onChange={(e) => setSeriesForm({...seriesForm, series_title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  placeholder="Describe your podcast series"
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({...seriesForm, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Cover Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {seriesForm.cover_image && (
                  <img src={seriesForm.cover_image} alt="Cover" className="mt-2 w-32 h-32 object-cover rounded" />
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Category</Label>
                <Input
                  placeholder="e.g., Faith, Lifestyle"
                  value={seriesForm.category}
                  onChange={(e) => setSeriesForm({...seriesForm, category: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={seriesForm.subscription_enabled}
                    onChange={(e) => setSeriesForm({...seriesForm, subscription_enabled: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label className="text-white">Enable Series Subscription</Label>
                </div>
                {seriesForm.subscription_enabled && (
                  <div>
                    <Label className="text-white mb-2 block">Monthly Subscription Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={seriesForm.series_subscription_price}
                      onChange={(e) => setSeriesForm({...seriesForm, series_subscription_price: parseFloat(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!seriesForm.series_title} className="bg-cyan-500 hover:bg-cyan-600">
                {editingSeries ? 'Update' : 'Create'} Series
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {series.map((s) => {
          const stats = getSeriesStats(s.id);
          return (
            <Card key={s.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                    {s.cover_image ? (
                      <img src={s.cover_image} alt={s.series_title} className="w-full h-full object-cover" />
                    ) : (
                      <Folder className="w-10 h-10 text-white m-auto mt-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg line-clamp-2 mb-1">{s.series_title}</h3>
                    <p className="text-slate-400 text-xs line-clamp-2">{s.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className="bg-purple-500">
                    <Film className="w-3 h-3 mr-1" />
                    {stats.episodes} Episodes
                  </Badge>
                  <Badge className="bg-cyan-500">
                    {stats.seasons} Seasons
                  </Badge>
                  {s.subscription_enabled && (
                    <Badge className="bg-amber-500">
                      <Crown className="w-3 h-3 mr-1" />
                      ${s.series_subscription_price}/mo
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleEdit(s)} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(s.id)}
                    className="border-red-500/30 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {series.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Folder className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Series Yet</h3>
            <p className="text-slate-400 mb-6">Create a series to organize your podcast episodes</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Series
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}