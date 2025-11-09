import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, MapPin, Clock, Users, Video, Share2, Download,
  Ticket, CheckCircle, Mail, Phone, ArrowLeft, DollarSign
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EventDetail() {
  const [user, setUser] = useState(null);
  const [registerDialog, setRegisterDialog] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    attendee_name: '',
    attendee_email: '',
    attendee_phone: '',
    ticket_type: 'general',
    quantity: 1,
    special_requests: ''
  });

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setRegistrationForm(prev => ({
          ...prev,
          attendee_name: currentUser.full_name,
          attendee_email: currentUser.email
        }));
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId,
  });

  const { data: myRegistration } = useQuery({
    queryKey: ['myEventRegistration', eventId, user?.id],
    queryFn: async () => {
      const regs = await base44.entities.EventRegistration.filter({
        event_id: eventId,
        attendee_id: user.id
      });
      return regs[0];
    },
    enabled: !!eventId && !!user,
  });

  const registerMutation = useMutation({
    mutationFn: async (regData) => {
      const registration = await base44.entities.EventRegistration.create({
        ...regData,
        event_id: eventId,
        attendee_id: user?.id,
        registration_status: 'confirmed',
        qr_code: `QR-${Date.now()}` // Generate QR code
      });

      // Update event attendee count
      await base44.entities.Event.update(eventId, {
        attendee_count: (event.attendee_count || 0) + regData.quantity
      });

      return registration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['myEventRegistration'] });
      setRegisterDialog(false);
    },
  });

  const handleRegister = () => {
    if (!registrationForm.attendee_name || !registrationForm.attendee_email) {
      alert('Please fill in all required fields');
      return;
    }
    
    const ticketPrice = event.registration_required ? 50 : 0; // Example pricing
    const totalAmount = ticketPrice * registrationForm.quantity;

    registerMutation.mutate({
      ...registrationForm,
      ticket_price: ticketPrice,
      total_amount: totalAmount,
      payment_status: ticketPrice > 0 ? 'pending' : 'paid'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <p className="text-white">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 p-8">
          <p className="text-white">Event not found</p>
        </Card>
      </div>
    );
  }

  const spotsLeft = event.max_attendees ? event.max_attendees - (event.attendee_count || 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={createPageUrl("Events")}>
          <Button variant="outline" className="border-slate-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <Card className="bg-[#1a1f3a] border-slate-700 overflow-hidden">
              <div className="relative aspect-video">
                <img
                  src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {event.status === 'ongoing' && (
                  <Badge className="absolute top-4 left-4 bg-red-500 animate-pulse">
                    Happening Now
                  </Badge>
                )}
              </div>
            </Card>

            {/* Event Info */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-white font-black text-3xl mb-2">{event.title}</h1>
                    {event.category && (
                      <Badge className="bg-purple-500 capitalize">{event.category}</Badge>
                    )}
                  </div>
                  <Button variant="ghost" onClick={handleShare} className="text-slate-400 hover:text-white">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-slate-300 text-lg whitespace-pre-wrap">{event.description}</p>
                </div>

                {/* Event Details Grid */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-lg mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Date</p>
                      <p className="text-white font-semibold">{format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Time</p>
                      <p className="text-white font-semibold">{format(new Date(event.start_date), 'h:mm a')}</p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Location</p>
                        <p className="text-white font-semibold">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.is_online && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Video className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Format</p>
                        <p className="text-white font-semibold">Online Event</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Attendees</p>
                      <p className="text-white font-semibold">
                        {event.attendee_count || 0}
                        {event.max_attendees && ` / ${event.max_attendees}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Registration</p>
                      <p className="text-white font-semibold">
                        {event.registration_required ? 'Required' : 'Open to All'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Organizer Info */}
                {event.organizer_name && (
                  <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-white font-bold mb-3">Organized By</h3>
                    <p className="text-slate-300">{event.organizer_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30">
              <CardContent className="p-6">
                {myRegistration ? (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-xl text-center mb-2">You're Registered!</h3>
                    <p className="text-slate-300 text-center mb-4">
                      Your confirmation has been sent to {myRegistration.attendee_email}
                    </p>
                    
                    <div className="space-y-3 mb-4 p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Ticket Type:</span>
                        <span className="text-white font-semibold capitalize">{myRegistration.ticket_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Quantity:</span>
                        <span className="text-white font-semibold">{myRegistration.quantity}</span>
                      </div>
                      {myRegistration.total_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Amount Paid:</span>
                          <span className="text-white font-semibold">${myRegistration.total_amount}</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full bg-cyan-500 hover:bg-cyan-600 mb-2">
                      <Download className="w-4 h-4 mr-2" />
                      Download Ticket
                    </Button>
                    <Button variant="outline" className="w-full border-slate-700">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Ticket
                    </Button>
                  </>
                ) : isFull ? (
                  <>
                    <h3 className="text-white font-bold text-xl mb-4">Event Full</h3>
                    <p className="text-slate-300 mb-4">
                      This event has reached maximum capacity. Join the waitlist to be notified if spots open up.
                    </p>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600">
                      Join Waitlist
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-white font-bold text-xl mb-2">Register for Event</h3>
                    {spotsLeft && spotsLeft < 10 && (
                      <p className="text-amber-400 text-sm mb-4">
                        Only {spotsLeft} spots left!
                      </p>
                    )}
                    <p className="text-slate-300 mb-4">
                      {event.registration_required 
                        ? 'Secure your spot now!' 
                        : 'Free event - register to get updates'}
                    </p>

                    {user ? (
                      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold text-lg py-6">
                            <Ticket className="w-5 h-5 mr-2" />
                            Register Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-white font-black text-xl">Event Registration</DialogTitle>
                            <DialogDescription className="text-slate-400">
                              Complete your registration for {event.title}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div>
                              <Label className="text-white mb-2 block">Name *</Label>
                              <Input
                                value={registrationForm.attendee_name}
                                onChange={(e) => setRegistrationForm({...registrationForm, attendee_name: e.target.value})}
                                className="bg-slate-900/50 border-slate-700 text-white"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-white mb-2 block">Email *</Label>
                              <Input
                                type="email"
                                value={registrationForm.attendee_email}
                                onChange={(e) => setRegistrationForm({...registrationForm, attendee_email: e.target.value})}
                                className="bg-slate-900/50 border-slate-700 text-white"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-white mb-2 block">Phone</Label>
                              <Input
                                type="tel"
                                value={registrationForm.attendee_phone}
                                onChange={(e) => setRegistrationForm({...registrationForm, attendee_phone: e.target.value})}
                                className="bg-slate-900/50 border-slate-700 text-white"
                              />
                            </div>

                            <div>
                              <Label className="text-white mb-2 block">Number of Tickets</Label>
                              <Input
                                type="number"
                                min="1"
                                max={spotsLeft || 10}
                                value={registrationForm.quantity}
                                onChange={(e) => setRegistrationForm({...registrationForm, quantity: parseInt(e.target.value)})}
                                className="bg-slate-900/50 border-slate-700 text-white"
                              />
                            </div>

                            <div>
                              <Label className="text-white mb-2 block">Special Requests</Label>
                              <Input
                                value={registrationForm.special_requests}
                                onChange={(e) => setRegistrationForm({...registrationForm, special_requests: e.target.value})}
                                className="bg-slate-900/50 border-slate-700 text-white"
                                placeholder="Dietary restrictions, accessibility needs, etc."
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setRegisterDialog(false)} className="border-slate-700">
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleRegister}
                              disabled={registerMutation.isPending}
                              className="bg-cyan-500 hover:bg-cyan-600"
                            >
                              {registerMutation.isPending ? 'Registering...' : 'Complete Registration'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button 
                        onClick={() => base44.auth.redirectToLogin()}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold text-lg py-6"
                      >
                        Sign In to Register
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold mb-4">Event Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Registered</span>
                    <span className="text-white font-bold">{event.attendee_count || 0}</span>
                  </div>
                  {spotsLeft !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Spots Left</span>
                      <span className="text-cyan-400 font-bold">{spotsLeft}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <Badge className={
                      event.status === 'ongoing' ? 'bg-green-500' :
                      event.status === 'completed' ? 'bg-slate-600' :
                      'bg-blue-500'
                    }>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}