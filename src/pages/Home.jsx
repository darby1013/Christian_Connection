import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Video, Users, ArrowRight, Sparkles, Play
} from "lucide-react";
import LiveStreamSection from "../components/home/LiveStreamSection";
import FeaturesGrid from "../components/home/FeaturesGrid";
import PersonalizedContent from "../components/recommendations/PersonalizedContent";

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

  const heroVideoUrl = heroSettings.find(s => s.setting_key === 'hero_video')?.setting_value;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
        {heroVideoUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-20"
            >
              <source src={heroVideoUrl} type="video/mp4" />
            </video>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-cyan-900/30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-cyan-500/30">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-base font-bold tracking-wide">LIVE NOW</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Sunday
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Service
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed font-medium">
              Join us live for worship, teaching, and community • Every Sunday at 10 AM
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-10">
              <Users className="w-5 h-5" />
              <span className="font-semibold">342 watching now</span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl("LiveStreams")}>
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg px-10 py-7 shadow-2xl">
                  <Play className="w-6 h-6 mr-2" />
                  WATCH NOW
                </Button>
              </Link>
              <Link to={createPageUrl("Groups")}>
                <Button size="lg" variant="outline" className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50 font-bold text-lg px-10 py-7">
                  <Users className="w-6 h-6 mr-2" />
                  Join Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0e27] to-transparent"></div>
      </section>

      <LiveStreamSection />

      {/* Personalized Recommendations - Only show for logged-in users */}
      {user && (
        <section className="py-20 bg-[#0a0e27]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                Recommended For You
              </h2>
              <p className="text-slate-400">Personalized content based on your interests</p>
            </div>
            <PersonalizedContent user={user} />
          </div>
        </section>
      )}

      <FeaturesGrid />

      {/* Call to Action */}
      <section className="relative bg-gradient-to-r from-purple-900/50 via-[#1a1f3a] to-cyan-900/50 text-white py-24 overflow-hidden border-t border-slate-800">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Join Us?</h2>
          <p className="text-xl text-slate-300 mb-10 font-medium">
            Connect with believers worldwide • Grow in faith • Make an impact
          </p>
          <Button
            size="lg"
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xl px-12 py-8 shadow-2xl"
          >
            Get Started
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}