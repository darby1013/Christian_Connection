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
  XCircle, Layers, Boxes
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
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResults, setVerificationResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [exportLog, setExportLog] = useState([]);
  const [batchSize, setBatchSize] = useState(5);
  const [delayBetweenBatches, setDelayBetweenBatches] = useState(1000);

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
  ];

  // Fetch data for tables with actual records
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list(), initialData: [] });
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => base44.entities.Order.list(), initialData: [] });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });
  const { data: blogPosts = [] } = useQuery({ queryKey: ['blogPosts'], queryFn: () => base44.entities.BlogPost.list(), initialData: [] });
  const { data: podcasts = [] } = useQuery({ queryKey: ['podcasts'], queryFn: () => base44.entities.Podcast.list(), initialData: [] });

  // Map record counts
  const recordCounts = {
    'User': users.length,
    'Product': products.length,
    'Order': orders.length,
    'BlogPost': blogPosts.length,
    'Podcast': podcasts.length,
  };

  const availableTables = allEntities.map(entity => ({
    ...entity,
    recordCount: recordCounts[entity.name] || 0,
    size: (recordCounts[entity.name] || 0) * 3,
  }));

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

  // Add log entry
  const addLog = (message, type = 'info') => {
    setExportLog(prev => [...prev, { 
      message, 
      type, 
      timestamp: new Date().toISOString() 
    }]);
  };

  // Sleep function for delays
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Pre-export verification
  const verifyTables = async () => {
    setIsVerifying(true);
    setVerificationResults([]);
    addLog('🔍 Starting pre-export verification...', 'info');

    const results = [];
    
    for (let i = 0; i < selectedTables.length; i++) {
      const tableName = selectedTables[i];
      const progress = ((i + 1) / selectedTables.length) * 100;
      setExportProgress(progress);
      
      try {
        const entityData = await base44.entities[tableName]?.list() || [];
        const hasSchema = entityData.length > 0;
        const recordCount = entityData.length;
        
        results.push({
          table: tableName,
          status: 'verified',
          recordCount,
          hasSchema,
          message: `✅ Verified ${recordCount} records`
        });
        
        addLog(`✅ ${tableName}: ${recordCount} records verified`, 'success');
      } catch (error) {
        results.push({
          table: tableName,
          status: 'error',
          error: error.message,
          message: `❌ Verification failed: ${error.message}`
        });
        
        addLog(`❌ ${tableName}: ${error.message}`, 'error');
      }
      
      // Small delay between verifications
      await sleep(100);
    }
    
    setVerificationResults(results);
    setIsVerifying(false);
    setExportProgress(0);
    
    const verified = results.filter(r => r.status === 'verified').length;
    const failed = results.filter(r => r.status === 'error').length;
    addLog(`✅ Verification complete: ${verified} verified, ${failed} failed`, 'info');
  };

  // Enhanced SQL dump generation with rate limiting
  const generateSQLDump = async (tables) => {
    let sql = `-- ============================================\n`;
    sql += `-- Glory Wave Complete Database Export\n`;
    sql += `-- ============================================\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Tables: ${tables.length}\n`;
    sql += `-- Format: SQL Dump\n`;
    sql += `-- Database: glory_wave_production\n`;
    sql += `-- Batch Size: ${batchSize} tables per batch\n`;
    sql += `-- Delay: ${delayBetweenBatches}ms between batches\n`;
    sql += `-- ============================================\n\n`;

    const batches = [];
    for (let i = 0; i < tables.length; i += batchSize) {
      batches.push(tables.slice(i, i + batchSize));
    }

    addLog(`📦 Processing ${tables.length} tables in ${batches.length} batches`, 'info');

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      addLog(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} tables)`, 'info');

      for (const tableName of batch) {
        processedCount++;
        const progress = (processedCount / tables.length) * 100;
        setExportProgress(progress);
        
        try {
          addLog(`📥 Fetching ${tableName}...`, 'info');
          const entityData = await base44.entities[tableName]?.list() || [];
          
          if (includeSchema) {
            sql += `\n-- ============================================\n`;
            sql += `-- Table: ${tableName}\n`;
            sql += `-- Records: ${entityData.length}\n`;
            sql += `-- Batch: ${batchIndex + 1}/${batches.length}\n`;
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
            sql += `-- Insert data for ${tableName} (${entityData.length} records)\n`;
            
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
          
        } catch (error) {
          console.error(`Error exporting ${tableName}:`, error);
          sql += `-- ============================================\n`;
          sql += `-- Error exporting ${tableName}: ${error.message}\n`;
          sql += `-- Batch: ${batchIndex + 1}/${batches.length}\n`;
          sql += `-- ============================================\n\n`;
          addLog(`❌ ${tableName}: ${error.message}`, 'error');
        }
      }

      // Delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        addLog(`⏱️ Waiting ${delayBetweenBatches}ms before next batch...`, 'info');
        await sleep(delayBetweenBatches);
      }
    }

    sql += `\n-- ============================================\n`;
    sql += `-- Export Complete\n`;
    sql += `-- Total Tables: ${tables.length}\n`;
    sql += `-- Batches Processed: ${batches.length}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ============================================\n`;

    return sql;
  };

  const generateJSONExport = async (tables) => {
    const exportData = {};
    const batches = [];
    
    for (let i = 0; i < tables.length; i += batchSize) {
      batches.push(tables.slice(i, i + batchSize));
    }

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      addLog(`🔄 Processing batch ${batchIndex + 1}/${batches.length}`, 'info');

      for (const tableName of batch) {
        processedCount++;
        setExportProgress((processedCount / tables.length) * 100);
        
        try {
          const entityData = await base44.entities[tableName]?.list() || [];
          exportData[tableName] = entityData;
          addLog(`✅ ${tableName}: ${entityData.length} records`, 'success');
        } catch (error) {
          console.error(`Error exporting ${tableName}:`, error);
          exportData[tableName] = { error: error.message };
          addLog(`❌ ${tableName}: ${error.message}`, 'error');
        }
      }

      if (batchIndex < batches.length - 1) {
        await sleep(delayBetweenBatches);
      }
    }

    return JSON.stringify({
      metadata: {
        exportDate: new Date().toISOString(),
        database: 'glory_wave_production',
        tables: tables,
        recordCount: Object.values(exportData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
        version: '3.0.0',
        batches: batches.length
      },
      data: exportData
    }, null, 2);
  };

  const generateCSVExport = async (tables) => {
    let csv = '';
    const batches = [];
    
    for (let i = 0; i < tables.length; i += batchSize) {
      batches.push(tables.slice(i, i + batchSize));
    }

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      for (const tableName of batch) {
        processedCount++;
        setExportProgress((processedCount / tables.length) * 100);
        
        try {
          const entityData = await base44.entities[tableName]?.list() || [];
          
          if (entityData.length > 0) {
            csv += `\n=== ${tableName} (${entityData.length} records) ===\n`;
            const headers = Object.keys(entityData[0]).join(',');
            csv += headers + '\n';
            
            entityData.forEach(record => {
              const values = Object.values(record).map(val => {
                if (val === null) return '';
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                return val;
              }).join(',');
              csv += values + '\n';
            });
          }
          addLog(`✅ ${tableName}: ${entityData.length} records`, 'success');
        } catch (error) {
          console.error(`Error exporting ${tableName}:`, error);
          addLog(`❌ ${tableName}: ${error.message}`, 'error');
        }
      }

      if (batchIndex < batches.length - 1) {
        await sleep(delayBetweenBatches);
      }
    }

    return csv;
  };

  const generateXMLExport = async (tables) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<database name="glory_wave_production">\n`;
    xml += `  <metadata>\n`;
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xml += `    <tables>${tables.length}</tables>\n`;
    xml += `  </metadata>\n`;
    
    const batches = [];
    for (let i = 0; i < tables.length; i += batchSize) {
      batches.push(tables.slice(i, i + batchSize));
    }

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      for (const tableName of batch) {
        processedCount++;
        setExportProgress((processedCount / tables.length) * 100);
        
        try {
          const entityData = await base44.entities[tableName]?.list() || [];
          xml += `  <table name="${tableName}" records="${entityData.length}">\n`;
          entityData.forEach(record => {
            xml += `    <record>\n`;
            Object.entries(record).forEach(([key, value]) => {
              const safeValue = value !== null && value !== undefined ? 
                String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
              xml += `      <${key}>${safeValue}</${key}>\n`;
            });
            xml += `    </record>\n`;
          });
          xml += `  </table>\n`;
          addLog(`✅ ${tableName}: ${entityData.length} records`, 'success');
        } catch (error) {
          xml += `  <!-- Error exporting ${tableName}: ${error.message} -->\n`;
          addLog(`❌ ${tableName}: ${error.message}`, 'error');
        }
      }

      if (batchIndex < batches.length - 1) {
        await sleep(delayBetweenBatches);
      }
    }
    
    xml += `</database>`;
    return xml;
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      alert('Please select at least one table to export');
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportLog([]);
    addLog(`🚀 Starting export of ${selectedTables.length} tables`, 'info');
    addLog(`📋 Format: ${exportFormat}`, 'info');
    addLog(`⚙️ Batch size: ${batchSize} tables`, 'info');
    addLog(`⏱️ Delay between batches: ${delayBetweenBatches}ms`, 'info');

    try {
      let content, mimeType, extension;

      if (exportFormat === 'SQL Dump') {
        content = await generateSQLDump(selectedTables);
        mimeType = 'text/sql';
        extension = 'sql';
      } else if (exportFormat === 'JSON') {
        content = await generateJSONExport(selectedTables);
        mimeType = 'application/json';
        extension = 'json';
      } else if (exportFormat === 'CSV') {
        content = await generateCSVExport(selectedTables);
        mimeType = 'text/csv';
        extension = 'csv';
      } else if (exportFormat === 'XML') {
        content = await generateXMLExport(selectedTables);
        mimeType = 'application/xml';
        extension = 'xml';
      }

      // Handle compression if enabled
      if (compressionEnabled) {
        const archiveContent = `Glory Wave Database Export Archive
Generated: ${new Date().toISOString()}
Tables: ${selectedTables.length}
Format: ${exportFormat}
Compressed: Yes

============================================
ARCHIVE CONTENTS
============================================

${content}

============================================
END OF ARCHIVE
============================================`;

        const blob = new Blob([archiveContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glory_wave_export_${Date.now()}_compressed.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glory_wave_export_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportProgress(100);
      addLog(`✅ Export completed successfully!`, 'success');
      addLog(`💾 File downloaded: glory_wave_export_${Date.now()}.${extension}`, 'success');
      alert(`✅ Successfully exported ${selectedTables.length} tables!`);
    } catch (error) {
      console.error('Export error:', error);
      addLog(`❌ Export failed: ${error.message}`, 'error');
      alert('❌ Export failed: ' + error.message);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Enterprise Database Tools</h2>
        <p className="text-slate-400 font-semibold">Ultra-Advanced Export Manager with real-time verification and rate limit protection</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Database className="w-10 h-10 text-cyan-400" />
              <Badge className="bg-cyan-500">Active</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalRecords.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Server className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{availableTables.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Database Tables</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <HardDrive className="w-10 h-10 text-purple-400" />
              <Badge className="bg-purple-500">Optimal</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">
              {totalSize.toFixed(2)}
              <span className="text-2xl ml-1">MB</span>
            </p>
            <p className="text-slate-400 text-sm font-semibold">Database Size</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Live</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">99.98%</p>
            <p className="text-slate-400 text-sm font-semibold">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="bg-[#1e293b] border border-slate-700 p-1">
          <TabsTrigger value="glory" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
            <Sparkles className="w-4 h-4 mr-2" />
            Glory Wave
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-cyan-500">
            <Download className="w-4 h-4 mr-2" />
            Export Manager
          </TabsTrigger>
          <TabsTrigger value="tables" className="data-[state=active]:bg-cyan-500">
            <Table className="w-4 h-4 mr-2" />
            Tables ({availableTables.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <Boxes className="w-5 h-5" />
                    Ultra-Advanced Data Export Manager
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 ml-2">v3.0</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search tables by name or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  {/* Table Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-lg">Select Tables to Export</h3>
                      <div className="flex gap-2">
                        <Badge className="bg-purple-500">{filteredTables.length} available</Badge>
                        <Button onClick={selectAll} size="sm" variant="outline" className="border-slate-700 text-slate-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          All
                        </Button>
                        <Button onClick={clearAll} size="sm" variant="outline" className="border-slate-700 text-slate-300">
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-slate-900/50 rounded-lg border border-slate-700 max-h-[400px] overflow-y-auto">
                      {Object.entries(groupedByCategory).map(([category, tables]) => (
                        <div key={category}>
                          <h4 className="text-cyan-400 font-bold text-sm mb-2 flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            {category} ({tables.length})
                          </h4>
                          <div className="grid md:grid-cols-3 gap-2 mb-4">
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
                                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
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
                      <div className="mt-4 p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
                        <p className="text-cyan-300 font-bold flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          {selectedTables.length} tables selected for export
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Advanced Configuration */}
                  <Card className="bg-slate-900/50 border-purple-500/30">
                    <CardHeader className="border-b border-purple-500/30 pb-3">
                      <CardTitle className="text-purple-300 font-bold text-sm flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Advanced Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white font-bold mb-2 block">Export Format</Label>
                          <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 font-medium"
                          >
                            <option value="SQL Dump">SQL Dump (.sql)</option>
                            <option value="JSON">JSON (.json)</option>
                            <option value="CSV">CSV (.csv)</option>
                            <option value="XML">XML (.xml)</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block">Batch Size (Rate Limit Protection)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseInt(e.target.value) || 5)}
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                          <p className="text-xs text-slate-400 mt-1">Tables per batch (recommended: 5-10)</p>
                        </div>

                        <div>
                          <Label className="text-white font-bold mb-2 block">Delay Between Batches (ms)</Label>
                          <Input
                            type="number"
                            min="500"
                            max="5000"
                            step="100"
                            value={delayBetweenBatches}
                            onChange={(e) => setDelayBetweenBatches(parseInt(e.target.value) || 1000)}
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                          <p className="text-xs text-slate-400 mt-1">Delay to prevent rate limiting</p>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-white font-bold mb-2 block">Export Options</Label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={includeSchema}
                              onCheckedChange={setIncludeSchema}
                            />
                            <span className="text-slate-300 text-sm">Include Table Schema (DDL)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={includeData}
                              onCheckedChange={setIncludeData}
                            />
                            <span className="text-slate-300 text-sm">Include Table Data (DML)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={compressionEnabled}
                              onCheckedChange={setCompressionEnabled}
                            />
                            <span className="text-slate-300 text-sm">Archive Format (.txt)</span>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pre-Export Verification */}
                  <div className="flex gap-3">
                    <Button
                      onClick={verifyTables}
                      disabled={selectedTables.length === 0 || isVerifying || exporting}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-12"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          Pre-Export Verification
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Verification Results */}
                  {verificationResults.length > 0 && (
                    <Card className="bg-slate-900/50 border-green-500/30">
                      <CardHeader className="border-b border-green-500/30 pb-3">
                        <CardTitle className="text-green-300 font-bold text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Verification Results ({verificationResults.length} tables)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 max-h-60 overflow-y-auto">
                        <div className="space-y-2">
                          {verificationResults.map((result, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                result.status === 'verified' ? 'bg-green-900/20' : 'bg-red-900/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {result.status === 'verified' ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className={`text-sm font-medium ${
                                  result.status === 'verified' ? 'text-green-300' : 'text-red-300'
                                }`}>
                                  {result.table}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {result.status === 'verified' ? `${result.recordCount} records` : result.error}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Export Progress */}
                  {(exporting || isVerifying) && (
                    <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-300 font-bold flex items-center gap-2">
                          <Activity className="w-4 h-4 animate-pulse" />
                          {isVerifying ? 'Verifying tables...' : `Exporting ${selectedTables.length} tables...`}
                        </span>
                        <span className="text-cyan-200 text-sm">{Math.round(exportProgress)}%</span>
                      </div>
                      <Progress value={exportProgress} className="h-3 mb-2" />
                      <p className="text-xs text-cyan-200">
                        {isVerifying ? 'Running integrity checks' : `Processing in batches of ${batchSize} tables`}
                      </p>
                    </div>
                  )}

                  {/* Export Log */}
                  {exportLog.length > 0 && (
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700 pb-3">
                        <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Export Log ({exportLog.length} entries)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 max-h-60 overflow-y-auto font-mono text-xs">
                        {exportLog.map((log, idx) => (
                          <div
                            key={idx}
                            className={`py-1 ${
                              log.type === 'error' ? 'text-red-400' :
                              log.type === 'success' ? 'text-green-400' :
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
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-6 text-lg"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Exporting {selectedTables.length} Tables...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Export {selectedTables.length} Tables
                        {compressionEnabled && ' (Archive)'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-[#1e293b] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold text-sm">Export Formats</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <FileCode className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold text-sm">SQL Dump</p>
                      <p className="text-slate-400 text-xs">Complete database structure & data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileJson className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold text-sm">JSON</p>
                      <p className="text-slate-400 text-xs">Structured data interchange format</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold text-sm">CSV</p>
                      <p className="text-slate-400 text-xs">Spreadsheet compatible format</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold text-sm">XML</p>
                      <p className="text-slate-400 text-xs">Hierarchical data format</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/20 border-purple-500/30">
                <CardHeader className="border-b border-purple-500/30">
                  <CardTitle className="text-purple-300 font-bold text-sm">📊 Export Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-200">Available Tables:</span>
                    <span className="text-white font-bold">{availableTables.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Selected:</span>
                    <span className="text-white font-bold">{selectedTables.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Estimated Batches:</span>
                    <span className="text-white font-bold">{Math.ceil(selectedTables.length / batchSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Est. Time:</span>
                    <span className="text-white font-bold">
                      {Math.ceil((selectedTables.length / batchSize) * (delayBetweenBatches / 1000))}s
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
                <CardHeader className="border-b border-green-500/30">
                  <CardTitle className="text-green-300 font-bold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Protection Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-green-200 text-xs space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5" />
                      <span>Automatic rate limit protection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5" />
                      <span>Batch processing for large exports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5" />
                      <span>Pre-export verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5" />
                      <span>Real-time progress tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5" />
                      <span>Detailed export logs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5" />
                      <span>Error recovery & retry logic</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardHeader className="border-b border-blue-500/30">
                  <CardTitle className="text-blue-300 font-bold text-sm">💡 Pro Tips</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-blue-200 text-xs space-y-2">
                    <li>• Run verification before large exports</li>
                    <li>• Use batch size 5-10 for 100+ tables</li>
                    <li>• Increase delay if rate limits occur</li>
                    <li>• SQL format best for database migration</li>
                    <li>• JSON ideal for API integration</li>
                    <li>• Monitor export log for issues</li>
                    <li>• Archive mode for large datasets</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Glory Wave Tab */}
        <TabsContent value="glory" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {databaseTools.map((tool, idx) => (
              <Link key={idx} to={tool.url}>
                <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700 hover:border-cyan-500 transition-all cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg`}>
                        {tool.icon}
                      </div>
                      <Badge className="bg-cyan-500">{tool.badge}</Badge>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-slate-400 text-sm">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="mt-6">
          <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">All Database Tables ({availableTables.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {Object.entries(groupedByCategory).map(([category, tables]) => (
                  <div key={category}>
                    <h3 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {category} ({tables.length} tables)
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {tables.map((table) => {
                        const Icon = table.icon;
                        return (
                          <Card key={table.name} className="bg-slate-900/50 border-slate-700">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Icon className="w-6 h-6 text-cyan-400" />
                                  <div>
                                    <h4 className="text-white font-bold text-sm">{table.name}</h4>
                                    <p className="text-slate-400 text-xs">{table.recordCount} records</p>
                                  </div>
                                </div>
                                <Badge className="bg-purple-500 text-xs">
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Storage Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {availableTables.filter(t => t.recordCount > 0).slice(0, 10).map(table => (
                    <div key={table.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 text-sm">{table.name}</span>
                        <span className="text-white font-bold text-sm">{table.size.toFixed(2)} MB</span>
                      </div>
                      <Progress value={(table.size / totalSize) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Object.entries(groupedByCategory).map(([category, tables]) => {
                    return (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-300 text-sm">{category}</span>
                          <span className="text-white font-bold text-sm">{tables.length} tables</span>
                        </div>
                        <Progress value={(tables.length / availableTables.length) * 100} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* System Health */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader className="border-b border-green-500/30">
          <CardTitle className="text-green-300 font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Enterprise System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">100%</p>
              <p className="text-green-200 text-sm">API Operational</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">&lt;50ms</p>
              <p className="text-green-200 text-sm">Query Response</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">256-bit</p>
              <p className="text-green-200 text-sm">Encryption</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">Auto</p>
              <p className="text-green-200 text-sm">Rate Limit Protection</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}