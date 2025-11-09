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
  FileText, Plus, Search, TrendingUp, Eye, Edit, Trash2,
  Upload, ThumbsUp, MessageSquare, Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminBlog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    author_name: '',
    status: 'draft',
    category: '',
    tags: []
  });

  const queryClient = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.list('-published_date'),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPostForm(prev => ({ ...prev, featured_image: file_url }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const handleSubmit = () => {
    const data = {
      ...postForm,
      published_date: postForm.status === 'published' ? new Date().toISOString() : null
    };
    
    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data });
    } else {
      createPostMutation.mutate(data);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setPostForm(post);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setPostForm({
      title: '',
      content: '',
      excerpt: '',
      featured_image: '',
      author_name: '',
      status: 'draft',
      category: '',
      tags: []
    });
    setEditingPost(null);
  };

  const filteredPosts = posts.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Blog Management</h2>
          <p className="text-slate-400 font-semibold">Create and manage blog posts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Post Title *</Label>
                <Input
                  placeholder="Post title"
                  value={postForm.title}
                  onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Excerpt</Label>
                <Textarea
                  placeholder="Short summary..."
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({...postForm, excerpt: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-20"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Content *</Label>
                <Textarea
                  placeholder="Post content..."
                  value={postForm.content}
                  onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-64"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Author Name</Label>
                  <Input
                    placeholder="Author name"
                    value={postForm.author_name}
                    onChange={(e) => setPostForm({...postForm, author_name: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Category</Label>
                  <Input
                    placeholder="e.g., Faith"
                    value={postForm.category}
                    onChange={(e) => setPostForm({...postForm, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Featured Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {postForm.featured_image && (
                  <img src={postForm.featured_image} alt="Featured" className="mt-2 w-full h-48 object-cover rounded" />
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Status</Label>
                <select
                  value={postForm.status}
                  onChange={(e) => setPostForm({...postForm, status: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!postForm.title || !postForm.content} className="bg-cyan-500 hover:bg-cyan-600">
                {editingPost ? 'Update' : 'Create'} Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500">{posts.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{posts.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Posts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalViews.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Views</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ThumbsUp className="w-8 h-8 text-pink-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalLikes}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Likes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{draftPosts}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{draftPosts}</p>
            <p className="text-slate-400 text-sm font-semibold">Drafts</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="bg-[#1a1f3a] border-slate-700">
            <div className="flex gap-4 p-5">
              <div className="w-32 h-32 bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden">
                {post.featured_image ? (
                  <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-slate-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-bold text-lg line-clamp-2">{post.title}</h3>
                  <Badge className={post.status === 'published' ? 'bg-green-500' : 'bg-amber-500'}>
                    {post.status}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{post.excerpt || post.content?.slice(0, 100)}</p>
                <div className="flex items-center gap-4 text-slate-400 text-sm mb-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {post.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {post.comments_count || 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(post)} className="bg-cyan-500 hover:bg-cyan-600">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(post.id)}
                    className="border-red-500/30 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Blog Posts</h3>
            <p className="text-slate-400 mb-6">Start writing your first post</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Post
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}