import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Sparkles, Zap } from "lucide-react";

export default function MembershipBadge({ tier, size = "default" }) {
  if (!tier || tier === 'free' || tier === 'none') return null;

  const badgeConfig = {
    basic: {
      icon: Star,
      label: "Basic",
      className: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0",
      iconColor: "text-white"
    },
    premium: {
      icon: Sparkles,
      label: "Premium",
      className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
      iconColor: "text-white"
    },
    vip: {
      icon: Crown,
      label: "VIP",
      className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/50",
      iconColor: "text-white"
    }
  };

  const config = badgeConfig[tier];
  if (!config) return null;

  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <Badge className={`${config.className} font-bold ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"} animate-pulse`}>
      <Icon className={`${iconSize} mr-1 ${config.iconColor}`} />
      {config.label}
    </Badge>
  );
}