import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Star, Trophy, Pin, PinOff, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BadgeShowcase({ userId, isOwnProfile }) {
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => base44.entities.User.filter({ id: userId }).then(res => res[0]),
    enabled: !!userId,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', userId],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: userId }),
    enabled: !!userId,
    initialData: [],
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['allBadges'],
    queryFn: () => base44.entities.Badge.list(),
    initialData: [],
  });

  const updateShowcaseMutation = useMutation({
    mutationFn: (badgeIds) => base44.auth.updateMe({ showcased_badges: badgeIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setManageDialogOpen(false);
    },
  });

  const earnedBadges = userBadges.map(ub => {
    const badge = allBadges.find(b => b.id === ub.badge_id);
    return { ...badge, userBadgeId: ub.id, earned_date: ub.earned_date };
  }).filter(b => b.id);

  const showcasedBadgeIds = user?.showcased_badges || [];
  const showcasedBadges = earnedBadges.filter(b => showcasedBadgeIds.includes(b.id));
  const availableToShowcase = earnedBadges.filter(b => !showcasedBadgeIds.includes(b.id));

  const toggleBadgeShowcase = (badgeId) => {
    const current = showcasedBadgeIds;
    let updated;
    
    if (current.includes(badgeId)) {
      updated = current.filter(id => id !== badgeId);
    } else {
      if (current.length >= 5) {
        alert('Maximum 5 badges can be showcased');
        return;
      }
      updated = [...current, badgeId];
    }
    
    updateShowcaseMutation.mutate(updated);
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'from-slate-600 to-slate-700',
      rare: 'from-blue-600 to-blue-700',
      epic: 'from-purple-600 to-purple-700',
      legendary: 'from-amber-600 to-amber-700'
    };
    return colors[rarity] || 'from-slate-600 to-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black text-2xl flex items-center gap-2">
          <Trophy className="w-7 h-7 text-amber-400" />
          Badge Showcase
        </h3>
        {isOwnProfile && (
          <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Pin className="w-4 h-4 mr-2" />
                Manage Showcase
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  Manage Badge Showcase
                </DialogTitle>
                <p className="text-slate-400 text-sm">Pin up to 5 badges to display on your profile</p>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-6">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Currently Showcased ({showcasedBadgeIds.length}/5)
                  </h4>
                  <div className="grid grid-cols-5 gap-3">
                    {showcasedBadges.map((badge) => (
                      <div key={badge.id} className="relative group">
                        <Card className="bg-slate-900/50 border-cyan-500/50">
                          <CardContent className="p-3 text-center">
                            <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center`}>
                              <span className="text-2xl">{badge.icon}</span>
                            </div>
                            <p className="text-white text-xs font-semibold line-clamp-1">{badge.name}</p>
                          </CardContent>
                        </Card>
                        <Button
                          size="sm"
                          onClick={() => toggleBadgeShowcase(badge.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <PinOff className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-3">All Earned Badges</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {availableToShowcase.map((badge) => (
                      <Card 
                        key={badge.id}
                        onClick={() => toggleBadgeShowcase(badge.id)}
                        className="bg-slate-900/30 border-slate-700 hover:border-cyan-500 cursor-pointer transition-all"
                      >
                        <CardContent className="p-3 text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center`}>
                            <span className="text-2xl">{badge.icon}</span>
                          </div>
                          <p className="text-white text-xs font-semibold line-clamp-1">{badge.name}</p>
                          <Badge className="bg-cyan-500 text-xs mt-1">
                            <Pin className="w-2 h-2 mr-1" />
                            Pin
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Showcased Badges Display */}
      {showcasedBadges.length > 0 ? (
        <div className="grid grid-cols-5 gap-4">
          {showcasedBadges.map((badge) => (
            <Card key={badge.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group">
              <CardContent className="p-5 text-center">
                <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl`}>
                  <span className="text-4xl">{badge.icon}</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{badge.name}</h4>
                <p className="text-slate-400 text-xs line-clamp-2 mb-2">{badge.description}</p>
                <Badge className={`bg-gradient-to-r ${getRarityColor(badge.rarity)} text-xs capitalize`}>
                  {badge.rarity}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {isOwnProfile ? 'Pin your favorite badges to showcase them here' : 'No badges showcased yet'}
            </p>
            {isOwnProfile && earnedBadges.length > 0 && (
              <Button
                onClick={() => setManageDialogOpen(true)}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600"
              >
                <Pin className="w-4 h-4 mr-2" />
                Pin Badges
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            All Badges ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {earnedBadges.map((badge) => (
              <Card key={badge.id} className="bg-[#1a1f3a] border-slate-700 hover:border-purple-500 transition-all">
                <CardContent className="p-3 text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center`}>
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                  <p className="text-white text-xs font-semibold line-clamp-1">{badge.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}