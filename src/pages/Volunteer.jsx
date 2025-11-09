import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UserPlus, MapPin, Calendar, Clock, CheckCircle, Users,
  Heart, Sparkles, Wifi, Building
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Volunteer() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

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

  const { data: opportunities = [] } = useQuery({
    queryKey: ['volunteerOpportunities'],
    queryFn: () => base44.entities.Volunteer.filter({ status: 'open' }, '-created_date'),
    initialData: [],
  });

  const applyMutation = useMutation({
    mutationFn: async (opportunityId) => {
      const opportunity = opportunities.find(o => o.id === opportunityId);
      const applicants = opportunity.applicants || [];
      
      if (!applicants.includes(user.id)) {
        return base44.entities.Volunteer.update(opportunityId, {
          applicants: [...applicants, user.id],
          spots_filled: (opportunity.spots_filled || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerOpportunities'] });
    },
  });

  const filteredOpportunities = opportunities.filter(opp =>
    opp.opportunity_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category) => {
    const icons = {
      tech: "💻",
      media: "🎬",
      worship: "🎵",
      children: "👶",
      youth: "🎓",
      outreach: "🌍",
      admin: "📋",
      hospitality: "☕"
    };
    return icons[category] || "🙌";
  };

  const getCategoryColor = (category) => {
    const colors = {
      tech: "from-blue-500 to-cyan-500",
      media: "from-purple-500 to-pink-500",
      worship: "from-amber-500 to-orange-500",
      children: "from-green-500 to-emerald-500",
      youth: "from-indigo-500 to-blue-500",
      outreach: "from-red-500 to-rose-500",
      admin: "from-slate-500 to-gray-500",
      hospitality: "from-pink-500 to-fuchsia-500"
    };
    return colors[category] || colors.outreach;
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Volunteer Opportunities</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Serve and make a difference in your community
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                {opportunities.length} Opportunities
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                All Skill Levels
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-2xl mx-auto">
          <Input
            placeholder="Search by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1a1f3a] border-slate-700 text-white"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Opportunities</TabsTrigger>
            <TabsTrigger value="remote" className="data-[state=active]:bg-cyan-500">
              <Wifi className="w-4 h-4 mr-2" />
              Remote
            </TabsTrigger>
            <TabsTrigger value="onsite" className="data-[state=active]:bg-cyan-500">
              <Building className="w-4 h-4 mr-2" />
              On-Site
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredOpportunities.map((opp) => (
                <Card key={opp.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(opp.category)} flex items-center justify-center text-3xl flex-shrink-0`}>
                        {getCategoryIcon(opp.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-xl mb-2">{opp.opportunity_title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-purple-500 capitalize">{opp.category}</Badge>
                          {opp.is_remote && (
                            <Badge className="bg-blue-500">
                              <Wifi className="w-3 h-3 mr-1" />
                              Remote
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">{opp.description}</p>

                    <div className="space-y-2 mb-4">
                      {opp.time_commitment && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          {opp.time_commitment}
                        </div>
                      )}
                      {opp.location && !opp.is_remote && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <MapPin className="w-4 h-4 text-cyan-400" />
                          {opp.location}
                        </div>
                      )}
                      {opp.start_date && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          Starts {format(new Date(opp.start_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    {opp.requirements && opp.requirements.length > 0 && (
                      <div className="mb-4">
                        <p className="text-slate-400 text-xs font-semibold mb-2">Requirements:</p>
                        <div className="flex flex-wrap gap-1">
                          {opp.requirements.slice(0, 3).map((req, idx) => (
                            <Badge key={idx} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div className="text-sm">
                        <span className="text-slate-400">
                          {opp.spots_filled || 0} / {opp.spots_available} filled
                        </span>
                      </div>
                      {user ? (
                        <Button
                          onClick={() => applyMutation.mutate(opp.id)}
                          disabled={
                            applyMutation.isPending ||
                            (opp.applicants || []).includes(user.id) ||
                            opp.spots_filled >= opp.spots_available
                          }
                          className={
                            (opp.applicants || []).includes(user.id)
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-cyan-500 hover:bg-cyan-600"
                          }
                        >
                          {(opp.applicants || []).includes(user.id) ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Applied
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Apply Now
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600">
                          Sign In to Apply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="remote" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredOpportunities.filter(o => o.is_remote).map((opp) => (
                <Card key={opp.id} className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-bold text-lg">{opp.opportunity_title}</h3>
                      <Badge className="bg-blue-500">
                        <Wifi className="w-3 h-3 mr-1" />
                        Remote
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-4">{opp.description}</p>
                    <Button className="w-full bg-blue-500 hover:bg-blue-600">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="onsite" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredOpportunities.filter(o => !o.is_remote).map((opp) => (
                <Card key={opp.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-bold text-lg">{opp.opportunity_title}</h3>
                      <Badge className="bg-purple-500">
                        <Building className="w-3 h-3 mr-1" />
                        On-Site
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{opp.description}</p>
                    {opp.location && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        {opp.location}
                      </div>
                    )}
                    <Button className="w-full bg-purple-500 hover:bg-purple-600">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}