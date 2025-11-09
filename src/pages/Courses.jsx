
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Search, Star, Users, Clock, BookOpen, Play,
  Award, Filter, DollarSign, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const { data: courses = [] } = useQuery({
    queryKey: ['publicCourses'],
    queryFn: () => base44.entities.Course.filter({ is_published: true }, '-created_date'),
    initialData: [],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['allModules'],
    queryFn: () => base44.entities.CourseModule.list(),
    initialData: [],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allCourseReviews'],
    queryFn: () => base44.entities.CourseReview.filter({ is_approved: true }),
    initialData: [],
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty_level === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.enrollment_count || 0) - (a.enrollment_count || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0); // Assuming course.rating is available from API for sorting
      case 'newest':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'price_low':
        return (a.price || 0) - (b.price || 0);
      case 'price_high':
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });

  const getModuleCount = (courseId) => {
    return modules.filter(m => m.course_id === courseId).length;
  };

  const getCourseRating = (courseId) => {
    const courseReviews = reviews.filter(r => r.course_id === courseId);
    if (courseReviews.length === 0) return { avg: 0, count: 0 };
    
    const avg = courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length;
    return { avg, count: courseReviews.length };
  };

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500',
      intermediate: 'bg-amber-500',
      advanced: 'bg-red-500'
    };
    return colors[level] || 'bg-slate-500';
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      faith: 'Faith',
      leadership: 'Leadership',
      ministry: 'Ministry',
      bible_study: 'Bible Study',
      personal_growth: 'Personal Growth',
      worship: 'Worship',
      counseling: 'Counseling',
      theology: 'Theology',
      practical_skills: 'Practical Skills'
    };
    return labels[cat] || cat;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            <GraduationCap className="w-12 h-12 inline-block mr-3 text-purple-400" />
            Course Catalog
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Expand your knowledge with expert-led video courses
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Categories</SelectItem>
                  <SelectItem value="faith" className="text-white">Faith</SelectItem>
                  <SelectItem value="leadership" className="text-white">Leadership</SelectItem>
                  <SelectItem value="ministry" className="text-white">Ministry</SelectItem>
                  <SelectItem value="bible_study" className="text-white">Bible Study</SelectItem>
                  <SelectItem value="personal_growth" className="text-white">Personal Growth</SelectItem>
                  <SelectItem value="worship" className="text-white">Worship</SelectItem>
                  <SelectItem value="counseling" className="text-white">Counseling</SelectItem>
                  <SelectItem value="theology" className="text-white">Theology</SelectItem>
                  <SelectItem value="practical_skills" className="text-white">Practical Skills</SelectItem>
                </SelectContent>
              </Select>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Levels</SelectItem>
                  <SelectItem value="beginner" className="text-white">Beginner</SelectItem>
                  <SelectItem value="intermediate" className="text-white">Intermediate</SelectItem>
                  <SelectItem value="advanced" className="text-white">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-slate-400 text-sm">Sort by:</span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'rating', label: 'Highest Rated' },
                  { value: 'newest', label: 'Newest' },
                  { value: 'price_low', label: 'Price: Low to High' },
                  { value: 'price_high', label: 'Price: High to Low' }
                ].map(option => (
                  <Button
                    key={option.value}
                    size="sm"
                    onClick={() => setSortBy(option.value)}
                    className={sortBy === option.value ? 'bg-cyan-500' : 'bg-slate-800 hover:bg-slate-700'}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-400">
            Showing <span className="text-white font-bold">{sortedCourses.length}</span> courses
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course) => {
            const { avg: courseRating, count: reviewCount } = getCourseRating(course.id);
            
            return (
              <Card key={course.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group">
                <div className="relative aspect-video bg-slate-800 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="w-16 h-16 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={getDifficultyColor(course.difficulty_level)}>
                      {course.difficulty_level}
                    </Badge>
                    {course.price === 0 ? (
                      <Badge className="bg-green-500">Free</Badge>
                    ) : (
                      <Badge className="bg-purple-500">
                        <DollarSign className="w-3 h-3 mr-1" />
                        ${course.price}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-5">
                  <Badge className="bg-purple-500/20 text-purple-300 mb-3">
                    {getCategoryLabel(course.category)}
                  </Badge>
                  <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-bold">{courseRating.toFixed(1)}</span>
                      <span className="text-slate-400 text-xs">({reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollment_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{getModuleCount(course.id)} modules</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration_hours}h</span>
                    </div>
                    {course.certificate_enabled && (
                      <Badge className="bg-amber-500/20 text-amber-300 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Certificate
                      </Badge>
                    )}
                  </div>

                  <Link to={createPageUrl("CourseDetail") + `?id=${course.id}`}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600">
                      <Play className="w-4 h-4 mr-2" />
                      View Course
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedCourses.length === 0 && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-12 text-center">
              <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">No Courses Found</h3>
              <p className="text-slate-400 mb-6">Try adjusting your filters</p>
              <Button onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setDifficultyFilter("all");
              }} className="bg-cyan-500 hover:bg-cyan-600">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
