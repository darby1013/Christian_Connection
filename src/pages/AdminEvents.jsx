import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Plus, Search, TrendingUp, Eye, Edit, Trash2,
  MapPin, Users, Clock, Globe, CheckCircle, XCircle
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

export default function AdminEvents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    is_online: false,
    meeting_url: '',
    organizer_name: '',
    category: '',
    max_attendees: null,
    status: 'upcoming'
  });

  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-start_date'),
    initialData: [],
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['eventRegistrations'],
    queryFn: () => base44.entities.EventRegistration.list(),
    initialData: [],
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleSubmit = () => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: eventForm });
    } else {
      createEventMutation.mutate({ ...eventForm, attendee_count: 0 });
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setEventForm(event);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      is_online: false,
      meeting_url: '',
      organizer_name: '',
      category: '',
      max_attendees: null,
      status: 'upcoming'
    });
    setEditingEvent(null);
  };

  const filteredEvents = events.filter(e =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventRegistrations = (eventId) => {
    return registrations.filter(r => r.event_id === eventId);
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const ongoingEvents = events.filter(e => e.status === 'ongoing').length;
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendee_count || 0), 0);

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-500',
      ongoing: 'bg-green-500',
      completed: 'bg-slate-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Event Management</h2>
          <p className="text-slate-400 font-semibold">Organize and manage events</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Event Title *</Label>
                <Input
                  placeholder="Event title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  placeholder="Event description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({...eventForm, start_date: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">End Date</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({...eventForm, end_date: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Location</Label>
                  <Input
                    placeholder="Event location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Organizer</Label>
                  <Input
                    placeholder="Organizer name"
                    value={eventForm.organizer_name}
                    onChange={(e) => setEventForm({...eventForm, organizer_name: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventForm.is_online}
                  onChange={(e) => setEventForm({...eventForm, is_online: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">Online Event</Label>
              </div>

              {eventForm.is_online && (
                <div>
                  <Label className="text-white mb-2 block">Meeting URL</Label>
                  <Input
                    placeholder="https://..."
                    value={eventForm.meeting_url}
                    onChange={(e) => setEventForm({...eventForm, meeting_url: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!eventForm.title || !eventForm.start_date} className="bg-cyan-500 hover:bg-cyan-600">
                {editingEvent ? 'Update' : 'Create'} Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{events.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{events.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Events</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500">{upcomingEvents}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{upcomingEvents}</p>
            <p className="text-slate-400 text-sm font-semibold">Upcoming</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{ongoingEvents}</p>
            <p className="text-slate-400 text-sm font-semibold">Ongoing</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalAttendees}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Attendees</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((event) => {
          const eventRegs = getEventRegistrations(event.id);
          
          return (
            <Card key={event.id} className="bg-[#1a1f3a] border-slate-700">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2">{event.title}</h3>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {event.is_online && <Globe className="w-5 h-5 text-cyan-400" />}
                    {!event.is_online && <MapPin className="w-5 h-5 text-green-400" />}
                  </div>
                </div>

                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{event.description}</p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}
                  </div>
                  {!event.is_online && event.location && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-green-400" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-purple-400" />
                    {eventRegs.length} registered
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(event)} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(event.id)}
                    className="border-red-500/30 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Events</h3>
            <p className="text-slate-400 mb-6">Create your first event</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}