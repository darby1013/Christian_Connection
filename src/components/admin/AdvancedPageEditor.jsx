import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Code, Eye, Save, RotateCcw, History, Download, Upload, 
  RefreshCw, CheckCircle, AlertTriangle, Smartphone, Monitor,
  Tablet, Layers, FileCode, Image as ImageIcon, Type, Palette,
  Settings, Maximize2, Copy, Trash2, Undo, Redo, Search,
  ExternalLink, Play, Pause, Zap, Lock, Unlock, ChevronLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdvancedPageEditor({ pageName, onClose }) {
  const [currentCode, setCurrentCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [editMode, setEditMode] = useState('visual'); // visual, code, split
  const [hasChanges, setHasChanges] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isLocked, setIsLocked] = useState(false);

  const iframeRef = useRef(null);
  const codeEditorRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch page backups
  const { data: backups = [] } = useQuery({
    queryKey: ['pageBackups', pageName],
    queryFn: () => base44.entities.PageBackup.filter({ page_name: pageName }, '-created_date'),
    initialData: [],
  });

  // Fetch current page file
  useEffect(() => {
    const fetchPageCode = async () => {
      try {
        const response = await fetch(`/pages/${pageName}.js`);
        const code = await response.text();
        setCurrentCode(code);
        setOriginalCode(code);
        setUndoStack([code]);
      } catch (error) {
        console.error('Error fetching page code:', error);
      }
    };

    if (pageName) {
      fetchPageCode();
    }
  }, [pageName]);

  // Auto-save backup mutation
  const createBackupMutation = useMutation({
    mutationFn: (data) => base44.entities.PageBackup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageBackups'] });
    },
  });

  // Create customization mutation
  const createCustomizationMutation = useMutation({
    mutationFn: (data) => base44.entities.PageCustomization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageCustomizations'] });
    },
  });

  const handleCodeChange = (newCode) => {
    if (isLocked) return;
    
    setCurrentCode(newCode);
    setHasChanges(newCode !== originalCode);
    
    // Add to undo stack
    setUndoStack(prev => [...prev, newCode]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    
    const newStack = [...undoStack];
    const current = newStack.pop();
    const previous = newStack[newStack.length - 1];
    
    setRedoStack(prev => [current, ...prev]);
    setUndoStack(newStack);
    setCurrentCode(previous);
    setHasChanges(previous !== originalCode);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const [next, ...rest] = redoStack;
    setUndoStack(prev => [...prev, next]);
    setRedoStack(rest);
    setCurrentCode(next);
    setHasChanges(next !== originalCode);
  };

  const handleSave = async () => {
    // Create backup
    await createBackupMutation.mutateAsync({
      page_name: pageName,
      page_code: originalCode,
      backup_type: 'pre_edit',
      version_number: backups.length + 1,
      description: backupDescription || `Pre-save backup ${new Date().toLocaleString()}`,
      file_size_kb: Math.round(new Blob([originalCode]).size / 1024),
      changes_summary: `Edited via Page Editor`,
      is_current: false
    });

    // Save new version
    await createBackupMutation.mutateAsync({
      page_name: pageName,
      page_code: currentCode,
      backup_type: 'manual',
      version_number: backups.length + 2,
      description: backupDescription || `Saved ${new Date().toLocaleString()}`,
      file_size_kb: Math.round(new Blob([currentCode]).size / 1024),
      changes_summary: `Manual save`,
      is_current: true
    });

    setOriginalCode(currentCode);
    setHasChanges(false);
    setSaveDialogOpen(false);
    setBackupDescription('');
    
    alert('✅ Page saved successfully!\n\n⚠️ Note: Changes are saved as backups. To apply to the actual page file, use the "Deploy to Production" feature.');
  };

  const handleRevert = () => {
    if (confirm('Revert all changes? This will restore the original code.')) {
      setCurrentCode(originalCode);
      setHasChanges(false);
      setUndoStack([originalCode]);
      setRedoStack([]);
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (confirm(`Restore backup from ${new Date(backup.created_date).toLocaleString()}?`)) {
      setCurrentCode(backup.page_code);
      setHasChanges(backup.page_code !== originalCode);
      setUndoStack([backup.page_code]);
      setRedoStack([]);
    }
  };

  const handleFindReplace = () => {
    if (!searchTerm) return;
    
    const newCode = currentCode.replace(new RegExp(searchTerm, 'g'), replaceText);
    handleCodeChange(newCode);
  };

  const handleDownloadBackup = (backup) => {
    const blob = new Blob([backup.page_code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageName}_v${backup.version_number}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const code = event.target.result;
      handleCodeChange(code);
    };
    reader.readAsText(file);
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  const formatCode = () => {
    // Basic code formatting (in real app, use prettier)
    try {
      const formatted = currentCode
        .replace(/\s+/g, ' ')
        .replace(/\{\s+/g, '{\n  ')
        .replace(/\s+\}/g, '\n}')
        .replace(/;\s+/g, ';\n  ');
      handleCodeChange(formatted);
    } catch (error) {
      alert('Error formatting code');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e27] z-50 overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-[#1a1f3a] border-b border-slate-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-bold text-lg">{pageName} Editor</h2>
              {hasChanges && (
                <Badge className="bg-amber-500">Unsaved Changes</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              className="text-slate-300"
            >
              <Undo className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="text-slate-300"
            >
              <Redo className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-slate-700" />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsLocked(!isLocked)}
              className={isLocked ? "text-red-400" : "text-slate-300"}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleRevert}
              disabled={!hasChanges}
              className="text-slate-300"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Revert
            </Button>

            <Button
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              disabled={!hasChanges || isLocked}
              className="bg-green-500 hover:bg-green-600"
            >
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Edit Mode Selector */}
        <div className="flex items-center gap-2 mt-3">
          <Tabs value={editMode} onValueChange={setEditMode} className="w-full">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="visual" className="data-[state=active]:bg-cyan-500">
                <Eye className="w-4 h-4 mr-1" />
                Visual Editor
              </TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-cyan-500">
                <Code className="w-4 h-4 mr-1" />
                Code Editor
              </TabsTrigger>
              <TabsTrigger value="split" className="data-[state=active]:bg-cyan-500">
                <Layers className="w-4 h-4 mr-1" />
                Split View
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Preview Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            <Button
              size="sm"
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              onClick={() => setPreviewMode('mobile')}
              className={previewMode === 'mobile' ? 'bg-cyan-500' : ''}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              onClick={() => setPreviewMode('tablet')}
              className={previewMode === 'tablet' ? 'bg-cyan-500' : ''}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              onClick={() => setPreviewMode('desktop')}
              className={previewMode === 'desktop' ? 'bg-cyan-500' : ''}
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-[#1a1f3a] border-r border-slate-700 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Find & Replace */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Find & Replace
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <Input
                  placeholder="Find..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-8"
                />
                <Input
                  placeholder="Replace with..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-8"
                />
                <Button
                  size="sm"
                  onClick={handleFindReplace}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 h-8"
                >
                  Replace All
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={formatCode}
                  className="w-full justify-start border-slate-700 text-slate-300 text-sm h-8"
                >
                  <Code className="w-3 h-3 mr-2" />
                  Format Code
                </Button>
                
                <label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start border-slate-700 text-slate-300 text-sm h-8"
                    asChild
                  >
                    <span>
                      <Upload className="w-3 h-3 mr-2" />
                      Upload File
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".js,.jsx"
                    onChange={handleUploadFile}
                    className="hidden"
                  />
                </label>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadBackup({ page_code: currentCode, version_number: 'current' })}
                  className="w-full justify-start border-slate-700 text-slate-300 text-sm h-8"
                >
                  <Download className="w-3 h-3 mr-2" />
                  Download Current
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(currentCode);
                    alert('Code copied to clipboard!');
                  }}
                  className="w-full justify-start border-slate-700 text-slate-300 text-sm h-8"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copy Code
                </Button>
              </CardContent>
            </Card>

            {/* Version History */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {backups.length === 0 ? (
                  <p className="text-slate-500 text-xs">No backups yet</p>
                ) : (
                  backups.slice(0, 10).map((backup) => (
                    <div
                      key={backup.id}
                      className="p-2 bg-slate-900/50 rounded border border-slate-700 hover:border-cyan-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">
                            v{backup.version_number}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(backup.created_date).toLocaleString()}
                          </p>
                        </div>
                        {backup.is_current && (
                          <Badge className="bg-green-500 text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                        {backup.description}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleRestoreBackup(backup)}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 h-6 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadBackup(backup)}
                          className="border-slate-700 h-6"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {editMode === 'code' && (
            <div className="flex-1 overflow-hidden">
              <Textarea
                ref={codeEditorRef}
                value={currentCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={isLocked}
                className="w-full h-full font-mono text-sm bg-slate-900 text-white border-0 resize-none p-4"
                style={{ minHeight: '100%' }}
              />
            </div>
          )}

          {editMode === 'visual' && (
            <div className="flex-1 overflow-auto bg-slate-900 p-4">
              <div 
                className="mx-auto bg-white transition-all duration-300"
                style={{ width: getPreviewWidth(), minHeight: '100%' }}
              >
                <Alert className="mb-4">
                  <AlertDescription>
                    Visual editor coming soon. Use Code Editor to edit page content.
                  </AlertDescription>
                </Alert>
                <iframe
                  ref={iframeRef}
                  srcDoc={currentCode}
                  className="w-full h-full border-0"
                  style={{ minHeight: '600px' }}
                  title="Preview"
                />
              </div>
            </div>
          )}

          {editMode === 'split' && (
            <div className="flex-1 flex">
              <div className="w-1/2 border-r border-slate-700 overflow-hidden">
                <Textarea
                  value={currentCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={isLocked}
                  className="w-full h-full font-mono text-sm bg-slate-900 text-white border-0 resize-none p-4"
                />
              </div>
              <div className="w-1/2 overflow-auto bg-slate-900 p-4">
                <div 
                  className="mx-auto bg-white"
                  style={{ width: getPreviewWidth() }}
                >
                  <iframe
                    srcDoc={currentCode}
                    className="w-full border-0"
                    style={{ minHeight: '600px' }}
                    title="Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white font-bold flex items-center gap-2">
              <Save className="w-5 h-5 text-green-400" />
              Save Page Changes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white mb-2 block">Backup Description</Label>
              <Input
                placeholder="Describe your changes..."
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <Alert className="bg-blue-900/20 border-blue-500/30">
              <AlertDescription className="text-blue-200 text-sm">
                <strong>Note:</strong> Changes are saved as versioned backups. To deploy changes to the live page, use the "Deploy to Production" feature in Site Settings.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}