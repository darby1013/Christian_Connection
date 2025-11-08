import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdvancedFilters({ 
  filterType = "products", 
  filters, 
  onFilterChange,
  onClearFilters
}) {
  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            Advanced Filters
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-400 hover:text-white text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        {/* Product Filters */}
        {filterType === "products" && (
          <>
            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Category</Label>
              <Select value={filters.category || ""} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null} className="text-white">All Categories</SelectItem>
                  <SelectItem value="tshirts" className="text-white">T-Shirts</SelectItem>
                  <SelectItem value="books" className="text-white">Books</SelectItem>
                  <SelectItem value="music" className="text-white">Music</SelectItem>
                  <SelectItem value="accessories" className="text-white">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">
                Price Range: ${filters.priceMin || 0} - ${filters.priceMax || 500}
              </Label>
              <div className="space-y-3">
                <Slider
                  value={[filters.priceMin || 0]}
                  onValueChange={([value]) => updateFilter('priceMin', value)}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <Slider
                  value={[filters.priceMax || 500]}
                  onValueChange={([value]) => updateFilter('priceMax', value)}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Minimum Rating</Label>
              <Select value={filters.minRating?.toString() || ""} onValueChange={(value) => updateFilter('minRating', parseFloat(value))}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null} className="text-white">Any Rating</SelectItem>
                  <SelectItem value="4" className="text-white">⭐ 4+ Stars</SelectItem>
                  <SelectItem value="3" className="text-white">⭐ 3+ Stars</SelectItem>
                  <SelectItem value="2" className="text-white">⭐ 2+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Tags</Label>
              <Input
                placeholder="Enter tags (comma separated)"
                value={filters.tags || ""}
                onChange={(e) => updateFilter('tags', e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Sort By</Label>
              <Select value={filters.sortBy || ""} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="price_low" className="text-white">Price: Low to High</SelectItem>
                  <SelectItem value="price_high" className="text-white">Price: High to Low</SelectItem>
                  <SelectItem value="rating" className="text-white">Highest Rated</SelectItem>
                  <SelectItem value="newest" className="text-white">Newest First</SelectItem>
                  <SelectItem value="popular" className="text-white">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Forum/Thread Filters */}
        {filterType === "forum" && (
          <>
            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Category</Label>
              <Select value={filters.category || ""} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null} className="text-white">All Categories</SelectItem>
                  <SelectItem value="prayer" className="text-white">Prayer Requests</SelectItem>
                  <SelectItem value="bible_study" className="text-white">Bible Study</SelectItem>
                  <SelectItem value="testimony" className="text-white">Testimonies</SelectItem>
                  <SelectItem value="questions" className="text-white">Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Author</Label>
              <Input
                placeholder="Search by author..."
                value={filters.author || ""}
                onChange={(e) => updateFilter('author', e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Date Range</Label>
              <Select value={filters.dateRange || ""} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null} className="text-white">Any Time</SelectItem>
                  <SelectItem value="today" className="text-white">Today</SelectItem>
                  <SelectItem value="week" className="text-white">This Week</SelectItem>
                  <SelectItem value="month" className="text-white">This Month</SelectItem>
                  <SelectItem value="year" className="text-white">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Tags</Label>
              <Input
                placeholder="Enter tags (comma separated)"
                value={filters.tags || ""}
                onChange={(e) => updateFilter('tags', e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Sort By</Label>
              <Select value={filters.sortBy || ""} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Most Recent" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="recent" className="text-white">Most Recent</SelectItem>
                  <SelectItem value="popular" className="text-white">Most Popular</SelectItem>
                  <SelectItem value="replies" className="text-white">Most Replies</SelectItem>
                  <SelectItem value="views" className="text-white">Most Views</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Stream Filters */}
        {filterType === "streams" && (
          <>
            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Status</Label>
              <Select value={filters.status || ""} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="All streams" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null} className="text-white">All Streams</SelectItem>
                  <SelectItem value="live" className="text-white">Live Now</SelectItem>
                  <SelectItem value="scheduled" className="text-white">Upcoming</SelectItem>
                  <SelectItem value="ended" className="text-white">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Category</Label>
              <Select value={filters.category || ""} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null} className="text-white">All Categories</SelectItem>
                  <SelectItem value="worship" className="text-white">Worship</SelectItem>
                  <SelectItem value="teaching" className="text-white">Teaching</SelectItem>
                  <SelectItem value="prayer" className="text-white">Prayer</SelectItem>
                  <SelectItem value="testimony" className="text-white">Testimony</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Host</Label>
              <Input
                placeholder="Search by host..."
                value={filters.host || ""}
                onChange={(e) => updateFilter('host', e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Sort By</Label>
              <Select value={filters.sortBy || ""} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Most Recent" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="recent" className="text-white">Most Recent</SelectItem>
                  <SelectItem value="viewers" className="text-white">Most Viewers</SelectItem>
                  <SelectItem value="donations" className="text-white">Most Donations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Active Filters Display */}
        {Object.keys(filters).filter(k => filters[k]).length > 0 && (
          <div className="pt-3 border-t border-slate-700">
            <Label className="text-white text-sm font-semibold mb-2 block">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).filter(([_, value]) => value).map(([key, value]) => (
                <Badge key={key} variant="outline" className="border-cyan-500/30 text-cyan-400">
                  {key}: {value}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => updateFilter(key, null)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}