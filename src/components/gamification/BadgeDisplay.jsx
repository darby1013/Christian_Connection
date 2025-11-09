import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Trophy, Target, Zap } from "lucide-react";

export default function BadgeDisplay({ userId }) {
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

  const earnedBadges = userBadges.map(ub => {
    const badge = allBadges.find(b => b.id === ub.badge_id);
    return { ...badge, earned_date: ub.earned_date, is_showcased: ub.is_showcased };
  }).filter(b => b);

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-slate-600',
      rare: 'bg-blue-600',
      epic: 'bg-purple-600',
      legendary: 'bg-amber-600'
    };
    return colors[rarity] || 'bg-slate-600';
  };

  const getBadgeIcon = (category) => {
    const icons = {
      engagement: Zap,
      content: Star,
      social: Target,
      milestone: Trophy,
      achievement: Award
    };
    const Icon = icons[category] || Award;
    return Icon;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {earnedBadges.map((badge) => {
        const Icon = getBadgeIcon(badge.category);
        
        return (
          <Card 
            key={badge.id} 
            className={`bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all cursor-pointer group`}
          >
            <CardContent className="p-4 text-center">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full ${getRarityColor(badge.rarity)} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="text-3xl">{badge.icon}</span>
              </div>
              <h4 className="text-white font-bold text-sm mb-1">{badge.name}</h4>
              <p className="text-slate-400 text-xs line-clamp-2 mb-2">{badge.description}</p>
              <Badge className={`${getRarityColor(badge.rarity)} text-xs capitalize`}>
                {badge.rarity}
              </Badge>
              {badge.is_showcased && (
                <div className="mt-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}