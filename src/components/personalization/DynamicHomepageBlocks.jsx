import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Gift, TrendingUp, Zap, Star, Heart,
  ShoppingBag, Award, Percent, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DynamicHomepageBlocks({ user, loyalty, userSegment }) {
  const blocks = getPersonalizedBlocks(user, loyalty, userSegment);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {blocks.map((block, idx) => (
        <Card key={idx} className={`${block.bgClass} ${block.borderClass} hover:scale-105 transition-transform cursor-pointer`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl ${block.iconBgClass} flex items-center justify-center`}>
                <block.icon className={`w-8 h-8 ${block.iconClass}`} />
              </div>
              <div className="flex-1">
                <Badge className={`${block.badgeClass} mb-2`}>{block.badge}</Badge>
                <h3 className="text-white font-black text-lg mb-2">{block.title}</h3>
                <p className={`text-sm mb-4 ${block.textClass}`}>{block.description}</p>
                <Link to={block.link}>
                  <Button className={block.buttonClass}>
                    {block.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getPersonalizedBlocks(user, loyalty, userSegment) {
  const blocks = [];

  // NEW CUSTOMER
  if (!user || userSegment === 'new_customer') {
    blocks.push({
      icon: Gift,
      iconClass: 'text-purple-400',
      iconBgClass: 'bg-purple-500/20',
      bgClass: 'bg-gradient-to-br from-purple-900/30 to-pink-900/30',
      borderClass: 'border-purple-500/30',
      badgeClass: 'bg-purple-500',
      textClass: 'text-purple-200',
      buttonClass: 'bg-purple-500 hover:bg-purple-600 w-full',
      badge: 'New Customer',
      title: 'Welcome Gift: 15% Off',
      description: 'Start your journey with us! Use code WELCOME15 on your first order.',
      cta: 'Shop Now',
      link: createPageUrl("StoreAdvanced")
    });
  }

  // PREMIUM MEMBER
  if (loyalty?.current_tier === 'platinum' || loyalty?.current_tier === 'diamond') {
    blocks.push({
      icon: Crown,
      iconClass: 'text-yellow-400',
      iconBgClass: 'bg-yellow-500/20',
      bgClass: 'bg-gradient-to-br from-yellow-900/30 to-amber-900/30',
      borderClass: 'border-yellow-500/30',
      badgeClass: 'bg-yellow-500',
      textClass: 'text-yellow-200',
      buttonClass: 'bg-yellow-500 hover:bg-yellow-600 w-full',
      badge: 'VIP Access',
      title: 'Exclusive Early Access',
      description: 'Shop new arrivals before anyone else. Premium member perk!',
      cta: 'Browse Exclusives',
      link: createPageUrl("StoreAdvanced")
    });
  }

  // BARGAIN HUNTER
  if (userSegment === 'bargain_hunter') {
    blocks.push({
      icon: Percent,
      iconClass: 'text-red-400',
      iconBgClass: 'bg-red-500/20',
      bgClass: 'bg-gradient-to-br from-red-900/30 to-orange-900/30',
      borderClass: 'border-red-500/30',
      badgeClass: 'bg-red-500',
      textClass: 'text-red-200',
      buttonClass: 'bg-red-500 hover:bg-red-600 w-full',
      badge: 'Flash Sale',
      title: 'Up to 50% Off Today',
      description: 'Limited time deals on your favorite items. Don\'t miss out!',
      cta: 'View Deals',
      link: createPageUrl("StoreAdvanced")
    });
  }

  // HIGH VALUE CUSTOMER
  if (loyalty?.total_spent > 500) {
    blocks.push({
      icon: Award,
      iconClass: 'text-cyan-400',
      iconBgClass: 'bg-cyan-500/20',
      bgClass: 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30',
      borderClass: 'border-cyan-500/30',
      badgeClass: 'bg-cyan-500',
      textClass: 'text-cyan-200',
      buttonClass: 'bg-cyan-500 hover:bg-cyan-600 w-full',
      badge: 'Valued Customer',
      title: 'Thank You Bonus',
      description: `You've spent $${loyalty.total_spent.toFixed(0)}! Enjoy free shipping on all orders.`,
      cta: 'Continue Shopping',
      link: createPageUrl("StoreAdvanced")
    });
  }

  // LOYALTY POINTS
  if (loyalty && loyalty.total_points > 0) {
    blocks.push({
      icon: Star,
      iconClass: 'text-amber-400',
      iconBgClass: 'bg-amber-500/20',
      bgClass: 'bg-gradient-to-br from-amber-900/30 to-orange-900/30',
      borderClass: 'border-amber-500/30',
      badgeClass: 'bg-amber-500',
      textClass: 'text-amber-200',
      buttonClass: 'bg-amber-500 hover:bg-amber-600 w-full',
      badge: 'Rewards',
      title: `${loyalty.total_points} Points Available`,
      description: 'Redeem your points for exclusive rewards and discounts.',
      cta: 'View Rewards',
      link: createPageUrl("LoyaltyDashboard")
    });
  }

  // TRENDING
  blocks.push({
    icon: TrendingUp,
    iconClass: 'text-green-400',
    iconBgClass: 'bg-green-500/20',
    bgClass: 'bg-gradient-to-br from-green-900/30 to-emerald-900/30',
    borderClass: 'border-green-500/30',
    badgeClass: 'bg-green-500',
    textClass: 'text-green-200',
    buttonClass: 'bg-green-500 hover:bg-green-600 w-full',
    badge: 'Trending',
    title: 'Bestsellers This Week',
    description: 'See what everyone in the faith community is loving right now.',
    cta: 'Shop Bestsellers',
    link: createPageUrl("StoreAdvanced")
  });

  return blocks.slice(0, 6);
}