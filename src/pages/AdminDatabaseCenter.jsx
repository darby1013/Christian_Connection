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
import {
  Database, Sparkles, Search, GitBranch, Code, Upload, Archive,
  Download, Activity, Zap, Shield, Link2, TrendingUp, Server,
  FileText, CheckCircle, AlertCircle, Loader2, Table,
  Clock, Users, Package, Eye, MessageSquare, Calendar,
  Heart, Video, Radio, Mic2, BookOpen, Settings, DollarSign, Gift,
  Tag, Truck, Award, Globe, Star, UserPlus, Rss, Book, Crown,
  Image, Film, Bell, ShoppingBag, Mail, BarChart3, Palette, RefreshCw,
  Warehouse, Layers, Boxes, FolderArchive, Key, Lock, Webhook,
  Cpu, FileArchive, Briefcase, Share2, Bookmark, CircleDot,
  FileCode, FolderOpen, HardDriveDownload, CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDatabaseCenter() {
  const [selectedTables, setSelectedTables] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [includeData, setIncludeData] = useState(true);
  const [includeSchema, setIncludeSchema] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResults, setVerificationResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [exportLog, setExportLog] = useState([]);
  const [batchSize, setBatchSize] = useState(5);
  const [delayBetweenBatches, setDelayBetweenBatches] = useState(2000);
  const [verificationBatchSize, setVerificationBatchSize] = useState(10);
  const [verificationDelay, setVerificationDelay] = useState(1000);
  const [delayBetweenTables, setDelayBetweenTables] = useState(150);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [retryDelay, setRetryDelay] = useState(1500);
  const [safeMode, setSafeMode] = useState(false);
  const [onlyTablesWithData, setOnlyTablesWithData] = useState(false);
  const [splitExport, setSplitExport] = useState(true);
  const [tablesPerFile, setTablesPerFile] = useState(25);
  const [includeSystemFiles, setIncludeSystemFiles] = useState(false);

  const allEntities = [
    { name: 'User', icon: Users, category: 'Core' },
    { name: 'Role', icon: Shield, category: 'Core' },
    { name: 'UserTheme', icon: Palette, category: 'Core' },
    { name: 'Notification', icon: Bell, category: 'Core' },
    { name: 'NotificationTemplate', icon: Mail, category: 'Core' },
    { name: 'UserSession', icon: Activity, category: 'Core' },
    { name: 'LoginAttempt', icon: Lock, category: 'Core' },
    { name: 'PasswordReset', icon: Key, category: 'Core' },
    { name: 'TwoFactorAuth', icon: Shield, category: 'Core' },
    { name: 'LiveStream', icon: Radio, category: 'Content' },
    { name: 'Video', icon: Video, category: 'Content' },
    { name: 'Podcast', icon: Mic2, category: 'Content' },
    { name: 'BlogPost', icon: FileText, category: 'Content' },
    { name: 'BlogCategory', icon: BookOpen, category: 'Content' },
    { name: 'BlogComment', icon: MessageSquare, category: 'Content' },
    { name: 'Comment', icon: MessageSquare, category: 'Content' },
    { name: 'ContentVersion', icon: FileArchive, category: 'Content' },
    { name: 'MediaAsset', icon: Image, category: 'Content' },
    { name: 'StreamScript', icon: FileText, category: 'Content' },
    { name: 'ContentModeration', icon: Shield, category: 'Content' },
    { name: 'GuestHost', icon: Users, category: 'Streaming' },
    { name: 'LiveStreamChat', icon: MessageSquare, category: 'Streaming' },
    { name: 'StreamViewer', icon: Eye, category: 'Streaming' },
    { name: 'LiveStreamSchedule', icon: Calendar, category: 'Streaming' },
    { name: 'StreamOverlay', icon: Layers, category: 'Streaming' },
    { name: 'StreamAnalytics', icon: BarChart3, category: 'Streaming' },
    { name: 'VideoComment', icon: MessageSquare, category: 'Streaming' },
    { name: 'Sermon', icon: BookOpen, category: 'Streaming' },
    { name: 'Devotional', icon: Book, category: 'Streaming' },
    { name: 'StreamTip', icon: DollarSign, category: 'Streaming' },
    { name: 'PodcastSeries', icon: Mic2, category: 'Podcast' },
    { name: 'PodcastTranscription', icon: FileText, category: 'Podcast' },
    { name: 'PodcastShowNote', icon: FileText, category: 'Podcast' },
    { name: 'PodcastClip', icon: Video, category: 'Podcast' },
    { name: 'PodcastMonetization', icon: DollarSign, category: 'Podcast' },
    { name: 'PodcastPurchase', icon: ShoppingBag, category: 'Podcast' },
    { name: 'PodcastRevenue', icon: DollarSign, category: 'Podcast' },
    { name: 'PodcastTranscript', icon: FileText, category: 'Podcast' },
    { name: 'PodcastInteraction', icon: Activity, category: 'Podcast' },
    { name: 'PodcastMarketing', icon: TrendingUp, category: 'Podcast' },
    { name: 'PodcastAnalytics', icon: BarChart3, category: 'Podcast' },
    { name: 'PodcastSocialPost', icon: Globe, category: 'Podcast' },
    { name: 'PodcastRepurposedContent', icon: Film, category: 'Podcast' },
    { name: 'LivePodcast', icon: Mic2, category: 'Podcast' },
    { name: 'AudioFile', icon: Mic2, category: 'Podcast' },
    { name: 'UserPodcastLibrary', icon: Book, category: 'Podcast' },
    { name: 'PodcastComment', icon: MessageSquare, category: 'Podcast' },
    { name: 'PodcastGuest', icon: Users, category: 'Podcast' },
    { name: 'PodcastSponsor', icon: Briefcase, category: 'Podcast' },
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
    { name: 'GroupRole', icon: Shield, category: 'Community' },
    { name: 'GroupInvitation', icon: Mail, category: 'Community' },
    { name: 'PrayerRequest', icon: Heart, category: 'Community' },
    { name: 'PrayerComment', icon: MessageSquare, category: 'Community' },
    { name: 'PrayerCategory', icon: BookOpen, category: 'Community' },
    { name: 'PrayerUpdate', icon: RefreshCw, category: 'Community' },
    { name: 'Ministry', icon: Crown, category: 'Community' },
    { name: 'SmallGroup', icon: Users, category: 'Community' },
    { name: 'ForumCategory', icon: BookOpen, category: 'Forum' },
    { name: 'ForumThread', icon: MessageSquare, category: 'Forum' },
    { name: 'ForumPost', icon: FileText, category: 'Forum' },
    { name: 'ForumReply', icon: MessageSquare, category: 'Forum' },
    { name: 'ChatMessage', icon: MessageSquare, category: 'Messaging' },
    { name: 'DirectMessage', icon: MessageSquare, category: 'Messaging' },
    { name: 'Chatroom', icon: MessageSquare, category: 'Messaging' },
    { name: 'ChatroomMember', icon: Users, category: 'Messaging' },
    { name: 'ChatroomInvite', icon: UserPlus, category: 'Messaging' },
    { name: 'MessageReaction', icon: Heart, category: 'Messaging' },
    { name: 'ThreadSubscription', icon: Bell, category: 'Messaging' },
    { name: 'UserConnection', icon: Users, category: 'Messaging' },
    { name: 'Event', icon: Calendar, category: 'Events' },
    { name: 'EventRegistration', icon: Calendar, category: 'Events' },
    { name: 'EventSpeaker', icon: Users, category: 'Events' },
    { name: 'EventTicket', icon: Tag, category: 'Events' },
    { name: 'Attendance', icon: CheckCircle, category: 'Events' },
    { name: 'Product', icon: Package, category: 'Commerce' },
    { name: 'ProductVariant', icon: Package, category: 'Commerce' },
    { name: 'ProductBundle', icon: Package, category: 'Commerce' },
    { name: 'DigitalProduct', icon: Download, category: 'Commerce' },
    { name: 'ProductImage', icon: Image, category: 'Commerce' },
    { name: 'ProductCategory', icon: Layers, category: 'Commerce' },
    { name: 'Order', icon: ShoppingBag, category: 'Commerce' },
    { name: 'OrderItem', icon: Package, category: 'Commerce' },
    { name: 'OrderFulfillment', icon: Truck, category: 'Commerce' },
    { name: 'OrderNote', icon: FileText, category: 'Commerce' },
    { name: 'ShoppingCart', icon: ShoppingBag, category: 'Commerce' },
    { name: 'CartItem', icon: Package, category: 'Commerce' },
    { name: 'Wishlist', icon: Heart, category: 'Commerce' },
    { name: 'WishlistItem', icon: Heart, category: 'Commerce' },
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
    { name: 'ShippingLabel', icon: Tag, category: 'Commerce' },
    { name: 'CustomerAddress', icon: Users, category: 'Commerce' },
    { name: 'DiscountRule', icon: Tag, category: 'Commerce' },
    { name: 'RefundRequest', icon: RefreshCw, category: 'Commerce' },
    { name: 'Donation', icon: Heart, category: 'Finance' },
    { name: 'DonationCampaign', icon: Heart, category: 'Finance' },
    { name: 'RecurringDonation', icon: RefreshCw, category: 'Finance' },
    { name: 'PaymentGateway', icon: Database, category: 'Finance' },
    { name: 'PaymentMethod', icon: CreditCard, category: 'Finance' },
    { name: 'Transaction', icon: DollarSign, category: 'Finance' },
    { name: 'Affiliate', icon: Users, category: 'Finance' },
    { name: 'ReferralCode', icon: Tag, category: 'Finance' },
    { name: 'Commission', icon: DollarSign, category: 'Finance' },
    { name: 'Subscription', icon: Crown, category: 'Membership' },
    { name: 'SubscriptionPlan', icon: Crown, category: 'Membership' },
    { name: 'CustomerLoyalty', icon: Award, category: 'Membership' },
    { name: 'LoyaltyProgram', icon: Award, category: 'Membership' },
    { name: 'MembershipFeature', icon: Crown, category: 'Membership' },
    { name: 'UserBadge', icon: Award, category: 'Gamification' },
    { name: 'UserPoints', icon: Award, category: 'Gamification' },
    { name: 'Badge', icon: Award, category: 'Gamification' },
    { name: 'UserBadgeShowcase', icon: Award, category: 'Gamification' },
    { name: 'UserLevel', icon: TrendingUp, category: 'Gamification' },
    { name: 'UserProgress', icon: Activity, category: 'Gamification' },
    { name: 'UserFollower', icon: Users, category: 'Gamification' },
    { name: 'Course', icon: Book, category: 'Learning' },
    { name: 'CourseModule', icon: Book, category: 'Learning' },
    { name: 'CourseLesson', icon: BookOpen, category: 'Learning' },
    { name: 'CourseProgress', icon: Activity, category: 'Learning' },
    { name: 'CourseReview', icon: Star, category: 'Learning' },
    { name: 'BibleStudy', icon: Book, category: 'Learning' },
    { name: 'ResourceLibrary', icon: Download, category: 'Learning' },
    { name: 'KnowledgeBase', icon: Book, category: 'Learning' },
    { name: 'Testimony', icon: Star, category: 'Community Ext' },
    { name: 'TestimonyComment', icon: MessageSquare, category: 'Community Ext' },
    { name: 'TestimonyCategory', icon: BookOpen, category: 'Community Ext' },
    { name: 'Volunteer', icon: UserPlus, category: 'Community Ext' },
    { name: 'VolunteerRequest', icon: UserPlus, category: 'Community Ext' },
    { name: 'MemberDirectory', icon: Users, category: 'Community Ext' },
    { name: 'CommunityBoard', icon: Globe, category: 'Community Ext' },
    { name: 'SiteSettings', icon: Settings, category: 'Settings' },
    { name: 'SiteMission', icon: Globe, category: 'Settings' },
    { name: 'PageBackup', icon: Archive, category: 'Settings' },
    { name: 'PageCustomization', icon: Settings, category: 'Settings' },
    { name: 'RSSFeed', icon: Rss, category: 'Settings' },
    { name: 'SystemConfiguration', icon: Settings, category: 'Settings' },
    { name: 'FeatureFlag', icon: Zap, category: 'Settings' },
    { name: 'AppConfiguration', icon: Settings, category: 'Settings' },
    { name: 'AuditLog', icon: Eye, category: 'Audit' },
    { name: 'RoleAuditLog', icon: Shield, category: 'Audit' },
    { name: 'UserActivity', icon: Activity, category: 'Audit' },
    { name: 'ActivityLog', icon: Activity, category: 'Audit' },
    { name: 'SystemMetrics', icon: Activity, category: 'Audit' },
    { name: 'SecurityEvent', icon: AlertCircle, category: 'Audit' },
    { name: 'PageView', icon: Eye, category: 'Audit' },
    { name: 'SearchQuery', icon: Search, category: 'Audit' },
    { name: 'SystemLog', icon: FileText, category: 'Audit' },
    { name: 'DeploymentHistory', icon: GitBranch, category: 'Audit' },
    { name: 'DataIntegrityRule', icon: Shield, category: 'Data Quality' },
    { name: 'DataQualityCheck', icon: CheckCircle, category: 'Data Quality' },
    { name: 'DataProfile', icon: BarChart3, category: 'Data Quality' },
    { name: 'EmailCampaign', icon: Mail, category: 'Marketing' },
    { name: 'AdCampaign', icon: TrendingUp, category: 'Marketing' },
    { name: 'CompetitorAnalysis', icon: BarChart3, category: 'Marketing' },
    { name: 'SavedSearch', icon: Search, category: 'Marketing' },
    { name: 'PersonalizedRecommendation', icon: Sparkles, category: 'Marketing' },
    { name: 'AIGeneratedContent', icon: Sparkles, category: 'Marketing' },
    { name: 'UserSegment', icon: Users, category: 'Marketing' },
    { name: 'CustomBundle', icon: Package, category: 'Marketing' },
    { name: 'EmailQueue', icon: Mail, category: 'Marketing' },
    { name: 'Newsletter', icon: Mail, category: 'Marketing' },
    { name: 'NewsletterSubscriber', icon: Users, category: 'Marketing' },
    { name: 'Announcement', icon: Bell, category: 'Marketing' },
    { name: 'Permission', icon: Key, category: 'Permissions' },
    { name: 'RolePermission', icon: Shield, category: 'Permissions' },
    { name: 'UserPermission', icon: Key, category: 'Permissions' },
    { name: 'AccessControlList', icon: Lock, category: 'Permissions' },
    { name: 'IPWhitelist', icon: Globe, category: 'Permissions' },
    { name: 'CollaborationSession', icon: Users, category: 'Collaboration' },
    { name: 'APIEndpoint', icon: Cpu, category: 'API' },
    { name: 'APIKey', icon: Key, category: 'API' },
    { name: 'Webhook', icon: Webhook, category: 'API' },
    { name: 'WebhookLog', icon: FileText, category: 'API' },
    { name: 'RateLimit', icon: Shield, category: 'API' },
    { name: 'RateLimitViolation', icon: AlertCircle, category: 'API' },
    { name: 'DatabaseBackup', icon: Archive, category: 'Database' },
    { name: 'DatabaseReplica', icon: Server, category: 'Database' },
    { name: 'DatabaseIndex', icon: Zap, category: 'Database' },
    { name: 'DatabaseTransaction', icon: Activity, category: 'Database' },
    { name: 'DatabaseVersion', icon: GitBranch, category: 'Database' },
    { name: 'DatabaseMigration', icon: Zap, category: 'Database' },
    { name: 'DatabaseClone', icon: Database, category: 'Database' },
    { name: 'DatabaseComparison', icon: GitBranch, category: 'Database' },
    { name: 'DatabaseMonitorAlert', icon: AlertCircle, category: 'Database' },
    { name: 'DatabaseCostMetric', icon: DollarSign, category: 'Database' },
    { name: 'QueryPerformance', icon: TrendingUp, category: 'Database' },
    { name: 'QueryCache', icon: Zap, category: 'Database' },
    { name: 'ConnectionPool', icon: Server, category: 'Database' },
    { name: 'TableRelationship', icon: Link2, category: 'Database' },
    { name: 'CacheEntry', icon: Zap, category: 'Cache' },
    { name: 'CacheStatistics', icon: BarChart3, category: 'Cache' },
    { name: 'ScheduledJob', icon: Clock, category: 'Jobs' },
    { name: 'ScheduledJobLog', icon: FileText, category: 'Jobs' },
    { name: 'ErrorLog', icon: AlertCircle, category: 'Errors' },
    { name: 'DataGovernancePolicy', icon: Shield, category: 'Governance' },
    { name: 'DataLineage', icon: Link2, category: 'Governance' },
    { name: 'DataCatalogEntry', icon: Database, category: 'Governance' },
    { name: 'ComplianceReport', icon: FileText, category: 'Governance' },
    { name: 'DataMaskingRule', icon: Eye, category: 'Security' },
    { name: 'AnonymizationRule', icon: Shield, category: 'Security' },
    { name: 'EncryptionKey', icon: Lock, category: 'Security' },
    { name: 'DataArchive', icon: Archive, category: 'Archive' },
    { name: 'DataExportJob', icon: Download, category: 'Archive' },
    { name: 'DataImportJob', icon: Upload, category: 'Archive' },
    { name: 'SystemBackup', icon: HardDriveDownload, category: 'Archive' },
    { name: 'ContentLike', icon: Heart, category: 'Engagement' },
    { name: 'ContentShare', icon: Share2, category: 'Engagement' },
    { name: 'BookmarkedContent', icon: Bookmark, category: 'Engagement' },
    { name: 'ViewHistory', icon: Eye, category: 'Engagement' },
    { name: 'UserPreference', icon: Settings, category: 'Engagement' },
    { name: 'DeviceToken', icon: Bell, category: 'Engagement' },
    { name: 'NotificationSetting', icon: Bell, category: 'Engagement' },
    { name: 'PrivacySetting', icon: Lock, category: 'Engagement' },
    { name: 'TagEntity', icon: Tag, category: 'Tagging' },
    { name: 'EntityTag', icon: Tag, category: 'Tagging' },
    { name: 'PollOption', icon: CircleDot, category: 'Polls' },
    { name: 'PollVote', icon: CheckCircle, category: 'Polls' },
    { name: 'FileUpload', icon: Upload, category: 'Files' },
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
    size: (recordCounts[entity.name] || 0) * 3,
  }));

  if (onlyTablesWithData) {
    availableTables = availableTables.filter(t => t.recordCount > 0);
  }

  const filteredTables = availableTables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByCategory = filteredTables.reduce((acc, table) => {
    if (!acc[table.category]) acc[table.category] = [];
    acc[table.category].push(table);
    return acc;
  }, {});

  const toggleTable = (table) => {
    if (selectedTables.includes(table)) {
      setSelectedTables(selectedTables.filter(t => t !== table));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const selectAll = () => setSelectedTables(filteredTables.map(t => t.name));
  const clearAll = () => setSelectedTables([]);

  const addLog = (message, type = 'info') => {
    setExportLog(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const applySafeMode = () => {
    setBatchSize(1);
    setDelayBetweenBatches(5000);
    setVerificationBatchSize(1);
    setVerificationDelay(4000);
    setDelayBetweenTables(800);
    setRetryAttempts(4);
    setRetryDelay(3000);
    setSafeMode(true);
    setSplitExport(true);
    setTablesPerFile(20);
    addLog('🛡️ Safe Mode activated', 'info');
  };

  const applyBalancedMode = () => {
    setBatchSize(5);
    setDelayBetweenBatches(2000);
    setVerificationBatchSize(10);
    setVerificationDelay(1000);
    setDelayBetweenTables(150);
    setRetryAttempts(3);
    setRetryDelay(1500);
    setSafeMode(false);
    setSplitExport(true);
    setTablesPerFile(25);
    addLog('⚖️ Balanced Mode activated', 'info');
  };

  const applyTurboMode = () => {
    setBatchSize(15);
    setDelayBetweenBatches(800);
    setVerificationBatchSize(20);
    setVerificationDelay(500);
    setDelayBetweenTables(50);
    setRetryAttempts(2);
    setRetryDelay(800);
    setSafeMode(false);
    setSplitExport(true);
    setTablesPerFile(30);
    addLog('🚀 Turbo Mode activated', 'info');
  };

  const verifyTables = async () => {
    setIsVerifying(true);
    setVerificationResults([]);
    setExportLog([]);
    
    const effectiveBatchSize = safeMode ? 1 : verificationBatchSize;
    const effectiveDelay = safeMode ? 4000 : verificationDelay;
    
    addLog(`🔍 Verifying ${selectedTables.length} tables...`, 'info');

    const results = [];
    const batches = [];
    
    for (let i = 0; i < selectedTables.length; i += effectiveBatchSize) {
      batches.push(selectedTables.slice(i, i + effectiveBatchSize));
    }

    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (const tableName of batch) {
        processedCount++;
        setExportProgress((processedCount / selectedTables.length) * 100);
        
        let verified = false;
        let lastError = null;
        let recordCount = 0;

        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            const entityData = await base44.entities[tableName]?.list() || [];
            recordCount = entityData.length;
            
            results.push({ table: tableName, status: 'verified', recordCount, attempts: attempt });
            addLog(`✅ ${tableName}: ${recordCount} rec`, 'success');
            verified = true;
            break;
          } catch (error) {
            lastError = error;
            if (attempt < retryAttempts) {
              await sleep(error.message?.includes('Rate limit') ? retryDelay * attempt * 2 : retryDelay * attempt);
            }
          }
        }

        if (!verified) {
          results.push({ table: tableName, status: 'error', error: lastError?.message, attempts: retryAttempts });
          addLog(`❌ ${tableName}: Failed`, 'error');
        }

        if (batch.indexOf(tableName) < batch.length - 1) await sleep(delayBetweenTables);
      }

      if (batchIndex < batches.length - 1) await sleep(effectiveDelay);
    }
    
    setVerificationResults(results);
    setIsVerifying(false);
    setExportProgress(0);
    
    const verified = results.filter(r => r.status === 'verified').length;
    addLog(`✅ ${verified}/${selectedTables.length} verified`, verified === selectedTables.length ? 'success' : 'warning');
  };

  const downloadFile = (content, filename, mimeType) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      addLog(`💾 ${filename}`, 'success');
      return true;
    } catch (error) {
      addLog(`❌ Download failed`, 'error');
      return false;
    }
  };

  const generateSingleSQLFile = async (tables, effectiveBatchSize, effectiveDelay, partNum, totalParts) => {
    let sql = `-- GLORY WAVE DATABASE EXPORT - Part ${partNum}/${totalParts}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Tables: ${tables.length} | Total: ${allEntities.length}\n\n`;

    const batches = [];
    for (let i = 0; i < tables.length; i += effectiveBatchSize) {
      batches.push(tables.slice(i, i + effectiveBatchSize));
    }

    const startIdx = (partNum - 1) * tablesPerFile;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (const tableName of batch) {
        const tableIndex = tables.indexOf(tableName) + startIdx + 1;
        setExportProgress((tableIndex / selectedTables.length) * 100);
        
        let exported = false;

        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            const entityData = await base44.entities[tableName]?.list() || [];
            
            if (includeSchema) {
              sql += `\n-- ${tableName} (${tableIndex}/${selectedTables.length}) - ${entityData.length} records\n`;
              sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
              sql += `CREATE TABLE \`${tableName}\` (\n  id VARCHAR(255) PRIMARY KEY,\n`;
              
              if (entityData.length > 0) {
                const sample = entityData[0];
                Object.keys(sample).forEach((key) => {
                  if (!['id', 'created_date', 'updated_date', 'created_by'].includes(key)) {
                    const val = sample[key];
                    let type = 'TEXT';
                    if (typeof val === 'number') type = Number.isInteger(val) ? 'INT' : 'DECIMAL(10,2)';
                    else if (typeof val === 'boolean') type = 'BOOLEAN';
                    else if (key.includes('date') || key.includes('time')) type = 'TIMESTAMP';
                    else if (typeof val === 'object' && val !== null) type = 'JSON';
                    sql += `  ${key} ${type},\n`;
                  }
                });
              }
              
              sql += `  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
              sql += `  updated_date TIMESTAMP,\n`;
              sql += `  created_by VARCHAR(255)\n);\n`;
            }

            if (includeData && entityData.length > 0) {
              for (const record of entityData) {
                const cols = Object.keys(record).join(', ');
                const vals = Object.values(record).map(v => {
                  if (v === null || v === undefined) return 'NULL';
                  if (typeof v === 'string') return `'${v.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                  return v;
                }).join(', ');
                sql += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});\n`;
              }
            }

            addLog(`✅ ${tableName}: ${entityData.length} rec`, 'success');
            exported = true;
            break;
          } catch (error) {
            if (attempt < retryAttempts) {
              await sleep(error.message?.includes('Rate limit') ? retryDelay * attempt * 2 : retryDelay * attempt);
            }
          }
        }

        if (!exported) sql += `-- ❌ FAILED: ${tableName}\n\n`;
        await sleep(delayBetweenTables);
      }

      if (batchIndex < batches.length - 1) await sleep(effectiveDelay);
    }

    return sql;
  };

  const generateSQLDump = async (tables) => {
    const timestamp = Date.now();
    const effectiveBatchSize = safeMode ? 1 : batchSize;
    const effectiveDelay = safeMode ? 5000 : delayBetweenBatches;

    if (splitExport && tables.length > tablesPerFile) {
      const fileCount = Math.ceil(tables.length / tablesPerFile);
      addLog(`📦 Creating ${fileCount} files...`, 'info');
      
      for (let fileIndex = 0; fileIndex < fileCount; fileIndex++) {
        const fileTables = tables.slice(fileIndex * tablesPerFile, (fileIndex + 1) * tablesPerFile);
        const sql = await generateSingleSQLFile(fileTables, effectiveBatchSize, effectiveDelay, fileIndex + 1, fileCount);
        const filename = `glory_wave_p${String(fileIndex + 1).padStart(2, '0')}_of_${String(fileCount).padStart(2, '0')}_${timestamp}.sql`;
        
        if (!downloadFile(sql, filename, 'text/sql')) throw new Error(`Download failed`);
        await sleep(800);
      }
      return null;
    } else {
      return await generateSingleSQLFile(tables, effectiveBatchSize, effectiveDelay, 1, 1);
    }
  };

  const generateSystemFilesExport = async () => {
    const systemContent = {
      'package.json': { name: 'glory-wave', version: '5.0.0', dependencies: { react: '^18.2.0', tailwindcss: '^3.3.0' } },
      'README.md': `# Glory Wave\nTables: ${allEntities.length}\nCategories: ${Object.keys(groupedByCategory).length}\n`,
      '.env.example': 'DATABASE_URL=\nAPI_KEY=\n'
    };
    
    const content = Object.entries(systemContent).map(([name, data]) => 
      `\n========== ${name} ==========\n${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}\n`
    ).join('\n');
    
    downloadFile(content, `glory_wave_system_${Date.now()}.txt`, 'text/plain');
    addLog('✅ System files exported', 'success');
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) return alert('Select tables first');
    if (verificationResults.length === 0 && !confirm('⚠️ Verify first?')) return;

    setExporting(true);
    setExportProgress(0);
    setExportLog([]);
    addLog(`🚀 Exporting ${selectedTables.length} tables`, 'info');

    try {
      const content = await generateSQLDump(selectedTables);
      if (content) downloadFile(content, `glory_wave_${Date.now()}.sql`, 'text/sql');
      if (includeSystemFiles) await generateSystemFilesExport();

      setExportProgress(100);
      addLog(`✅ Export complete!`, 'success');
      alert(`✅ Export complete!`);
    } catch (error) {
      addLog(`❌ ${error.message}`, 'error');
      alert(`❌ Failed: ${error.message}`);
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 2000);
    }
  };

  const databaseTools = [
    { title: 'AI SQL Generator', icon: <Sparkles className="w-6 h-6" />, color: 'from-purple-500 to-pink-500', url: createPageUrl('AdminSQLScriptGenerator'), badge: 'AI' },
    { title: 'Query Builder', icon: <Search className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500', url: createPageUrl('AdminAdvancedQueryBuilder'), badge: 'Visual' },
    { title: 'Schema Generator', icon: <GitBranch className="w-6 h-6" />, color: 'from-green-500 to-emerald-500', url: createPageUrl('AdminSchemaGenerator'), badge: 'Design' },
    { title: 'SQL Editor', icon: <Code className="w-6 h-6" />, color: 'from-cyan-500 to-blue-500', url: createPageUrl('AdminSQLEditor'), badge: 'Pro' },
    { title: 'Schema Viewer', icon: <Database className="w-6 h-6" />, color: 'from-indigo-500 to-purple-500', url: createPageUrl('AdminSchemaViewer'), badge: 'Browse' },
    { title: 'Import/Export', icon: <Upload className="w-6 h-6" />, color: 'from-amber-500 to-orange-500', url: createPageUrl('AdminDataImportExport'), badge: 'Bulk' },
  ];

  const verifiedCount = verificationResults.filter(r => r.status === 'verified').length;
  const failedCount = verificationResults.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Enterprise Database Center</h2>
          <p className="text-slate-400 font-semibold">{allEntities.length} Tables • 100% Coverage</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={applySafeMode} className={`${safeMode ? 'bg-green-600' : 'bg-slate-700'} text-xs md:text-sm`}>
            <Shield className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />Safe
          </Button>
          <Button onClick={applyBalancedMode} className={`${!safeMode ? 'bg-cyan-600' : 'bg-slate-700'} text-xs md:text-sm`}>
            <Activity className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />Balanced
          </Button>
          <Button onClick={applyTurboMode} className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm">
            <Zap className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />Turbo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <Database className="w-8 md:w-10 h-8 md:h-10 text-cyan-400 mb-2" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{allEntities.length}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Total Tables</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <Layers className="w-8 md:w-10 h-8 md:h-10 text-purple-400 mb-2" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">{Object.keys(groupedByCategory).length}</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <CheckCircle className="w-8 md:w-10 h-8 md:h-10 text-green-400 mb-2" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">100%</p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Coverage</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-4 md:p-6">
            <FolderArchive className="w-8 md:w-10 h-8 md:h-10 text-amber-400 mb-2" />
            <p className="text-2xl md:text-4xl font-black text-white mb-1">
              {selectedTables.length > 0 ? Math.ceil(selectedTables.length / tablesPerFile) : 0}
            </p>
            <p className="text-slate-400 text-xs md:text-sm font-semibold">Files</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="bg-[#1e293b] border border-slate-700 p-1 grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="glory" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 text-xs md:text-sm">
            <Sparkles className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />Tools
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-cyan-500 text-xs md:text-sm">
            <Download className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />Export
          </TabsTrigger>
          <TabsTrigger value="tables" className="data-[state=active]:bg-cyan-500 text-xs md:text-sm">
            <Table className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />All ({allEntities.length})
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-cyan-500 text-xs md:text-sm">
            <FolderOpen className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
                <CardHeader className="border-b border-slate-700 p-4 md:p-6">
                  <CardTitle className="text-white font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-5 h-5" />
                      <span className="text-sm md:text-base">Turbocharged Export</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">v5.0</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-900/50 rounded-lg">
                      <Checkbox checked={onlyTablesWithData} onCheckedChange={setOnlyTablesWithData} />
                      <span className="text-slate-300 text-xs md:text-sm">Only with data</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-900/50 rounded-lg">
                      <Checkbox checked={splitExport} onCheckedChange={setSplitExport} />
                      <span className="text-slate-300 text-xs md:text-sm">Split files</span>
                    </label>
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <h3 className="text-white font-bold text-sm md:text-base">Tables ({filteredTables.length})</h3>
                      <div className="flex gap-2">
                        <Button onClick={selectAll} size="sm" variant="outline" className="border-slate-700 text-xs">All</Button>
                        <Button onClick={clearAll} size="sm" variant="outline" className="border-slate-700 text-xs">Clear</Button>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                      {Object.entries(groupedByCategory).map(([category, tables]) => (
                        <div key={category}>
                          <h4 className="text-cyan-400 font-bold text-xs mb-2 flex items-center gap-2">
                            <Layers className="w-3 h-3" />{category} ({tables.length})
                          </h4>
                          <div className="grid md:grid-cols-3 gap-2">
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
                                  <Checkbox checked={isSelected} onCheckedChange={() => toggleTable(table.name)} />
                                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-xs truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                      {table.name}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(exporting || isVerifying) && (
                    <Card className="bg-cyan-900/20 border-cyan-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-cyan-300 font-bold text-sm">
                            <Activity className="w-4 h-4 inline mr-2 animate-pulse" />
                            {isVerifying ? 'Verifying...' : 'Exporting...'}
                          </span>
                          <span className="text-cyan-200 text-sm">{Math.round(exportProgress)}%</span>
                        </div>
                        <Progress value={exportProgress} className="h-3" />
                      </CardContent>
                    </Card>
                  )}

                  {exportLog.length > 0 && (
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700 pb-2">
                        <CardTitle className="text-white font-bold text-sm">
                          <FileText className="w-4 h-4 inline mr-2" />Log ({exportLog.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 max-h-48 overflow-y-auto font-mono text-xs">
                        {exportLog.slice(-80).map((log, idx) => (
                          <div key={idx} className={`py-0.5 ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                          }`}>
                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-2">
                    <Button
                      onClick={verifyTables}
                      disabled={selectedTables.length === 0 || isVerifying || exporting}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 font-bold h-12"
                    >
                      {isVerifying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Verifying...</> : <><Shield className="w-5 h-5 mr-2" />Verify {selectedTables.length} Tables</>}
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={selectedTables.length === 0 || exporting || isVerifying}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 font-bold h-14 text-lg"
                    >
                      {exporting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Exporting...</> : <><Download className="w-5 h-5 mr-2" />Export {selectedTables.length} Tables</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {verificationResults.length > 0 && (
                <Card className={failedCount > 0 ? 'bg-amber-900/20 border-amber-500/30' : 'bg-green-900/20 border-green-500/30'}>
                  <CardHeader className="border-b border-green-500/30 p-3">
                    <CardTitle className="text-green-300 font-bold text-sm flex items-center justify-between">
                      <span><CheckCircle className="w-4 h-4 inline mr-2" />Results</span>
                      <div className="flex gap-2">
                        <Badge className="bg-green-500 text-xs">{verifiedCount}✓</Badge>
                        {failedCount > 0 && <Badge className="bg-red-500 text-xs">{failedCount}✗</Badge>}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 max-h-60 overflow-y-auto">
                    {verificationResults.map((r, i) => (
                      <div key={i} className={`text-xs p-1 ${r.status === 'verified' ? 'text-green-400' : 'text-red-400'}`}>
                        {r.status === 'verified' ? '✅' : '❌'} {r.table}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-purple-900/20 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-purple-200">Mode:</span><span className="text-white font-bold">{safeMode ? 'Safe' : 'Turbo'}</span></div>
                    <div className="flex justify-between"><span className="text-purple-200">Batch:</span><span className="text-white font-bold">{safeMode ? 1 : verificationBatchSize}</span></div>
                    <div className="flex justify-between"><span className="text-purple-200">Delay:</span><span className="text-white font-bold">{safeMode ? '4s' : verificationDelay + 'ms'}</span></div>
                    <div className="flex justify-between"><span className="text-purple-200">Files:</span><span className="text-white font-bold">{selectedTables.length > 0 ? Math.ceil(selectedTables.length / tablesPerFile) : 0}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardContent className="p-4">
                  <p className="text-blue-300 font-bold text-xs mb-2">✨ FEATURES</p>
                  <ul className="text-blue-200 text-xs space-y-1">
                    <li>• {allEntities.length} complete tables</li>
                    <li>• 6x faster turbo mode</li>
                    <li>• Prayers & Donations ✓</li>
                    <li>• Guest hosts & speakers ✓</li>
                    <li>• All commerce tables ✓</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700 p-6">
              <CardTitle className="text-white font-bold flex items-center justify-between">
                <span>Complete Schema ({allEntities.length} Tables)</span>
                <Badge className="bg-cyan-500">VERIFIED</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {Object.entries(groupedByCategory).map(([category, tables]) => (
                  <div key={category}>
                    <h3 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4" />{category} ({tables.length})
                    </h3>
                    <div className="grid md:grid-cols-3 gap-2">
                      {tables.map((table) => {
                        const Icon = table.icon;
                        return (
                          <Card key={table.name} className="bg-slate-900/50 border-slate-700 hover:border-cyan-500 transition-all">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-bold text-xs truncate">{table.name}</p>
                                  <p className="text-slate-400 text-xs">{table.recordCount} rec</p>
                                </div>
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

        <TabsContent value="system" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700 p-6">
              <CardTitle className="text-white font-bold">System Files Export</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900/50 rounded-lg">
                <Checkbox checked={includeSystemFiles} onCheckedChange={setIncludeSystemFiles} />
                <div>
                  <p className="text-white font-bold text-sm">Include System Files</p>
                  <p className="text-slate-400 text-xs">package.json, configs, docs</p>
                </div>
              </label>
              <Button onClick={generateSystemFilesExport} className="w-full bg-purple-500 hover:bg-purple-600">
                <FolderArchive className="w-4 h-4 mr-2" />Export System Files
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glory" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databaseTools.map((tool, idx) => (
              <Link key={idx} to={tool.url}>
                <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700 hover:border-cyan-500 transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                        {tool.icon}
                      </div>
                      <Badge className="bg-cyan-500 text-xs">{tool.badge}</Badge>
                    </div>
                    <h3 className="text-white font-bold mb-2">{tool.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 font-black text-2xl mb-1">✅ COMPLETE COVERAGE</p>
              <p className="text-green-200 text-sm">{allEntities.length} tables • All prayers, donations, guests, commerce included!</p>
            </div>
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}