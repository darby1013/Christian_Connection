import React from "react";
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

export default function Home() {
  const { data: heroSettings = [] } = useQuery({
    queryKey: ['heroSettings'],
    queryFn: () => base44.entities.SiteSettings.filter({ category: 'hero' }),
    initialData: [],
  });

  const heroVideoUrl = heroSettings.find(s => s.setting_key === 'hero_video')?.setting_value;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Video */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-700 to-red-800 text-white">
        {/* Video Background */}
        {heroVideoUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-40"
            >
              <source src={heroVideoUrl} type="video/mp4" />
            </video>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 via-orange-900/70 to-red-900/80"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute top-20 left-10 text-9xl">✝</div>
          <div className="absolute bottom-20 right-20 text-8xl">✝</div>
          <div className="absolute top-40 right-40 text-6xl">✝</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-8 border-2 border-white/30 shadow-2xl">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-base font-bold tracking-wide">LIVE. WORSHIP. CONNECT.</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight drop-shadow-2xl">
              EXPERIENCE
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
                FAITH ALIVE
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-orange-100 mb-10 leading-relaxed font-bold drop-shadow-lg">
              Join our global community • Stream worship live • Grow together in Christ
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link to={createPageUrl("LiveStreams")}>
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg px-8 py-7 shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105 border-2 border-white/30">
                  <Play className="w-6 h-6 mr-3" />
                  WATCH LIVE NOW
                </Button>
              </Link>
              <Link to={createPageUrl("Groups")}>
                <Button size="lg" className="bg-white/20 backdrop-blur-md border-3 border-white text-white hover:bg-white hover:text-orange-700 font-bold text-lg px-8 py-7 shadow-2xl transition-all transform hover:scale-105">
                  <Users className="w-6 h-6 mr-3" />
                  JOIN A GROUP
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-50 to-transparent"></div>
      </section>

      <LiveStreamSection />

      <FeaturesGrid />

      {/* Call to Action */}
      <section className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 text-9xl">✝</div>
          <div className="absolute bottom-10 right-20 text-9xl">✝</div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black mb-6 drop-shadow-lg">READY TO BEGIN?</h2>
          <p className="text-2xl text-orange-100 mb-10 font-bold">
            Join thousands growing in faith • Connecting online • Making a difference
          </p>
          <Button
            size="lg"
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-white text-orange-700 hover:bg-orange-50 font-bold text-xl px-10 py-8 shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105"
          >
            START YOUR JOURNEY
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        </div>
      </section>
    </div>
  );
}