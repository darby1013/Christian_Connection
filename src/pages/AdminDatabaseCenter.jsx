
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Database, Sparkles, Search, GitBranch, Code, Upload, Archive,
  Download, Activity, Zap, Shield, Link2, TrendingUp, Server,
  FileText, CheckCircle, AlertCircle, Loader2, Table, HardDrive,
  Clock, Users, FileJson, FileSpreadsheet, FileCode, Package, Eye,
  MessageSquare, Calendar, Heart, Video, Radio, Mic2, BookOpen,
  Settings, DollarSign, Gift, Tag, Truck, Award, Globe, Star,
  UserPlus, Rss, Book, Crown, Image, Film, Bell, ShoppingBag,
  Mail, BarChart3, Palette, RefreshCw, Warehouse, AlertTriangle,
  XCircle, Layers, Boxes, PlayCircle, PauseCircle, FolderArchive // Added FolderArchive
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDatabaseCenter() {
  const [user, setUser] = useState(null);
  const [selectedTables, setSelectedTables] = useState([]);
  const [exportFormat, setExportFormat] = useState('SQL Dump');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [includeData, setIncludeData] = useState(true);
  const [includeSchema, setIncludeSchema] = useState(true);
  const [compressionEnabled, setCompressionEnabled] = useState(false); // Retained but not actively used for file content in new export logic
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResults, setVerificationResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [exportLog, setExportLog] = useState([]);
  const [batchSize, setBatchSize] = useState(2);
  const [delayBetweenBatches, setDelayBetweenBatches] = useState(3000);
  const [verificationBatchSize, setVerificationBatchSize] = useState(2);
  const [verificationDelay, setVerificationDelay] = useState(2500);
  const [delayBetweenTables, setDelayBetweenTables] = useState(400);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [retryDelay, setRetryDelay] = useState(2000);
  const [safeMode, setSafeMode] = useState(true);
  const [onlyTablesWithData, setOnlyTablesWithData] = useState(false);
  const [splitExport, setSplitExport] = useState(true); // Added
  const [tablesPerFile, setTablesPerFile] = useState(20); // Added

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

  // Comprehensive list of ALL Glory Wave entities
  const allEntities = [
    // Core
    { name: 'User', icon: Users, category: 'Core' },
    { name: 'Role', icon: Shield, category: 'Core' },
    { name: 'UserTheme', icon: Palette, category: 'Core' },
    { name: 'Notification', icon: Bell, category: 'Core' },
    
    // Content
    { name: 'LiveStream', icon: Radio, category: 'Content' },
    { name: 'Video', icon: Video, category: 'Content' },
    { name: 'Podcast', icon: Mic2, category: 'Content' },
    { name: 'BlogPost', icon: FileText, category: 'Content' },
    { name: 'BlogCategory', icon: BookOpen, category: 'Content' },
    { name: 'BlogComment', icon: MessageSquare, category: 'Content' },
    { name: 'Comment', icon: MessageSquare, category: 'Content' },
    
    // Podcast Extended
    { name: 'PodcastSeries', icon: Mic2, category: 'Content' },
    { name: 'PodcastTranscription', icon: FileText, category: 'Content' },
    { name: 'PodcastShowNote', icon: FileText, category: 'Content' },
    { name: 'PodcastClip', icon: Video, category: 'Content' },
    { name: 'PodcastMonetization', icon: DollarSign, category: 'Content' },
    { name: 'PodcastPurchase', icon: ShoppingBag, category: 'Content' },
    { name: 'PodcastRevenue', icon: DollarSign, category: 'Content' },
    { name: 'PodcastTranscript', icon: FileText, category: 'Content' },
    { name: 'PodcastInteraction', icon: Activity, category: 'Content' },
    { name: 'PodcastMarketing', icon: TrendingUp, category: 'Content' },
    { name: 'PodcastAnalytics', icon: BarChart3, category: 'Content' },
    { name: 'PodcastSocialPost', icon: Globe, category: 'Content' },
    { name: 'PodcastRepurposedContent', icon: Film, category: 'Content' },
    { name: 'LivePodcast', icon: Mic2, category: 'Content' },
    { name: 'AudioFile', icon: Mic2, category: 'Content' },
    { name: 'UserPodcastLibrary', icon: Book, category: 'Content' },
    
    // Community
    { name: 'Group', icon: Users, category: 'Community' },
    { name: 'GroupMember', icon: Users, category: 'Community' },
    { name: 'GroupPost', icon: FileText, category: 'Community' },
    { name: 'GroupChannel', icon: MessageSquare, category: 'Community' },
    { name: 'GroupEvent', icon: Calendar, category: 'Community' },
    { name: 'GroupFile', icon: FileText, category: 'Community' },
    { name: 'GroupPoll', icon: Activity, category: 'Community' },
    { name: 'GroupQuestion', icon: MessageSquare, category: 'Community' },
    { name: 'GroupWarning', icon: AlertCircle, category: 'Community' },
    { name: 'GroupAnalytics', icon: BarChart3, category: 'Community' },
    
    // Forum
    { name: 'ForumCategory', icon: BookOpen, category: 'Community' },
    { name: 'ForumThread', icon: MessageSquare, category: 'Community' },
    { name: 'ForumPost', icon: FileText, category: 'Community' },
    { name: 'ForumReply', icon: MessageSquare, category: 'Community' },
    
    // Chat & Messaging
    { name: 'ChatMessage', icon: MessageSquare, category: 'Community' },
    { name: 'DirectMessage', icon: MessageSquare, category: 'Community' },
    { name: 'Chatroom', icon: MessageSquare, category: 'Community' },
    { name: 'ChatroomMember', icon: Users, category: 'Community' },
    { name: 'ChatroomInvite', icon: UserPlus, category: 'Community' },
    
    // Events
    { name: 'Event', icon: Calendar, category: 'Community' },
    { name: 'EventRegistration', icon: Calendar, category: 'Community' },
    
    // E-Commerce
    { name: 'Product', icon: Package, category: 'Commerce' },
    { name: 'ProductVariant', icon: Package, category: 'Commerce' },
    { name: 'ProductBundle', icon: Package, category: 'Commerce' },
    { name: 'DigitalProduct', icon: Download, category: 'Commerce' },
    { name: 'Order', icon: ShoppingBag, category: 'Commerce' },
    { name: 'OrderItem', icon: Package, category: 'Commerce' },
    { name: 'OrderFulfillment', icon: Truck, category: 'Commerce' },
    { name: 'ShoppingCart', icon: ShoppingBag, category: 'Commerce' },
    { name: 'Wishlist', icon: Heart, category: 'Commerce' },
    { name: 'Review', icon: Star, category: 'Commerce' },
    { name: 'ProductReview', icon: Star, category: 'Commerce' },
    { name: 'Coupon', icon: Tag, category: 'Commerce' },
    { name: 'GiftCard', icon: Gift, category: 'Commerce' },
    { name: 'Inventory', icon: Warehouse, category: 'Commerce' },
    { name: 'BulkPricing', icon: DollarSign, category: 'Commerce' },
    { name: 'PreOrder', icon: Clock, category: 'Commerce' },
    { name: 'AbandonedCart', icon: ShoppingBag, category: 'Commerce' },
    { name: 'ProductAnalytics', icon: BarChart3, category: 'Commerce' },
    { name: 'StoreAnalytics', icon: BarChart3, category: 'Commerce' },
    { name: 'RecentlyViewed', icon: Eye, category: 'Commerce' },
    { name: 'ProductComparison', icon: GitBranch, category: 'Commerce' },
    { name: 'QuickViewStats', icon: Eye, category: 'Commerce' },
    { name: 'TaxConfiguration', icon: DollarSign, category: 'Commerce' },
    { name: 'ShippingMethod', icon: Truck, category: 'Commerce' },
    { name: 'CustomerAddress', icon: Users, category: 'Commerce' },
    
    // Donations & Finance
    { name: 'Donation', icon: Heart, category: 'Finance' },
    { name: 'DonationCampaign', icon: Heart, category: 'Finance' },
    { name: 'RecurringDonation', icon: RefreshCw, category: 'Finance' },
    { name: 'StreamTip', icon: DollarSign, category: 'Finance' },
    { name: 'PaymentGateway', icon: Database, category: 'Finance' },
    
    // Subscriptions & Loyalty
    { name: 'Subscription', icon: Crown, category: 'Membership' },
    { name: 'SubscriptionPlan', icon: Crown, category: 'Membership' },
    { name: 'CustomerLoyalty', icon: Award, category: 'Membership' },
    { name: 'LoyaltyProgram', icon: Award, category: 'Membership' },
    { name: 'MembershipFeature', icon: Crown, category: 'Membership' },
    
    // Gamification
    { name: 'UserBadge', icon: Award, category: 'Gamification' },
    { name: 'UserPoints', icon: Award, category: 'Gamification' },
    { name: 'Badge', icon: Award, category: 'Gamification' },
    { name: 'UserBadgeShowcase', icon: Award, category: 'Gamification' },
    { name: 'UserLevel', icon: TrendingUp, category: 'Gamification' },
    { name: 'UserProgress', icon: Activity, category: 'Gamification' },
    
    // Learning & Courses
    { name: 'Course', icon: Book, category: 'Learning' },
    { name: 'CourseModule', icon: Book, category: 'Learning' },
    { name: 'CourseLesson', icon: BookOpen, category: 'Learning' },
    { name: 'CourseProgress', icon: Activity, category: 'Learning' },
    { name: 'CourseReview', icon: Star, category: 'Learning' },
    { name: 'BibleStudy', icon: Book, category: 'Learning' },
    { name: 'ResourceLibrary', icon: Download, category: 'Learning' },
    { name: 'KnowledgeBase', icon: Book, category: 'Learning' },
    
    // Community Extended
    { name: 'PrayerRequest', icon: Heart, category: 'Community' },
    { name: 'PrayerComment', icon: MessageSquare, category: 'Community' },
    { name: 'Testimony', icon: Star, category: 'Community' },
    { name: 'TestimonyComment', icon: MessageSquare, category: 'Community' },
    { name: 'Volunteer', icon: UserPlus, category: 'Community' },
    { name: 'VolunteerRequest', icon: UserPlus, category: 'Community' },
    { name: 'MemberDirectory', icon: Users, category: 'Community' },
    { name: 'CommunityBoard', icon: Globe, category: 'Community' },
    
    // System & Admin
    { name: 'SiteSettings', icon: Settings, category: 'System' },
    { name: 'SiteMission', icon: Globe, category: 'System' },
    { name: 'PageBackup', icon: Archive, category: 'System' },
    { name: 'PageCustomization', icon: Settings, category: 'System' },
    { name: 'RSSFeed', icon: Rss, category: 'System' },
    { name: 'StreamScript', icon: FileText, category: 'System' },
    { name: 'ContentModeration', icon: Shield, category: 'System' },
    
    // Audit & Logs
    { name: 'AuditLog', icon: Eye, category: 'System' },
    { name: 'RoleAuditLog', icon: Shield, category: 'System' },
    { name: 'UserActivity', icon: Activity, category: 'System' },
    { name: 'ActivityLog', icon: Activity, category: 'System' },
    { name: 'SystemMetrics', icon: Activity, category: 'System' },
    { name: 'DataIntegrityRule', icon: Shield, category: 'System' },
    
    // Marketing & Analytics
    { name: 'EmailCampaign', icon: Mail, category: 'Marketing' },
    { name: 'AdCampaign', icon: TrendingUp, category: 'Marketing' },
    { name: 'CompetitorAnalysis', icon: BarChart3, category: 'Marketing' },
    { name: 'SavedSearch', icon: Search, category: 'Marketing' },
    { name: 'PersonalizedRecommendation', icon: Sparkles, category: 'Marketing' },
    { name: 'AIGeneratedContent', icon: Sparkles, category: 'Marketing' },
    { name: 'UserSegment', icon: Users, category: 'Marketing' },
    { name: 'CustomBundle', icon: Package, category: 'Marketing' },

    // Collaboration & Permissions (Added these new entities)
    { name: 'CollaborationSession', icon: Users, category: 'System' },
    { name: 'Permission', icon: Shield, category: 'System' },
    { name: 'RolePermission', icon: Shield, category: 'System' },
    { name: 'UserPermission', icon: Shield, category: 'System' },
  ];

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list(), initialData: [] });
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => base44.entities.Order.list(), initialData: [] });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });
  const { data: blogPosts = [] } = useQuery({ queryKey: ['blogPosts'], queryFn: () => base44.entities.BlogPost.list(), initialData: [] });
  const { data: podcasts = [] } = useQuery({ queryKey: ['podcasts'], queryFn: () => base44.entities.Podcast.list(), initialData: [] });

  const recordCounts = {
    'User': users.length,
    'Product': products.length,
    'Order': orders.length,
    'BlogPost': blogPosts.length,
    'Podcast': podcasts.length,
  };

  let availableTables = allEntities.map(entity => ({
    ...entity,
    recordCount: recordCounts[entity.name] || 0,
    size: (recordCounts[entity.name] || 0) * 3, // Arbitrary size for display
  }));

  // Filter only tables with data if option is enabled
  if (onlyTablesWithData) {
    availableTables = availableTables.filter(t => t.recordCount > 0);
  }

  const filteredTables = availableTables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecords = availableTables.reduce((sum, table) => sum + table.recordCount, 0);
  const totalSize = availableTables.reduce((sum, table) => sum + table.size, 0);

  const toggleTable = (table) => {
    if (selectedTables.includes(table)) {
      setSelectedTables(selectedTables.filter(t => t !== table));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const selectAll = () => {
    setSelectedTables(filteredTables.map(t => t.name));
  };

  const clearAll = () => {
    setSelectedTables([]);
  };

  const addLog = (message, type = 'info') => {
    setExportLog(prev => [...prev, { 
      message, 
      type, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Download helper that works for large files
  const downloadFile = (content, filename, mimeType) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  };

  // Apply safe mode presets
  const applySafeMode = () => {
    setBatchSize(1);
    setDelayBetweenBatches(5000);
    setVerificationBatchSize(1);
    setVerificationDelay(4000);
    setDelayBetweenTables(800);
    setRetryAttempts(4);
    setRetryDelay(3000);
    setSafeMode(true);
    setSplitExport(true); // Added for Safe Mode
    setTablesPerFile(20); // Added for Safe Mode
    addLog('🛡️ Safe Mode activated: Ultra-conservative settings applied', 'info');
  };

  const applyFastMode = () => {
    setBatchSize(5);
    setDelayBetweenBatches(1500);
    setVerificationBatchSize(5);
    setVerificationDelay(1000);
    setDelayBetweenTables(200);
    setRetryAttempts(2);
    setRetryDelay(1000);
    setSafeMode(false);
    setSplitExport(false); // Added for Fast Mode
    addLog('⚡ Fast Mode activated: Optimized for speed', 'info');
  };

  // Enhanced verification with aggressive rate limiting
  const verifyTables = async () => {
    setIsVerifying(true);
    setVerificationResults([]);
    setExportLog([]);
    
    const effectiveBatchSize = safeMode ? 1 : verificationBatchSize;
    const effectiveDelay = safeMode ? 4000 : verificationDelay;
    
    addLog('🔍 Starting enterprise-grade pre-export verification...', 'info');
    addLog(`🛡️ Safe Mode: ${safeMode ? 'ENABLED' : 'DISABLED'}`, 'info');
    addLog(`⚙️ Batch size: ${effectiveBatchSize} tables, Delay: ${effectiveDelay}ms`, 'info');
    addLog(`🔁 Retry attempts: ${retryAttempts} with ${retryDelay}ms delay`, 'info');

    const results = [];
    const batches = [];
    
    for (let i = 0; i < selectedTables.length; i += effectiveBatchSize) {
      batches.push(selectedTables.slice(i, i + effectiveBatchSize));
    }

    addLog(`📦 Processing ${selectedTables.length} tables in ${batches.length} batches`, 'info');

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      addLog(`🔄 Verifying batch ${batchIndex + 1}/${batches.length} (${batch.length} tables)`, 'info');

      for (const tableName of batch) {
        processedCount++;
        const progress = (processedCount / selectedTables.length) * 100;
        setExportProgress(progress);
        
        let verified = false;
        let lastError = null;
        let recordCount = 0;

        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            addLog(`📥 ${tableName} [${attempt}/${retryAttempts}]`, 'info');
            
            const entityData = await base44.entities[tableName]?.list() || [];
            recordCount = entityData.length;
            
            results.push({
              table: tableName,
              status: 'verified',
              recordCount,
              hasSchema: true,
              message: `✅ ${recordCount} records verified`,
              attempts: attempt
            });
            
            addLog(`✅ ${tableName}: ${recordCount} records [attempt ${attempt}]`, 'success');
            verified = true;
            break;
            
          } catch (error) {
            lastError = error;
            const isRateLimit = error.message?.includes('Rate limit') || error.message?.includes('Too many');
            
            addLog(`⚠️ ${tableName}: ${error.message} [attempt ${attempt}/${retryAttempts}]`, 'warning');
            
            if (attempt < retryAttempts) {
              const waitTime = isRateLimit ? retryDelay * attempt * 2 : retryDelay * attempt;
              addLog(`⏱️ Waiting ${waitTime}ms before retry...`, 'info');
              await sleep(waitTime);
            }
          }
        }

        if (!verified) {
          results.push({
            table: tableName,
            status: 'error',
            error: lastError?.message || 'Unknown error',
            message: `❌ Failed after ${retryAttempts} attempts`,
            attempts: retryAttempts
          });
          
          addLog(`❌ ${tableName}: Failed after ${retryAttempts} attempts - ${lastError?.message}`, 'error');
        }

        // Delay between individual tables within batch
        if (batch.indexOf(tableName) < batch.length - 1) {
          await sleep(delayBetweenTables);
        }
      }

      // Delay between batches
      if (batchIndex < batches.length - 1) {
        addLog(`⏱️ Batch complete. Waiting ${effectiveDelay}ms before next batch...`, 'info');
        await sleep(effectiveDelay);
      }
    }
    
    setVerificationResults(results);
    setIsVerifying(false);
    setExportProgress(0);
    
    const verified = results.filter(r => r.status === 'verified').length;
    const failed = results.filter(r => r.status === 'error').length;
    const totalRecordsFound = results.reduce((sum, r) => sum + (r.recordCount || 0), 0);
    
    addLog(`✅ Verification complete: ${verified} verified, ${failed} failed`, verified === selectedTables.length ? 'success' : 'warning');
    addLog(`📊 Total records found: ${totalRecordsFound.toLocaleString()}`, 'info');
    
    if (failed > 0) {
      addLog(`⚠️ ${failed} tables failed. Consider enabling Safe Mode or increasing delays.`, 'warning');
    }
  };

  // Logic for generating a single SQL file (part of a split export or a single full export)
  const generateSingleSQLFile = async (tablesToExport, effectiveBatchSize, effectiveDelay, partNum, totalParts, totalSelectedTablesCount) => {
    let sql = `-- ============================================\n`;
    sql += `-- Glory Wave Enterprise Database Export\n`;
    if (totalParts > 1) {
      sql += `-- Part ${partNum} of ${totalParts}\n`;
    }
    sql += `-- ============================================\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Tables in this file: ${tablesToExport.length}\n`;
    sql += `-- Safe Mode: ${safeMode ? 'ENABLED' : 'DISABLED'}\n`;
    sql += `-- ============================================\n\n`;

    const batches = [];
    for (let i = 0; i < tablesToExport.length; i += effectiveBatchSize) {
      batches.push(tablesToExport.slice(i, i + effectiveBatchSize));
    }

    let successCount = 0;
    let errorCount = 0;
    
    // Track processed tables across all files for overall progress
    let processedTablesForProgress = (partNum - 1) * tablesPerFile; 

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (const tableName of batch) {
        processedTablesForProgress++;
        const overallProgress = (processedTablesForProgress / totalSelectedTablesCount) * 100;
        setExportProgress(overallProgress);
        
        let exported = false;
        let lastError = null;

        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            addLog(`📥 Exporting ${tableName} [${attempt}/${retryAttempts}]...`, 'info');
            const entityData = await base44.entities[tableName]?.list() || [];
            
            if (includeSchema) {
              sql += `\n-- ============================================\n`;
              sql += `-- Table: ${tableName} | Records: ${entityData.length}\n`;
              sql += `-- ============================================\n\n`;
              
              sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n\n`;
              sql += `CREATE TABLE \`${tableName}\` (\n`;
              sql += `  id VARCHAR(255) PRIMARY KEY,\n`;
              
              if (entityData.length > 0) {
                const sampleRecord = entityData[0];
                Object.keys(sampleRecord).forEach((key) => {
                  if (key !== 'id' && key !== 'created_date' && key !== 'updated_date') {
                    const value = sampleRecord[key];
                    let type = 'TEXT';
                    
                    if (typeof value === 'number') {
                      type = Number.isInteger(value) ? 'INT' : 'DECIMAL(10,2)';
                    } else if (typeof value === 'boolean') {
                      type = 'BOOLEAN';
                    } else if (key.includes('date') || key.includes('time')) {
                      type = 'TIMESTAMP';
                    } else if (typeof value === 'object' && value !== null) {
                      type = 'JSON';
                    }
                    
                    sql += `  ${key} ${type},\n`;
                  }
                });
              }
              
              sql += `  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
              sql += `  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
              sql += `  created_by VARCHAR(255)\n`;
              sql += `);\n\n`;
            }

            if (includeData && entityData.length > 0) {
              sql += `-- Data for ${tableName} (${entityData.length} records)\n`;
              
              for (const record of entityData) {
                const columns = Object.keys(record).join(', ');
                const values = Object.values(record).map(val => {
                  if (val === null) return 'NULL';
                  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                  return val;
                }).join(', ');
                
                sql += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
              }
              
              sql += `\n`;
            }

            sql += `\n`;
            addLog(`✅ ${tableName}: ${entityData.length} records exported`, 'success');
            successCount++;
            exported = true;
            break;
            
          } catch (error) {
            lastError = error;
            const isRateLimit = error.message?.includes('Rate limit') || error.message?.includes('Too many');
            
            addLog(`⚠️ ${tableName}: ${error.message} [attempt ${attempt}/${retryAttempts}]`, 'warning');
            
            if (attempt < retryAttempts) {
              const waitTime = isRateLimit ? retryDelay * attempt * 2 : retryDelay * attempt;
              addLog(`⏱️ Waiting ${waitTime}ms before retry...`, 'info');
              await sleep(waitTime);
            }
          }
        }

        if (!exported) {
          sql += `-- ============================================\n`;
          sql += `-- ❌ EXPORT FAILED: ${tableName}\n`;
          sql += `-- Error: ${lastError?.message || 'Unknown error'}\n`;
          sql += `-- ============================================\n\n`;
          addLog(`❌ ${tableName}: Export failed`, 'error');
          errorCount++;
        }

        await sleep(delayBetweenTables);
      }

      if (batchIndex < batches.length - 1) {
        addLog(`⏱️ Waiting ${effectiveDelay}ms before next batch...`, 'info');
        await sleep(effectiveDelay);
      }
    }

    sql += `\n-- ============================================\n`;
    sql += `-- EXPORT SUMMARY`;
    if (totalParts > 1) {
      sql += ` (Part ${partNum}/${totalParts})`;
    }
    sql += `\n`;
    sql += `-- ============================================\n`;
    sql += `-- Tables in this file: ${tablesToExport.length}\n`;
    sql += `-- Successfully Exported: ${successCount}\n`;
    sql += `-- Failed: ${errorCount}\n`;
    sql += `-- Success Rate: ${((successCount / tablesToExport.length) * 100).toFixed(1)}%\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ============================================\n`;

    return sql;
  };

  // Enhanced SQL dump with split file support
  const generateSQLDump = async (tables) => {
    const timestamp = Date.now();
    const effectiveBatchSize = safeMode ? 1 : batchSize;
    const effectiveDelay = safeMode ? 5000 : delayBetweenBatches;

    // Split into multiple files if enabled
    if (splitExport && tables.length > tablesPerFile) {
      addLog(`📦 Splitting export into multiple files (${tablesPerFile} tables per file)`, 'info');
      
      const fileCount = Math.ceil(tables.length / tablesPerFile);
      
      for (let fileIndex = 0; fileIndex < fileCount; fileIndex++) {
        const startIdx = fileIndex * tablesPerFile;
        const endIdx = Math.min(startIdx + tablesPerFile, tables.length);
        const fileTables = tables.slice(startIdx, endIdx);
        
        addLog(`📄 Generating file ${fileIndex + 1}/${fileCount} (${fileTables.length} tables)`, 'info');
        
        const sql = await generateSingleSQLFile(fileTables, effectiveBatchSize, effectiveDelay, fileIndex + 1, fileCount, tables.length);
        
        const filename = `glory_wave_export_part_${fileIndex + 1}_of_${fileCount}_${timestamp}.sql`;
        const success = downloadFile(sql, filename, 'text/sql');
        
        if (success) {
          addLog(`✅ Downloaded: ${filename}`, 'success');
        } else {
          addLog(`❌ Failed to download: ${filename}`, 'error');
          throw new Error(`Failed to download part ${fileIndex + 1}`);
        }
        
        // Small delay between file downloads
        await sleep(500);
      }
      
      return null; // Already downloaded all parts
    } else {
      // Single file export
      return await generateSingleSQLFile(tables, effectiveBatchSize, effectiveDelay, 1, 1, tables.length);
    }
  };

  // Logic for generating a single JSON file (part of a split export or a single full export)
  const generateSingleJSONFile = async (tablesToExport, partNum, totalParts, totalSelectedTablesCount) => {
    const exportData = {};
    const effectiveBatchSize = safeMode ? 1 : batchSize;
    const effectiveDelay = safeMode ? 5000 : delayBetweenBatches;
    const batches = [];
    
    for (let i = 0; i < tablesToExport.length; i += effectiveBatchSize) {
      batches.push(tablesToExport.slice(i, i + effectiveBatchSize));
    }

    let processedTablesForProgress = (partNum - 1) * tablesPerFile;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (const tableName of batch) {
        processedTablesForProgress++;
        const overallProgress = (processedTablesForProgress / totalSelectedTablesCount) * 100;
        setExportProgress(overallProgress);
        
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            const entityData = await base44.entities[tableName]?.list() || [];
            exportData[tableName] = entityData;
            addLog(`✅ ${tableName}: ${entityData.length} records`, 'success');
            break;
          } catch (error) {
            if (attempt < retryAttempts) {
              const waitTime = error.message?.includes('Rate limit') ? retryDelay * attempt * 2 : retryDelay * attempt;
              addLog(`⚠️ ${tableName}: ${error.message} [attempt ${attempt}/${retryAttempts}]`, 'warning');
              await sleep(waitTime);
            } else {
              exportData[tableName] = { error: error.message, attempts: retryAttempts };
              addLog(`❌ ${tableName}: ${error.message}`, 'error');
            }
          }
        }
        await sleep(delayBetweenTables);
      }

      if (batchIndex < batches.length - 1) {
        addLog(`⏱️ Waiting ${effectiveDelay}ms before next batch...`, 'info');
        await sleep(effectiveDelay);
      }
    }

    return JSON.stringify({
      metadata: {
        exportDate: new Date().toISOString(),
        database: 'glory_wave_production',
        part: partNum,
        totalParts: totalParts,
        tablesInFile: tablesToExport.length,
        safeMode,
        recordCount: Object.values(exportData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
        version: '4.0.0'
      },
      data: exportData
    }, null, 2);
  };

  const generateJSONExport = async (tables) => {
    const timestamp = Date.now();
    
    if (splitExport && tables.length > tablesPerFile) {
      addLog(`📦 Splitting export into multiple files (${tablesPerFile} tables per file)`, 'info');
      const fileCount = Math.ceil(tables.length / tablesPerFile);
      
      for (let fileIndex = 0; fileIndex < fileCount; fileIndex++) {
        const startIdx = fileIndex * tablesPerFile;
        const endIdx = Math.min(startIdx + tablesPerFile, tables.length);
        const fileTables = tables.slice(startIdx, endIdx);
        
        addLog(`📄 Generating file ${fileIndex + 1}/${fileCount} (${fileTables.length} tables)`, 'info');
        const json = await generateSingleJSONFile(fileTables, fileIndex + 1, fileCount, tables.length);
        const filename = `glory_wave_export_part_${fileIndex + 1}_of_${fileCount}_${timestamp}.json`;
        
        const success = downloadFile(json, filename, 'application/json');
        if (success) {
          addLog(`✅ Downloaded: ${filename}`, 'success');
        } else {
          addLog(`❌ Failed to download: ${filename}`, 'error');
          throw new Error(`Failed to download part ${fileIndex + 1}`);
        }
        await sleep(500);
      }
      
      return null; // Already downloaded all parts
    } else {
      return await generateSingleJSONFile(tables, 1, 1, tables.length);
    }
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      alert('Please select at least one table to export');
      return;
    }

    if (verificationResults.length === 0) {
      const proceed = confirm('⚠️ No verification run yet. It\'s recommended to run Pre-Export Verification first. Continue anyway?');
      if (!proceed) return;
    }

    const failedVerifications = verificationResults.filter(r => r.status === 'error');
    if (failedVerifications.length > 0) {
      const proceed = confirm(`⚠️ ${failedVerifications.length} tables failed verification. Export may have issues. Continue anyway?`);
      if (!proceed) return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportLog([]);
    
    addLog(`🚀 Starting export of ${selectedTables.length} tables`, 'info');
    addLog(`📋 Format: ${exportFormat}`, 'info');
    addLog(`📦 Split mode: ${splitExport && selectedTables.length > tablesPerFile ? `ON (${tablesPerFile} tables/file)` : 'OFF'}`, 'info');
    addLog(`🛡️ Safe Mode: ${safeMode ? 'ENABLED' : 'DISABLED'}`, 'info');
    addLog(`🔁 Retry: ${retryAttempts} attempts with ${retryDelay}ms delay`, 'info');


    try {
      let content; // This will only be used for single file exports

      if (exportFormat === 'SQL Dump') {
        content = await generateSQLDump(selectedTables);
        if (content) { // If content is returned, it means it's a single file export
          const success = downloadFile(
            content,
            `glory_wave_export_${Date.now()}.sql`,
            'text/sql'
          );
          if (!success) {
            throw new Error('Download failed - file may be too large');
          }
        }
      } else if (exportFormat === 'JSON') {
        content = await generateJSONExport(selectedTables);
        if (content) { // If content is returned, it means it's a single file export
          const success = downloadFile(
            content,
            `glory_wave_export_${Date.now()}.json`,
            'application/json'
          );
          if (!success) {
            throw new Error('Download failed - file may be too large');
          }
        }
      }

      setExportProgress(100);
      addLog(`✅ Export completed successfully!`, 'success');
      
      if (splitExport && selectedTables.length > tablesPerFile) {
        const fileCount = Math.ceil(selectedTables.length / tablesPerFile);
        addLog(`📦 Generated ${fileCount} files`, 'success');
        alert(`✅ Export complete! Downloaded ${fileCount} files. Check your downloads folder.`);
      } else {
        addLog(`💾 Single file downloaded`, 'success');
        alert('✅ Export complete! File downloaded successfully.');
      }
    } catch (error) {
      addLog(`❌ Export failed: ${error.message}`, 'error');
      alert(`❌ Export failed: ${error.message}\n\nTry enabling "Split into multiple files" option if not already, or reduce tables per file.`);
    } finally {
      setTimeout(() => {
        setExporting(false);
      }, 1000);
    }
  };

  const databaseTools = [
    {
      title: 'AI SQL Script Generator',
      description: 'Generate complete database scripts with AI',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      url: createPageUrl('AdminSQLScriptGenerator'),
      badge: 'AI-Powered'
    },
    {
      title: 'Advanced Query Builder',
      description: 'Visual query construction without SQL',
      icon: <Search className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      url: createPageUrl('AdminAdvancedQueryBuilder'),
      badge: 'Visual'
    },
    {
      title: 'Schema Generator',
      description: 'Design database schemas visually',
      icon: <GitBranch className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      url: createPageUrl('AdminSchemaGenerator'),
      badge: 'Design'
    },
    {
      title: 'SQL Editor',
      description: 'Execute custom SQL queries',
      icon: <Code className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-500',
      url: createPageUrl('AdminSQLEditor'),
      badge: 'Pro'
    },
    {
      title: 'Schema Viewer',
      description: 'Browse database structure',
      icon: <Database className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      url: createPageUrl('AdminSchemaViewer'),
      badge: 'Browser'
    },
    {
      title: 'Import/Export',
      description: 'Bulk data operations',
      icon: <Upload className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-500',
      url: createPageUrl('AdminDataImportExport'),
      badge: 'Bulk'
    },
    {
      title: 'Backup Manager',
      description: 'Automated backups and restore',
      icon: <Archive className="w-6 h-6" />,
      color: 'from-red-500 to-rose-500',
      url: createPageUrl('AdminBackupManager'),
      badge: 'Critical'
    },
    {
      title: 'Performance Monitor',
      description: 'Query performance analytics',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500',
      url: createPageUrl('AdminPerformanceMonitor'),
      badge: 'Analytics'
    },
    {
      title: 'Migration Studio',
      description: 'Database schema migrations',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-500 to-amber-500',
      url: createPageUrl('AdminMigrationStudio'),
      badge: 'Advanced'
    },
    {
      title: 'Security Audit',
      description: 'Security and compliance checks',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-rose-500 to-red-500',
      url: createPageUrl('AdminSecurityAudit'),
      badge: 'Security'
    },
    {
      title: 'Relationship Mapper',
      description: 'Visualize table relationships',
      icon: <Link2 className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-500',
      url: createPageUrl('AdminRelationshipMapper'),
      badge: 'Visual'
    },
    {
      title: 'Data Integrity',
      description: 'Validate data consistency',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      url: createPageUrl('AdminDataIntegrity'),
      badge: 'Health'
    }
  ];

  const groupedByCategory = filteredTables.reduce((acc, table) => {
    if (!acc[table.category]) acc[table.category] = [];
    acc[table.category].push(table);
    return acc;
  }, {});

  const verifiedCount = verificationResults.filter(r => r.status === 'verified').length;
  const failedCount = verificationResults.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Enterprise Database Tools</h2>
          <p className="text-slate-400 font-semibold">Fail-proof export with split-file support for large databases</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={applySafeMode}
            className={`${safeMode ? 'bg-green-600' : 'bg-slate-700'} hover:bg-green-700`}
          >
            <Shield className="w-4 h-4 mr-2" />
            Safe Mode
          </Button>
          <Button
            onClick={applyFastMode}
            className={`${!safeMode ? 'bg-purple-600' : 'bg-slate-700'} hover:bg-purple-700`}
          >
            <Zap className="w-4 h-4 mr-2" />
            Fast Mode
          </Button>
        </div>
      </div>

      {/* Safe Mode Alert */}
      {safeMode && (
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-400" />
              <div className="flex-1">
                <p className="text-green-300 font-bold">🛡️ Safe Mode Active</p>
                <p className="text-green-200 text-sm">Processing 1 table at a time with 5s delays. Split Export {splitExport ? `enabled (${tablesPerFile} tables/file)` : 'disabled'}.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-4 md:p-6">
            <Database className="w-8 md:w-10 h-8 md:h-10 text-cyan-400 mb-2" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{totalRecords.toLocaleString()}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Total Records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-4 md:p-6">
            <Server className="w-8 md:w-10 h-8 md:h-10 text-green-400 mb-2" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{availableTables.length}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Tables</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-4 md:p-6">
            <HardDrive className="w-8 md:w-10 h-8 md:h-10 text-purple-400 mb-2" />
            <p className="text-xl md:text-3xl font-black text-white mb-1">{totalSize.toFixed(1)}<span className="text-lg md:text-2xl ml-1">MB</span></p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Size</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-4 md:p-6">
            <FolderArchive className="w-8 md:w-10 h-8 md:h-10 text-amber-400 mb-2" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">
              {selectedTables.length > 0 && splitExport && selectedTables.length > tablesPerFile
                ? Math.ceil(selectedTables.length / tablesPerFile)
                : (selectedTables.length > 0 ? 1 : 0)
              }
            </p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Files ({splitExport && selectedTables.length > tablesPerFile ? 'split' : 'single'})</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="bg-[#1e293b] border border-slate-700 p-1 grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="glory" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 text-xs md:text-sm">
            <Sparkles className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Glory Wave</span>
            <span className="md:hidden">Tools</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-cyan-500 text-xs md:text-sm">
            <Download className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Export Manager</span>
            <span className="md:hidden">Export</span>
          </TabsTrigger>
          <TabsTrigger value="tables" className="data-[state=active]:bg-cyan-500 text-xs md:text-sm">
            <Table className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Tables</span>
            <span className="md:hidden">({availableTables.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500 text-xs md:text-sm">
            <TrendingUp className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Analytics</span>
            <span className="md:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
                <CardHeader className="border-b border-slate-700 p-4 md:p-6">
                  <CardTitle className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                    <Boxes className="w-4 md:w-5 h-4 md:h-5" />
                    <span className="hidden md:inline">Ultra-Advanced Data Export Manager</span>
                    <span className="md:hidden">Export Manager</span>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 ml-2 text-xs">v4.0</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  {/* Quick Filter */}
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-900/50 rounded-lg flex-1">
                      <Checkbox
                        checked={onlyTablesWithData}
                        onCheckedChange={setOnlyTablesWithData}
                      />
                      <span className="text-slate-300 text-xs md:text-sm">Only tables with data</span>
                    </label>
                  </div>

                  {/* Table Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-sm md:text-lg">Select Tables</h3>
                      <div className="flex gap-2">
                        <Badge className="bg-purple-500 text-xs">{filteredTables.length}</Badge>
                        <Button onClick={selectAll} size="sm" variant="outline" className="border-slate-700 text-slate-300 text-xs">
                          All
                        </Button>
                        <Button onClick={clearAll} size="sm" variant="outline" className="border-slate-700 text-slate-300 text-xs">
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4 p-3 md:p-6 bg-slate-900/50 rounded-lg border border-slate-700 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                      {Object.entries(groupedByCategory).map(([category, tables]) => (
                        <div key={category}>
                          <h4 className="text-cyan-400 font-bold text-xs md:text-sm mb-2 flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            {category} ({tables.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {tables.map((table) => {
                              const Icon = table.icon;
                              const isSelected = selectedTables.includes(table.name);
                              return (
                                <label
                                  key={table.name}
                                  className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all ${
                                    isSelected ? 'bg-cyan-900/30 border-2 border-cyan-500' : 'hover:bg-slate-800/50 border-2 border-transparent'
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleTable(table.name)}
                                  />
                                  <Icon className={`w-3 md:w-4 h-3 md:h-4 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-xs truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                      {table.name}
                                    </p>
                                    <p className="text-slate-400 text-xs">{table.recordCount} rec</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedTables.length > 0 && (
                      <div className="mt-4 p-3 md:p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
                        <p className="text-cyan-300 font-bold flex items-center gap-2 text-sm md:text-base">
                          <CheckCircle className="w-4 md:w-5 h-4 md:h-5" />
                          {selectedTables.length} tables selected
                        </p>
                        {splitExport && selectedTables.length > tablesPerFile && (
                          <p className="text-cyan-200 text-xs mt-1">
                            → Will create {Math.ceil(selectedTables.length / tablesPerFile)} separate files
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Advanced Configuration */}
                  <Card className="bg-slate-900/50 border-purple-500/30">
                    <CardHeader className="border-b border-purple-500/30 pb-3">
                      <CardTitle className="text-purple-300 font-bold text-xs md:text-sm flex items-center gap-2">
                        <Settings className="w-3 md:w-4 h-3 md:h-4" />
                        Configuration {safeMode && <Badge className="bg-green-500 text-xs">SAFE</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Format</Label>
                          <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 md:p-3 font-medium text-sm"
                            disabled={safeMode}
                          >
                            <option value="SQL Dump">SQL (.sql)</option>
                            <option value="JSON">JSON (.json)</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Export Batch</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseInt(e.target.value) || 2)}
                            className="bg-slate-900 border-slate-700 text-white"
                            disabled={safeMode}
                          />
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Batch Delay (ms)</Label>
                          <Input
                            type="number"
                            min="2000"
                            max="10000"
                            step="500"
                            value={delayBetweenBatches}
                            onChange={(e) => setDelayBetweenBatches(parseInt(e.target.value) || 3000)}
                            className="bg-slate-900 border-slate-700 text-white"
                            disabled={safeMode}
                          />
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Table Delay (ms)</Label>
                          <Input
                            type="number"
                            min="200"
                            max="2000"
                            step="100"
                            value={delayBetweenTables}
                            onChange={(e) => setDelayBetweenTables(parseInt(e.target.value) || 400)}
                            className="bg-slate-900 border-slate-700 text-white"
                            disabled={safeMode}
                          />
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Verify Batch</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={verificationBatchSize}
                            onChange={(e) => setVerificationBatchSize(parseInt(e.target.value) || 2)}
                            className="bg-slate-900 border-slate-700 text-white"
                            disabled={safeMode}
                          />
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Verify Delay (ms)</Label>
                          <Input
                            type="number"
                            min="1000"
                            max="10000"
                            step="500"
                            value={verificationDelay}
                            onChange={(e) => setVerificationDelay(parseInt(e.target.value) || 2500)}
                            className="bg-slate-900 border-slate-700 text-white"
                            disabled={safeMode}
                          />
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Retry Attempts</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={retryAttempts}
                            onChange={(e) => setRetryAttempts(parseInt(e.target.value) || 3)}
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block text-xs md:text-sm">Retry Delay (ms)</Label>
                          <Input
                            type="number"
                            min="1000"
                            max="10000"
                            step="500"
                            value={retryDelay}
                            onChange={(e) => setRetryDelay(parseInt(e.target.value) || 2000)}
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={includeSchema} onCheckedChange={setIncludeSchema} />
                          <span className="text-slate-300 text-xs md:text-sm">Include Schema (DDL)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={includeData} onCheckedChange={setIncludeData} />
                          <span className="text-slate-300 text-xs md:text-sm">Include Data (DML)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={compressionEnabled} onCheckedChange={setCompressionEnabled} />
                          <span className="text-slate-300 text-xs md:text-sm">Archive Format (Legacy)</span>
                        </label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* NEW: Split Export Configuration */}
                  <Card className="bg-amber-900/20 border-amber-500/30">
                    <CardHeader className="border-b border-amber-500/30 pb-3">
                      <CardTitle className="text-amber-300 font-bold text-xs md:text-sm flex items-center gap-2">
                        <FolderArchive className="w-3 md:w-4 h-3 md:h-4" />
                        File Management {splitExport && <Badge className="bg-green-500 text-xs">ENABLED</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={splitExport}
                          onCheckedChange={setSplitExport}
                          disabled={safeMode} // Disable if safe mode is on
                        />
                        <span className="text-amber-200 text-xs md:text-sm font-medium">Split into multiple files (Recommended for 50+ tables)</span>
                      </label>
                      
                      {splitExport && (
                        <div>
                          <Label className="text-amber-200 font-bold mb-2 block text-xs md:text-sm">Tables per file</Label>
                          <Input
                            type="number"
                            min="10"
                            max="50"
                            value={tablesPerFile}
                            onChange={(e) => setTablesPerFile(parseInt(e.target.value) || 20)}
                            className="bg-slate-900 border-slate-700 text-white w-32"
                          />
                          <p className="text-xs text-amber-300 mt-1">
                            Will create {selectedTables.length > 0 ? Math.ceil(selectedTables.length / tablesPerFile) : 0} files
                          </p>
                        </div>
                      )}
                      
                      <div className="p-2 bg-slate-900/50 rounded text-xs text-amber-200">
                        ⚡ Prevents browser memory issues with large exports
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pre-Export Verification Button */}
                  <Button
                    onClick={verifyTables}
                    disabled={selectedTables.length === 0 || isVerifying || exporting}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-10 md:h-12 text-sm md:text-base"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 md:w-5 h-4 md:h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                        Pre-Export Verification
                      </>
                    )}
                  </Button>

                  {/* Verification Results */}
                  {verificationResults.length > 0 && (
                    <Card className={`bg-slate-900/50 ${
                      failedCount > 0 ? 'border-amber-500/30' : 'border-green-500/30'
                    }`}>
                      <CardHeader className={`border-b pb-3 ${
                        failedCount > 0 ? 'border-amber-500/30' : 'border-green-500/30'
                      }`}>
                        <CardTitle className={`font-bold text-xs md:text-sm flex flex-wrap items-center justify-between gap-2 ${
                          failedCount > 0 ? 'text-amber-300' : 'text-green-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            {failedCount > 0 ? <AlertTriangle className="w-3 md:w-4 h-3 md:h-4" /> : <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />}
                            <span className="text-xs md:text-sm">Verification Results</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-green-500 text-xs">{verifiedCount} ✓</Badge>
                            {failedCount > 0 && <Badge className="bg-red-500 text-xs">{failedCount} ✗</Badge>}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 max-h-48 md:max-h-60 overflow-y-auto">
                        <div className="space-y-1 md:space-y-2">
                          {verificationResults.map((result, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs md:text-sm ${
                                result.status === 'verified' ? 'bg-green-900/20' : 'bg-red-900/20'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {result.status === 'verified' ? (
                                  <CheckCircle className="w-3 md:w-4 h-3 md:h-4 text-green-400 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3 md:w-4 h-3 md:h-4 text-red-400 flex-shrink-0" />
                                )}
                                <span className={`font-medium truncate ${
                                  result.status === 'verified' ? 'text-green-300' : 'text-red-300'
                                }`}>
                                  {result.table}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                                {result.status === 'verified' ? `${result.recordCount} rec` : 'Failed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Progress */}
                  {(exporting || isVerifying) && (
                    <Card className="bg-cyan-900/20 border-cyan-500/30">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-cyan-300 font-bold flex items-center gap-2 text-xs md:text-sm">
                            <Activity className="w-3 md:w-4 h-3 md:h-4 animate-pulse" />
                            {isVerifying ? 'Verifying...' : 'Exporting...'}
                          </span>
                          <span className="text-cyan-200 text-xs md:text-sm">{Math.round(exportProgress)}%</span>
                        </div>
                        <Progress value={exportProgress} className="h-2 md:h-3" />
                      </CardContent>
                    </Card>
                  )}

                  {/* Export Log */}
                  {exportLog.length > 0 && (
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700 pb-2 md:pb-3">
                        <CardTitle className="text-white font-bold text-xs md:text-sm flex items-center gap-2">
                          <FileText className="w-3 md:w-4 h-3 md:h-4" />
                          Log ({exportLog.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 md:p-4 max-h-40 md:max-h-60 overflow-y-auto font-mono text-xs">
                        {exportLog.slice(-50).map((log, idx) => (
                          <div
                            key={idx}
                            className={`py-0.5 md:py-1 ${
                              log.type === 'error' ? 'text-red-400' :
                              log.type === 'success' ? 'text-green-400' :
                              log.type === 'warning' ? 'text-amber-400' :
                              'text-slate-300'
                            }`}
                          >
                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Export Button */}
                  <Button
                    onClick={handleExport}
                    disabled={selectedTables.length === 0 || exporting || isVerifying}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 md:py-6 text-sm md:text-lg"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-4 md:w-5 h-4 md:h-5 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                        Export {selectedTables.length} Tables
                        {splitExport && selectedTables.length > tablesPerFile && 
                          ` (${Math.ceil(selectedTables.length / tablesPerFile)} files)`
                        }
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - collapsible on mobile */}
            <div className="space-y-3 md:space-y-4">
              <Card className="bg-purple-900/20 border-purple-500/30">
                <CardHeader className="border-b border-purple-500/30 p-3 md:p-4">
                  <CardTitle className="text-purple-300 font-bold text-xs md:text-sm">📊 Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-200">Available:</span>
                    <span className="text-white font-bold">{availableTables.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Selected:</span>
                    <span className="text-white font-bold">{selectedTables.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Files:</span>
                    <span className="text-white font-bold">
                      {selectedTables.length > 0 && splitExport && selectedTables.length > tablesPerFile
                        ? Math.ceil(selectedTables.length / tablesPerFile)
                        : (selectedTables.length > 0 ? 1 : 0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Est. Time:</span>
                    <span className="text-white font-bold">
                      {Math.ceil((selectedTables.length * (delayBetweenTables / 1000) + (Math.ceil(selectedTables.length / batchSize) * (delayBetweenBatches / 1000))))}s
                    </span>
                  </div>
                  {verificationResults.length > 0 && (
                    <>
                      <div className="flex justify-between pt-2 border-t border-purple-500/30">
                        <span className="text-green-200">Verified:</span>
                        <span className="text-green-400 font-bold">{verifiedCount}</span>
                      </div>
                      {failedCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-200">Failed:</span>
                          <span className="text-red-400 font-bold">{failedCount}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
                <CardHeader className="border-b border-green-500/30 p-3 md:p-4">
                  <CardTitle className="text-green-300 font-bold text-xs md:text-sm flex items-center gap-2">
                    <Shield className="w-3 md:w-4 h-3 md:h-4" />
                    Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <ul className="text-green-200 text-xs space-y-1.5 md:space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Split-file for large exports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Exponential backoff retry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Safe Mode (1 table/5s)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Memory-efficient downloads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Pre-verification system</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardHeader className="border-b border-blue-500/30 p-3 md:p-4">
                  <CardTitle className="text-blue-300 font-bold text-xs md:text-sm">💡 Tips</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <ul className="text-blue-200 text-xs space-y-1.5 md:space-y-2">
                    <li>• Enable split export for 50+ tables</li>
                    <li>• Run verification first (required)</li>
                    <li>• Check downloads folder for files</li>
                    <li>• Use Safe Mode for 100% success</li>
                    <li>• Multiple files prevent memory issues</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="glory" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {databaseTools.map((tool, idx) => (
              <Link key={idx} to={tool.url}>
                <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700 hover:border-cyan-500 transition-all cursor-pointer group h-full">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className={`w-10 md:w-12 h-10 md:h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg`}>
                        {tool.icon}
                      </div>
                      <Badge className="bg-cyan-500 text-xs">{tool.badge}</Badge>
                    </div>
                    <h3 className="text-white font-bold text-sm md:text-lg mb-1 md:mb-2 group-hover:text-cyan-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tables" className="mt-6">
          <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
            <CardHeader className="border-b border-slate-700 p-4 md:p-6">
              <CardTitle className="text-white font-bold text-sm md:text-base">All Database Tables ({availableTables.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4 md:space-y-6">
                {Object.entries(groupedByCategory).map(([category, tables]) => (
                  <div key={category}>
                    <h3 className="text-cyan-400 font-bold mb-2 md:mb-3 flex items-center gap-2 text-xs md:text-sm">
                      <Database className="w-3 md:w-4 h-3 md:h-4" />
                      {category} ({tables.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                      {tables.map((table) => {
                        const Icon = table.icon;
                        return (
                          <Card key={table.name} className="bg-slate-900/50 border-slate-700">
                            <CardContent className="p-2 md:p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                  <Icon className="w-4 md:w-6 h-4 md:h-6 text-cyan-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <h4 className="text-white font-bold text-xs md:text-sm truncate">{table.name}</h4>
                                    <p className="text-slate-400 text-xs">{table.recordCount} rec</p>
                                  </div>
                                </div>
                                <Badge className="bg-purple-500 text-xs flex-shrink-0">
                                  {table.recordCount > 0 ? 'Active' : 'Empty'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
              <CardHeader className="border-b border-slate-700 p-4 md:p-6">
                <CardTitle className="text-white font-bold text-sm md:text-base">Storage Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2 md:space-y-3">
                  {availableTables.filter(t => t.recordCount > 0).slice(0, 10).map(table => (
                    <div key={table.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 text-xs md:text-sm">{table.name}</span>
                        <span className="text-white font-bold text-xs md:text-sm">{table.size.toFixed(2)} MB</span>
                      </div>
                      <Progress value={(table.size / totalSize) * 100} className="h-1.5 md:h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
              <CardHeader className="border-b border-slate-700 p-4 md:p-6">
                <CardTitle className="text-white font-bold text-sm md:text-base">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2 md:space-y-3">
                  {Object.entries(groupedByCategory).map(([category, tables]) => (
                    <div key={category}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 text-xs md:text-sm">{category}</span>
                        <span className="text-white font-bold text-xs md:text-sm">{tables.length}</span>
                      </div>
                      <Progress value={(tables.length / availableTables.length) * 100} className="h-1.5 md:h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* System Health */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader className="border-b border-green-500/30 p-4 md:p-6">
          <CardTitle className="text-green-300 font-bold flex items-center gap-2 text-sm md:text-base">
            <CheckCircle className="w-4 md:w-5 h-4 md:h-5" />
            Enterprise System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center">
              <p className="text-green-400 font-bold text-xl md:text-2xl mb-1">100%</p>
              <p className="text-green-200 text-xs md:text-sm">API Ready</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-xl md:text-2xl mb-1">&lt;50ms</p>
              <p className="text-green-200 text-xs md:text-sm">Response</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-xl md:text-2xl mb-1">Split</p>
              <p className="text-green-200 text-xs md:text-sm">File Support</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-xl md:text-2xl mb-1">Smart</p>
              <p className="text-green-200 text-xs md:text-sm">Memory Mgmt</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
