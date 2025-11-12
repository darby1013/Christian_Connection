import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Gift, TrendingUp, Percent, Award, Star,
  Truck, Clock, Zap, Heart, ShoppingBag, Target
} from "lucide-react";

export default function DynamicProductBlocks({ product, user, loyalty, userSegment }) {
  const blocks = getPersonalizedProductBlocks(product, user, loyalty, userSegment);

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      {blocks.map((block, idx) => (
        <Card key={idx} className={`${block.bgClass} ${block.borderClass}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl ${block.iconBgClass} flex items-center justify-center flex-shrink-0`}>
                <block.icon className={`w-7 h-7 ${block.iconClass}`} />
              </div>
              <div className="flex-1">
                <Badge className={`${block.badgeClass} mb-2`}>{block.badge}</Badge>
                <h3 className={`text-xl font-black mb-2 ${block.titleClass}`}>{block.title}</h3>
                <p className={`text-sm ${block.textClass}`}>{block.message}</p>
                {block.action && (
                  <div className="mt-4">
                    {block.action}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getPersonalizedProductBlocks(product, user, loyalty, userSegment) {
  const blocks = [];

  // NEW CUSTOMER - First time buyer incentive
  if (!user || userSegment === 'new_customer') {
    blocks.push({
      icon: Gift,
      iconClass: 'text-purple-400',
      iconBgClass: 'bg-purple-500/20',
      bgClass: 'bg-gradient-to-r from-purple-900/30 to-pink-900/30',
      borderClass: 'border-purple-500/30',
      badgeClass: 'bg-purple-500',
      titleClass: 'text-white',
      textClass: 'text-purple-200',
      badge: '🎉 New Customer Offer',
      title: 'Welcome! Get 15% Off Your First Order',
      message: `Use code WELCOME15 at checkout. Your first purchase of "${product.name}" will be just $${(product.price * 0.85).toFixed(2)}!`,
      action: (
        <Badge className="bg-purple-600 text-lg px-4 py-2">
          Code: WELCOME15
        </Badge>
      )
    });
  }

  // PREMIUM MEMBER - Tier discount
  if (loyalty?.current_tier && ['platinum', 'diamond'].includes(loyalty.current_tier)) {
    const tierDiscount = getTierDiscount(loyalty.current_tier);
    const memberPrice = product.price * (1 - tierDiscount / 100);
    
    blocks.push({
      icon: Crown,
      iconClass: 'text-yellow-400',
      iconBgClass: 'bg-yellow-500/20',
      bgClass: 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30',
      borderClass: 'border-yellow-500/30',
      badgeClass: 'bg-yellow-500',
      titleClass: 'text-white',
      textClass: 'text-yellow-200',
      badge: `👑 ${loyalty.current_tier.toUpperCase()} MEMBER`,
      title: `Your Exclusive ${tierDiscount}% Member Discount`,
      message: `As a ${loyalty.current_tier} tier member, your price is $${memberPrice.toFixed(2)} instead of $${product.price.toFixed(2)}. You save $${(product.price - memberPrice).toFixed(2)}!`,
      action: (
        <div className="flex items-center gap-2">
          <span className="text-slate-400 line-through text-lg">${product.price.toFixed(2)}</span>
          <span className="text-yellow-300 font-black text-3xl">${memberPrice.toFixed(2)}</span>
        </div>
      )
    });
  } else if (loyalty?.current_tier && ['gold', 'silver'].includes(loyalty.current_tier)) {
    const tierDiscount = getTierDiscount(loyalty.current_tier);
    const memberPrice = product.price * (1 - tierDiscount / 100);
    
    blocks.push({
      icon: Award,
      iconClass: 'text-cyan-400',
      iconBgClass: 'bg-cyan-500/20',
      bgClass: 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30',
      borderClass: 'border-cyan-500/30',
      badgeClass: 'bg-cyan-500',
      titleClass: 'text-white',
      textClass: 'text-cyan-200',
      badge: `⭐ ${loyalty.current_tier.toUpperCase()} MEMBER`,
      title: `Loyalty Member Price: $${memberPrice.toFixed(2)}`,
      message: `Your ${loyalty.current_tier} tier gives you ${tierDiscount}% off every purchase. Save $${(product.price - memberPrice).toFixed(2)} on this item!`,
      action: (
        <Badge className="bg-cyan-600 text-lg px-4 py-2">
          Member Exclusive
        </Badge>
      )
    });
  }

  // BARGAIN HUNTER - Sale alert
  if (userSegment === 'bargain_hunter' && product.is_on_sale) {
    const savings = product.compare_at_price - product.price;
    const savingsPercent = ((savings / product.compare_at_price) * 100).toFixed(0);
    
    blocks.push({
      icon: Percent,
      iconClass: 'text-red-400',
      iconBgClass: 'bg-red-500/20',
      bgClass: 'bg-gradient-to-r from-red-900/30 to-orange-900/30',
      borderClass: 'border-red-500/30',
      badgeClass: 'bg-red-500 animate-pulse',
      titleClass: 'text-white',
      textClass: 'text-red-200',
      badge: '🔥 FLASH SALE',
      title: `Save ${savingsPercent}% - Limited Time!`,
      message: `This is exactly what you love - a great deal! Originally $${product.compare_at_price.toFixed(2)}, now just $${product.price.toFixed(2)}. Save $${savings.toFixed(2)} today!`,
      action: (
        <Badge className="bg-red-600 text-lg px-4 py-2 animate-pulse">
          Ends in 24 hours!
        </Badge>
      )
    });
  }

  // HIGH VALUE CUSTOMER - Free shipping
  if (loyalty?.total_spent > 500) {
    blocks.push({
      icon: Truck,
      iconClass: 'text-green-400',
      iconBgClass: 'bg-green-500/20',
      bgClass: 'bg-gradient-to-r from-green-900/30 to-emerald-900/30',
      borderClass: 'border-green-500/30',
      badgeClass: 'bg-green-500',
      titleClass: 'text-white',
      textClass: 'text-green-200',
      badge: '🎁 VIP Perk',
      title: 'FREE Shipping On This Order',
      message: `Thank you for being a valued customer! You've spent $${loyalty.total_spent.toFixed(0)} with us. Enjoy complimentary shipping on all your orders.`,
      action: (
        <Badge className="bg-green-600 px-4 py-2">
          <Truck className="w-4 h-4 mr-2" />
          Free Shipping Applied
        </Badge>
      )
    });
  }

  // POINTS EARNING POTENTIAL
  if (loyalty && product.price >= 20) {
    const pointsToEarn = Math.floor(product.price * (loyalty.points_multiplier || 1));
    
    blocks.push({
      icon: Star,
      iconClass: 'text-amber-400',
      iconBgClass: 'bg-amber-500/20',
      bgClass: 'bg-gradient-to-r from-amber-900/30 to-yellow-900/30',
      borderClass: 'border-amber-500/30',
      badgeClass: 'bg-amber-500',
      titleClass: 'text-white',
      textClass: 'text-amber-200',
      badge: '⭐ Earn Rewards',
      title: `Earn ${pointsToEarn} Loyalty Points`,
      message: `Buy this product and earn ${pointsToEarn} points towards your next reward! ${loyalty.points_multiplier > 1 ? `Your ${loyalty.current_tier} tier gives you ${loyalty.points_multiplier}x points!` : ''}`,
      action: (
        <div className="text-amber-300 text-sm font-bold">
          Current Balance: {loyalty.total_points} points
        </div>
      )
    });
  }

  // BUNDLE OPPORTUNITY
  if (!userSegment || ['new_customer', 'bargain_hunter'].includes(userSegment)) {
    blocks.push({
      icon: Layers,
      iconClass: 'text-purple-400',
      iconBgClass: 'bg-purple-500/20',
      bgClass: 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30',
      borderClass: 'border-purple-500/30',
      badgeClass: 'bg-purple-500',
      titleClass: 'text-white',
      textClass: 'text-purple-200',
      badge: '💰 Bundle & Save',
      title: 'Buy More, Save More',
      message: 'Combine this with other products in a custom bundle and save 10% on your entire order!',
      action: (
        <Button className="bg-purple-600 hover:bg-purple-700 mt-2">
          <Layers className="w-4 h-4 mr-2" />
          Build Your Bundle
        </Button>
      )
    });
  }

  // LOYAL CUSTOMER - Thank you message
  if (userSegment === 'loyal_customer' && loyalty?.total_purchases >= 5) {
    blocks.push({
      icon: Heart,
      iconClass: 'text-pink-400',
      iconBgClass: 'bg-pink-500/20',
      bgClass: 'bg-gradient-to-r from-pink-900/30 to-rose-900/30',
      borderClass: 'border-pink-500/30',
      badgeClass: 'bg-pink-500',
      titleClass: 'text-white',
      textClass: 'text-pink-200',
      badge: '❤️ Valued Customer',
      title: 'Thank You For Your Loyalty!',
      message: `You've made ${loyalty.total_purchases} purchases with us! As a thank you, enjoy priority customer support and early access to new products.`,
      action: (
        <Badge className="bg-pink-600 px-4 py-2">
          Purchase #{loyalty.total_purchases + 1}
        </Badge>
      )
    });
  }

  // URGENCY FOR AT-RISK CUSTOMERS
  if (userSegment === 'at_risk') {
    blocks.push({
      icon: Clock,
      iconClass: 'text-orange-400',
      iconBgClass: 'bg-orange-500/20',
      bgClass: 'bg-gradient-to-r from-orange-900/30 to-red-900/30',
      borderClass: 'border-orange-500/30',
      badgeClass: 'bg-orange-500 animate-pulse',
      titleClass: 'text-white',
      textClass: 'text-orange-200',
      badge: '⏰ We Miss You!',
      title: 'Special Welcome Back Offer - 20% Off',
      message: `We noticed you haven't shopped in a while. Here's 20% off this item just for you! Use code COMEBACK20 at checkout.`,
      action: (
        <Badge className="bg-orange-600 text-lg px-4 py-2">
          Code: COMEBACK20
        </Badge>
      )
    });
  }

  return blocks;
}

function getTierDiscount(tier) {
  switch(tier) {
    case 'silver': return 5;
    case 'gold': return 10;
    case 'platinum': return 15;
    case 'diamond': return 20;
    default: return 0;
  }
}