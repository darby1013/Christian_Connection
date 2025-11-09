import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Star, Settings, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function BadgeShowcase({ userId, isOwnProfile = false }) {
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState([]);
  
  const queryClient = useQueryClient();

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', userId],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: userId }, '-earned_date'),
    initialData: [],
    enabled: !!userId,
  });

  const { data: showcase } = useQuery({
    queryKey: ['badgeShowcase', userId],
    queryFn: async () => {
      const result = await base44.entities.UserBadgeShowcase.filter({ user_id: userId });
      return result[0];
    },
    enabled: !!userId,
  });

  const updateShowcaseMutation = useMutation({
    mutationFn: async (badgeIds) => {
      if (showcase) {
        return base44.entities.UserBadgeShowcase.update(showcase.id, {
          showcased_badges: badgeIds
        });
      } else {
        return base44.entities.UserBadgeShowcase.create({
          user_id: userId,
          showcased_badges: badgeIds
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badgeShowcase'] });
      setManageDialogOpen(false);
    },
  });

  const showcasedBadgeIds = showcase?.showcased_badges || [];
  const showcasedBadges = userBadges.filter(b => showcasedBadgeIds.includes(b.id));
  const maxSlots = showcase?.max_showcase_slots || 6;

  const handleToggleBadge = (badgeId) => {
    if (selectedBadges.includes(badgeId)) {
      setSelectedBadges(selectedBadges.filter(id => id !== badgeId));
    } else if (selectedBadges.length < maxSlots) {
      setSelectedBadges([...selectedBadges, badgeId]);
    }
  };

  const handleSaveShowcase = () => {
    updateShowcaseMutation.mutate(selectedBadges);
  };

  const getBadgeColor = (color) => {
    const colors = {
      blue: "from-blue-500 to-cyan-500",
      purple: "from-purple-500 to-pink-500",
      green: "from-green-500 to-emerald-500",
      amber: "from-amber-500 to-orange-500",
      red: "from-red-500 to-rose-500",
      pink: "from-pink-500 to-fuchsia-500"
    };
    return colors[color] || colors.blue;
  };

  if (showcasedBadges.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Badge Showcase
          </h3>
          {isOwnProfile && (
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-700"
                  onClick={() => setSelectedBadges(showcasedBadgeIds)}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Manage
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Manage Badge Showcase</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Select up to {maxSlots} badges to display on your profile
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-slate-400 text-sm mb-4">
                    Selected: {selectedBadges.length} / {maxSlots}
                  </p>
                  <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {userBadges.map((badge) => {
                      const isSelected = selectedBadges.includes(badge.id);
                      return (
                        <button
                          key={badge.id}
                          onClick={() => handleToggleBadge(badge.id)}
                          disabled={!isSelected && selectedBadges.length >= maxSlots}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-500/20'
                              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                          } ${!isSelected && selectedBadges.length >= maxSlots ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${getBadgeColor(badge.badge_color)} flex items-center justify-center`}>
                            <span className="text-2xl">{badge.badge_icon}</span>
                          </div>
                          <p className="text-white text-sm font-semibold">{badge.badge_name}</p>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                              <Star className="w-3 h-3 text-white fill-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setManageDialogOpen(false)}
                    className="border-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveShowcase}
                    disabled={updateShowcaseMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    {updateShowcaseMutation.isPending ? 'Saving...' : 'Save Showcase'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {showcasedBadges.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {showcasedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br ${getBadgeColor(badge.badge_color)} flex items-center justify-center hover:scale-110 transition-transform cursor-pointer`}>
                  <span className="text-3xl">{badge.badge_icon}</span>
                </div>
                <p className="text-white text-xs font-semibold truncate">{badge.badge_name}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-3">No badges showcased yet</p>
            {isOwnProfile && (
              <Button
                size="sm"
                onClick={() => setManageDialogOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Badges
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}