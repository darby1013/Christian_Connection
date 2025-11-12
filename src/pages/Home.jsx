import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Play, ArrowRight, Video } from "lucide-react";
import LiveStreamSection from "../components/home/LiveStreamSection";
import FeaturesGrid from "../components/home/FeaturesGrid";
import DynamicHomepageBlocks from "../components/personalization/DynamicHomepageBlocks";
import AIRecommendations from "../components/personalization/AIRecommendations";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: heroSettings = [] } = useQuery({
    queryKey: ['heroSettings'],
    queryFn: () => base44.entities.SiteSettings.filter({ category: 'hero' }),
    initialData: [],
  });

  const { data: loyalty } = useQuery({
    queryKey: ['myLoyalty', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const records = await base44.entities.CustomerLoyalty.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user,
  });

  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ['recentlyViewed', user?.id],
    queryFn: () => base44.entities.RecentlyViewed.filter({ user_id: user?.id }, '-viewed_at', 10),
    enabled: !!user,
    initialData: [],
  });

  const { data: pastOrders = [] } = useQuery({
    queryKey: ['myOrders', user?.id],
    queryFn: () => base44.entities.Order.filter({ customer_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: userSegment } = useQuery({
    queryKey: ['userSegment', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const segments = await base44.entities.UserSegment.filter({ user_id: user.id });
      return segments[0] || null;
    },
    enabled: !!user,
  });

  const heroVideo = heroSettings.find(s => s.setting_key === 'hero_video_url')?.setting_value;

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden bg-[#0a0e27]">
        {heroVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=80)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e27]/90 to-[#0a0e27]/50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              Experience Faith<br />Together
            </h1>
            <p className="text-xl text-slate-300 mb-8 font-semibold">
              Live worship, teachings, community, and more
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to={createPageUrl("LiveStreamPlayer")}>
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white text-lg px-8 py-6 font-black">
                  <Play className="w-6 h-6 mr-2" />
                  Watch Live
                </Button>
              </Link>
              <Link to={createPageUrl("StoreAdvanced")}>
                <Button className="bg-white hover:bg-slate-100 text-slate-900 text-lg px-8 py-6 font-black border-2 border-white">
                  Explore Store
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Live Stream Section */}
        <LiveStreamSection />

        {/* Dynamic Personalized Blocks */}
        {user && (
          <DynamicHomepageBlocks
            user={user}
            loyalty={loyalty}
            userSegment={userSegment?.segment_type || 'new_customer'}
          />
        )}

        {/* AI Recommendations */}
        {user && (
          <AIRecommendations
            user={user}
            loyalty={loyalty}
            recentlyViewed={recentlyViewed}
            pastOrders={pastOrders}
          />
        )}

        {/* Features Grid */}
        <FeaturesGrid />

        {/* CTA Section */}
        {!user && (
          <section className="text-center py-20">
            <h2 className="text-4xl font-black text-white mb-6">Join Our Community</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Connect with believers worldwide, access exclusive content, and grow in faith together
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white text-lg px-12 py-6 font-black"
            >
              Get Started Free
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}