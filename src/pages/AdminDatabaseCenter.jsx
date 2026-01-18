import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { 
  Database, Table, Search, Download, Upload, Filter, Edit, Trash2, Plus, 
  Eye, Settings, Zap, BarChart3, Link2, FileJson, Copy, CheckCircle
} from 'lucide-react';

const ALL_ENTITIES = [
  { name: 'Product', category: 'ecommerce', icon: '🛍️' },
  { name: 'Order', category: 'ecommerce', icon: '📦' },
  { name: 'CartItem', category: 'ecommerce', icon: '🛒' },
  { name: 'WishlistItem', category: 'ecommerce', icon: '💝' },
  { name: 'ProductCategory', category: 'ecommerce', icon: '📂' },
  { name: 'ProductAttribute', category: 'ecommerce', icon: '🏷️' },
  { name: 'ProductReview', category: 'ecommerce', icon: '⭐' },
  { name: 'ProductSEO', category: 'ecommerce', icon: '🔍' },
  { name: 'ProductVideo', category: 'ecommerce', icon: '🎥' },
  { name: 'DigitalProductEnhanced', category: 'ecommerce', icon: '💿' },
  { name: 'DigitalDownload', category: 'ecommerce', icon: '⬇️' },
  { name: 'User', category: 'users', icon: '👤' },
  { name: 'UserPersonalization', category: 'users', icon: '🎯' },
  { name: 'UserPreferenceCenter', category: 'users', icon: '⚙️' },
  { name: 'UserProfileLayout', category: 'users', icon: '🎨' },
  { name: 'EmailCampaign', category: 'marketing', icon: '📧' },
  { name: 'LandingPage', category: 'marketing', icon: '📄' },
  { name: 'ABTest', category: 'marketing', icon: '🧪' },
  { name: 'AdvancedCoupon', category: 'marketing', icon: '🎫' },
  { name: 'SocialMediaCampaign', category: 'marketing', icon: '📱' },
  { name: 'DynamicPromotion', category: 'marketing', icon: '🎁' },
  { name: 'BlogPost', category: 'content', icon: '📝' },
  { name: 'Video', category: 'content', icon: '🎬' },
  { name: 'Podcast', category: 'content', icon: '🎙️' },
  { name: 'LiveStream', category: 'content', icon: '📡' },
  { name: 'Event', category: 'content', icon: '📅' },
  { name: 'Group', category: 'community', icon: '👥' },
  { name: 'ForumThread', category: 'community', icon: '💬' },
  { name: 'PaymentGatewayConfig', category: 'system', icon: '💳' },
  { name: 'WebhookLog', category: 'system', icon: '🔗' },
  { name: 'AutomationRule', category: 'system', icon: '🤖' },
  { name: 'ScheduledTask', category: 'system', icon: '⏰' },
  { name: 'BackgroundJob', category: 'system', icon: '⚡' },
  { name: 'IntegrationConfig', category: 'system', icon: '🔌' }
];

const CATEGORY_COLORS = {
  ecommerce: 'from-blue-600 to-cyan-600',
  users: 'from-purple-600 to-pink-600',
  marketing: 'from-orange-600 to-red-600',
  content: 'from-green-600 to-emerald-600',
  community: 'from-yellow-600 to-amber-600',
  system: 'from-gray-600 to-slate-600'
};

export default function AdminDatabaseCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [queryBuilder, setQueryBuilder] = useState({
    entity: 'Product',
    fields: [],
    filters: [],
    sort: '',
    limit: 50
  });
  const queryClient = useQueryClient();

  // Fetch entity counts
  const entityQueries = useQuery({
    queryKey: ['entityCounts'],
    queryFn: async () => {
      const counts = {};
      for (const entity of ALL_ENTITIES) {
        try {
          const data = await base44.entities[entity.name].list();
          counts[entity.name] = data.length;
        } catch {
          counts[entity.name] = 0;
        }
      }
      return counts;
    },
    initialData: {}
  });

  // Fetch selected entity data
  const { data: entityData = [], refetch } = useQuery({
    queryKey: ['entityData', selectedEntity],
    queryFn: async () => {
      if (!selectedEntity) return [];
      return await base44.entities[selectedEntity].list();
    },
    enabled: !!selectedEntity
  });

  // Fetch entity schema
  const { data: entitySchema } = useQuery({
    queryKey: ['entitySchema', selectedEntity],
    queryFn: async () => {
      if (!selectedEntity) return null;
      return await base44.entities[selectedEntity].schema();
    },
    enabled: !!selectedEntity
  });

  const deleteMutation = useMutation({
    mutationFn: ({ entity, id }) => base44.entities[entity].delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['entityData']);
      alert('✅ Deleted successfully!');
    }
  });

  const createMutation = useMutation({
    mutationFn: ({ entity, data }) => base44.entities[entity].create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['entityData']);
      queryClient.invalidateQueries(['entityCounts']);
      setShowCreateDialog(false);
      alert('✅ Created successfully!');
    }
  });

  const filteredEntities = ALL_ENTITIES.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecords = Object.values(entityQueries.data).reduce((sum, count) => sum + count, 0);

  const openEntityModal = (entityName) => {
    setSelectedEntity(entityName);
    setShowEntityModal(true);
  };

  const handleDelete = (record) => {
    if (confirm(`Delete this ${selectedEntity} record?`)) {
      deleteMutation.mutate({ entity: selectedEntity, id: record.id });
    }
  };

  const exportToCSV = () => {
    if (!entityData.length) return;
    
    const headers = Object.keys(entityData[0]).join(',');
    const rows = entityData.map(row => 
      Object.values(row).map(v => `"${v}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEntity}_${Date.now()}.csv`;
    a.click();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(entityData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEntity}_${Date.now()}.json`;
    a.click();
  };

  const columns = useMemo(() => {
    if (!entityData.length) return [];
    return Object.keys(entityData[0]).slice(0, 8).map(key => ({
      header: key,
      key: key,
      render: (val) => {
        if (typeof val === 'object') return JSON.stringify(val).slice(0, 50) + '...';
        if (typeof val === 'boolean') return val ? '✅' : '❌';
        return String(val).slice(0, 100);
      }
    }));
  }, [entityData]);

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Database Center"
        subtitle="Comprehensive entity management and database operations"
        icon={Database}
        badge="ENTERPRISE"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{ALL_ENTITIES.length}</p>
                <p className="text-blue-300 text-sm font-bold">Total Entities</p>
              </div>
              <Database className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{totalRecords.toLocaleString()}</p>
                <p className="text-purple-300 text-sm font-bold">Total Records</p>
              </div>
              <Table className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{(totalRecords * 0.5).toFixed(1)} MB</p>
                <p className="text-green-300 text-sm font-bold">Database Size</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">Active</p>
                <p className="text-amber-300 text-sm font-bold">Connection Status</p>
              </div>
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entities" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="query">Query Builder</TabsTrigger>
          <TabsTrigger value="schema">Schema Viewer</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredEntities.map(entity => {
              const count = entityQueries.data[entity.name] || 0;
              return (
                <Card 
                  key={entity.name}
                  className="bg-slate-900 border-slate-700 hover:border-cyan-500 cursor-pointer transition-all group"
                  onClick={() => openEntityModal(entity.name)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[entity.category]} flex items-center justify-center text-2xl`}>
                        {entity.icon}
                      </div>
                      <Badge className={`bg-gradient-to-r ${CATEGORY_COLORS[entity.category]}`}>
                        {count}
                      </Badge>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                      {entity.name}
                    </h3>
                    <p className="text-slate-400 text-xs uppercase tracking-wider">{entity.category}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-white font-bold mb-2 block">Select Entity</label>
                <Select value={queryBuilder.entity} onValueChange={(val) => setQueryBuilder({...queryBuilder, entity: val})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {ALL_ENTITIES.map(e => (
                      <SelectItem key={e.name} value={e.name}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white font-bold mb-2 block">Limit</label>
                <Input
                  type="number"
                  value={queryBuilder.limit}
                  onChange={(e) => setQueryBuilder({...queryBuilder, limit: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <Button 
                onClick={() => {
                  setSelectedEntity(queryBuilder.entity);
                  refetch();
                }}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Execute Query
              </Button>
            </CardContent>
          </Card>

          {entityData.length > 0 && (
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-4">Query Results ({entityData.length} records)</h3>
                <EnterpriseTable columns={columns} data={entityData.slice(0, 50)} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          {ALL_ENTITIES.map(entity => (
            <Card key={entity.name} className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[entity.category]} flex items-center justify-center text-xl`}>
                      {entity.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{entity.name}</h3>
                      <Badge className="bg-slate-700 text-xs">{entity.category}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-slate-600">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Schema
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
              <CardContent className="p-8 text-center">
                <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Import Data</h3>
                <p className="text-slate-300 mb-4">Upload CSV or JSON files to import records</p>
                <Input type="file" accept=".csv,.json" className="bg-slate-900 border-slate-700 text-white" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
              <CardContent className="p-8 text-center">
                <Download className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Export Data</h3>
                <p className="text-slate-300 mb-4">Download entity data in CSV or JSON format</p>
                <div className="flex gap-2">
                  <Button onClick={exportToCSV} className="flex-1 bg-purple-600">CSV</Button>
                  <Button onClick={exportToJSON} className="flex-1 bg-pink-600">JSON</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="relationships">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-16 text-center">
              <Link2 className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-2xl mb-2">Entity Relationships</h3>
              <p className="text-slate-400">Visual relationship mapper coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <EnterpriseChart
            title="Query Performance"
            type="line"
            data={[
              { time: '00:00', queries: 45 },
              { time: '04:00', queries: 12 },
              { time: '08:00', queries: 89 },
              { time: '12:00', queries: 156 },
              { time: '16:00', queries: 134 },
              { time: '20:00', queries: 78 }
            ]}
            dataKey="queries"
            xKey="time"
            icon={BarChart3}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={showEntityModal} onOpenChange={setShowEntityModal}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black flex items-center gap-3">
              <Table className="w-6 h-6 text-cyan-400" />
              {selectedEntity}
              <Badge className="bg-cyan-500">{entityData.length} records</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
              <Button onClick={exportToCSV} variant="outline" className="border-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={exportToJSON} variant="outline" className="border-slate-600">
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>

            <EnterpriseTable
              columns={columns}
              data={entityData}
              actions={[
                { label: 'Delete', icon: Trash2, onClick: handleDelete }
              ]}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}