
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  GraduationCap, Plus, Search, Edit, Trash2, BookOpen, Users,
  Clock, Play, Star, DollarSign, Award, TrendingUp, Wand2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminCourses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [user, setUser] = useState(null);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'faith',
    difficulty_level: 'beginner',
    duration_hours: 0,
    price: 0,
    access_type: 'free',
    thumbnail_url: '',
    learning_outcomes: [],
    prerequisites: [],
    tags: [],
    certificate_enabled: false
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
    initialData: [],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['courseModules'],
    queryFn: () => base44.entities.CourseModule.list(),
    initialData: [],
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['courseLessons'],
    queryFn: () => base44.entities.CourseLesson.list(),
    initialData: [],
  });

  const createCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create({
      ...data,
      instructor_id: user.id,
      instructor_name: user.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCourseForm(prev => ({ ...prev, thumbnail_url: file_url }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const handleSubmit = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setCourseForm(course);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this course and all its content?')) {
      deleteCourseMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setCourseForm({
      title: '',
      description: '',
      category: 'faith',
      difficulty_level: 'beginner',
      duration_hours: 0,
      price: 0,
      access_type: 'free',
      thumbnail_url: '',
      learning_outcomes: [],
      prerequisites: [],
      tags: [],
      certificate_enabled: false
    });
    setEditingCourse(null);
  };

  const getCourseStats = (courseId) => {
    const courseModules = modules.filter(m => m.course_id === courseId);
    const courseLessons = lessons.filter(l => l.course_id === courseId);
    
    return {
      modules: courseModules.length,
      lessons: courseLessons.length
    };
  };

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0);
  const publishedCourses = courses.filter(c => c.is_published).length;
  const avgRating = courses.length > 0 
    ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length 
    : 0;

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500',
      intermediate: 'bg-amber-500',
      advanced: 'bg-red-500'
    };
    return colors[level] || 'bg-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Course Management</h2>
          <p className="text-slate-400 font-semibold">Create and manage educational courses</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("AdminAICourseTools")}>
            <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 font-bold">
              <Wand2 className="w-4 h-4 mr-2" />
              AI Course Tools
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingCourse(null); resetForm(); }} className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label className="text-white mb-2 block">Course Title *</Label>
                  <Input
                    placeholder="e.g., Introduction to Biblical Studies"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">Description</Label>
                  <Textarea
                    placeholder="Course description"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                    >
                      <option value="faith">Faith</option>
                      <option value="leadership">Leadership</option>
                      <option value="ministry">Ministry</option>
                      <option value="bible_study">Bible Study</option>
                      <option value="personal_growth">Personal Growth</option>
                      <option value="worship">Worship</option>
                      <option value="counseling">Counseling</option>
                      <option value="theology">Theology</option>
                      <option value="practical_skills">Practical Skills</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Difficulty</Label>
                    <select
                      value={courseForm.difficulty_level}
                      onChange={(e) => setCourseForm({...courseForm, difficulty_level: e.target.value})}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Duration (hours)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={courseForm.duration_hours}
                      onChange={(e) => setCourseForm({...courseForm, duration_hours: parseFloat(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Access Type</Label>
                    <select
                      value={courseForm.access_type}
                      onChange={(e) => setCourseForm({...courseForm, access_type: e.target.value})}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                      <option value="subscription">Subscription</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Thumbnail</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                  {courseForm.thumbnail_url && (
                    <img src={courseForm.thumbnail_url} alt="Thumbnail" className="mt-2 w-full h-40 object-cover rounded" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={courseForm.certificate_enabled}
                    onChange={(e) => setCourseForm({...courseForm, certificate_enabled: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label className="text-white">Award certificate upon completion</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!courseForm.title} className="bg-cyan-500 hover:bg-cyan-600">
                  {editingCourse ? 'Update' : 'Create'} Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{courses.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{courses.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Courses</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{totalEnrollments}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalEnrollments}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{publishedCourses}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{publishedCourses}</p>
            <p className="text-slate-400 text-sm font-semibold">Published</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{avgRating.toFixed(1)}</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => {
          const stats = getCourseStats(course.id);
          
          return (
            <Card key={course.id} className="bg-[#1a1f3a] border-slate-700">
              <div className="relative aspect-video bg-slate-800">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-16 h-16 text-slate-600" />
                  </div>
                )}
                <Badge className={`absolute top-3 right-3 ${course.is_published ? 'bg-green-500' : 'bg-slate-500'}`}>
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
                <Badge className={`absolute top-3 left-3 ${getDifficultyColor(course.difficulty_level)}`}>
                  {course.difficulty_level}
                </Badge>
              </div>
              <CardContent className="p-5">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className="bg-purple-500 text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {stats.modules} Modules
                  </Badge>
                  <Badge className="bg-cyan-500 text-xs">
                    <Play className="w-3 h-3 mr-1" />
                    {stats.lessons} Lessons
                  </Badge>
                  <Badge className="bg-amber-500 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {course.duration_hours}h
                  </Badge>
                  {course.certificate_enabled && (
                    <Badge className="bg-green-500 text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      Certificate
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-white font-bold text-sm">{course.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-slate-400 text-xs">({course.review_count || 0})</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-white font-semibold">{course.enrollment_count || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={createPageUrl("AdminCourseBuilder") + `?id=${course.id}`} className="flex-1">
                    <Button size="sm" className="w-full bg-purple-500 hover:bg-purple-600">
                      <Edit className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(course.id)}
                    className="border-red-500/30 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Courses</h3>
            <p className="text-slate-400 mb-6">Create your first course to start teaching</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Course
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
