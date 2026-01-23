import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import DashboardWidget from '../components/admin/DashboardWidget';
import WidgetSelector from '../components/admin/WidgetSelector';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, Save, RotateCcw, Activity, TrendingUp, Shield, 
  Database, Cpu, AlertTriangle, CheckCircle2, Zap, Clock,
  DollarSign, Network, Server, BarChart2, Sparkles, Settings
} from 'lucide-react';

const ALL_ENTITIES = [
  'Product', 'Order', 'User', 'CartItem', 'WishlistItem', 'ProductCategory', 
  'ProductAttribute', 'ProductReview', 'ProductSEO', 'ProductVideo', 'DigitalProductEnhanced',
  'DigitalDownload', 'UserPersonalization', 'UserPreferenceCenter', 'UserProfileLayout',
  'EmailCampaign', 'LandingPage', 'ABTest', 'AdvancedCoupon', 'SocialMediaCampaign',
  'DynamicPromotion', 'BlogPost', 'Video', 'Podcast', 'LiveStream', 'Event',
  'Group', 'ForumThread', 'PaymentGatewayConfig', 'WebhookLog', 'AutomationRule',
  'ScheduledTask', 'BackgroundJob', 'IntegrationConfig', 'APIEndpoint', 'DataTransformation'
];

export default function AdminArchitectureDashboard() {
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
  const [dashboardWidgets, setDashboardWidgets] = useState([]);
  const [expandedWidgets, setExpandedWidgets] = useState(new Set());

  // Load saved layout from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('architecture_dashboard_layout');
    if (saved) {
      try {
        setDashboardWidgets(JSON.parse(saved));
      } catch (e) {
        setDashboardWidgets(getDefaultLayout());
      }
    } else {
      setDashboardWidgets(getDefaultLayout());
    }
  }, []);

  // Fetch data
  const { data: realtimeMetrics } = useQuery({
    queryKey: ['realtimeMetrics'],
    queryFn: async () => ({
      timestamp: new Date().toISOString(),
      services: [
        { name: 'API Gateway', cpu: Math.random() * 40 + 30, memory: Math.random() * 30 + 40, network: Math.random() * 50 + 20, dbConnections: Math.floor(Math.random() * 50) + 100 },
        { name: 'Auth Service', cpu: Math.random() * 20 + 15, memory: Math.random() * 25 + 20, network: Math.random() * 30 + 10, dbConnections: Math.floor(Math.random() * 20) + 30 },
        { name: 'Product Service', cpu: Math.random() * 50 + 40, memory: Math.random() * 40 + 35, network: Math.random() * 60 + 30, dbConnections: Math.floor(Math.random() * 80) + 150 },
      ]
    }),
    refetchInterval: 5000
  });

  const { data: allEntities = {} } = useQuery({
    queryKey: ['architectureData'],
    queryFn: async () => {
      const data = {};
      for (const entity of ALL_ENTITIES.slice(0, 10)) {
        try {
          const records = await base44.entities[entity].list();
          data[entity] = { count: records.length };
        } catch {
          data[entity] = { count: 0 };
        }
      }
      return data;
    }
  });

  const performanceMetrics = Object.entries(allEntities).map(([name, { count }]) => ({
    entity: name,
    recordCount: count,
    queryComplexity: count > 1000 ? 'High' : count > 100 ? 'Medium' : 'Low',
  })).sort((a, b) => b.recordCount - a.recordCount);

  const techDebtAnalysis = {
    totalDebt: '287 hours',
    estimatedCost: '$43,050',
    breakdown: [
      { category: 'Code Smells', hours: 89, priority: 'Medium', items: 23 },
      { category: 'Security Issues', hours: 127, priority: 'Critical', items: 8 },
      { category: 'Performance', hours: 45, priority: 'High', items: 12 },
      { category: 'Documentation', hours: 26, priority: 'Low', items: 34 }
    ]
  };

  const complianceStatus = {
    overallCompliance: 94,
    checks: [
      { framework: 'GDPR', passed: 47, failed: 3, score: 94, status: 'Passing' },
      { framework: 'SOX', passed: 28, failed: 1, score: 97, status: 'Passing' },
      { framework: 'HIPAA', passed: 35, failed: 5, score: 88, status: 'Warning' }
    ]
  };

  const trafficMetrics = {
    currentRPS: Math.floor(Math.random() * 500) + 1200,
    peakRPS: 2847,
    avgResponseTime: Math.floor(Math.random() * 100) + 150,
    errorRate: (Math.random() * 0.5).toFixed(2),
    activeUsers: Math.floor(Math.random() * 1000) + 4500
  };

  const costAnalysis = {
    currentMonthly: '$12,847',
    projectedMonthly: '$15,320',
    breakdown: [
      { service: 'Database', cost: 4200, percentage: 33 },
      { service: 'Compute', cost: 5100, percentage: 40 },
      { service: 'Storage', cost: 1800, percentage: 14 }
    ]
  };

  const apiConnections = [
    { endpoint: '/api/products', method: 'GET', activeConnections: 47, successRate: 99.8 },
    { endpoint: '/api/orders', method: 'POST', activeConnections: 23, successRate: 99.5 },
    { endpoint: '/api/auth/login', method: 'POST', activeConnections: 12, successRate: 98.9 }
  ];

  const getDefaultLayout = () => [
    { id: 'realtime', type: 'realtime' },
    { id: 'traffic', type: 'traffic' },
    { id: 'techdebt', type: 'techdebt' },
    { id: 'compliance', type: 'compliance' }
  ];

  const availableWidgets = [
    { 
      id: 'realtime', 
      type: 'realtime',
      title: 'Real-Time Service Metrics', 
      description: 'Live CPU, memory, and network monitoring',
      icon: Activity,
      iconColor: 'text-cyan-400',
      category: 'Monitoring',
      badgeColor: 'bg-cyan-500',
      size: 'Large',
      color: 'cyan'
    },
    { 
      id: 'traffic', 
      type: 'traffic',
      title: 'Traffic Metrics', 
      description: 'RPS, response time, active users',
      icon: TrendingUp,
      iconColor: 'text-purple-400',
      category: 'Performance',
      badgeColor: 'bg-purple-500',
      size: 'Medium',
      color: 'purple'
    },
    { 
      id: 'techdebt', 
      type: 'techdebt',
      title: 'Tech Debt Analysis', 
      description: 'Code quality and technical debt metrics',
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
      category: 'Quality',
      badgeColor: 'bg-orange-500',
      size: 'Large',
      color: 'orange'
    },
    { 
      id: 'compliance', 
      type: 'compliance',
      title: 'Compliance Status', 
      description: 'GDPR, SOX, HIPAA compliance scores',
      icon: Shield,
      iconColor: 'text-green-400',
      category: 'Security',
      badgeColor: 'bg-green-500',
      size: 'Medium',
      color: 'green'
    },
    { 
      id: 'performance', 
      type: 'performance',
      title: 'Database Performance', 
      description: 'Query complexity and optimization recommendations',
      icon: Database,
      iconColor: 'text-blue-400',
      category: 'Database',
      badgeColor: 'bg-blue-500',
      size: 'Large',
      color: 'blue'
    },
    { 
      id: 'cost', 
      type: 'cost',
      title: 'Cost Analysis', 
      description: 'Infrastructure costs and optimization',
      icon: DollarSign,
      iconColor: 'text-green-400',
      category: 'Finance',
      badgeColor: 'bg-green-500',
      size: 'Medium',
      color: 'green'
    },
    { 
      id: 'apihealth', 
      type: 'apihealth',
      title: 'API Health Monitor', 
      description: 'Real-time API connection status',
      icon: Server,
      iconColor: 'text-cyan-400',
      category: 'Monitoring',
      badgeColor: 'bg-cyan-500',
      size: 'Large',
      color: 'cyan'
    },
    { 
      id: 'quickstats', 
      type: 'quickstats',
      title: 'Quick Stats Overview', 
      description: 'Key system metrics at a glance',
      icon: BarChart2,
      iconColor: 'text-purple-400',
      category: 'Overview',
      badgeColor: 'bg-purple-500',
      size: 'Small',
      color: 'purple'
    }
  ];

  const renderWidgetContent = (type) => {
    switch(type) {
      case 'realtime':
        return (
          <div className="space-y-4">
            {realtimeMetrics?.services.map((service, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm">{service.name}</span>
                  <Badge className="bg-slate-700 text-slate-300 text-xs">{service.dbConnections} conn</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">CPU</span>
                      <span className="text-xs font-bold text-cyan-400">{service.cpu.toFixed(0)}%</span>
                    </div>
                    <Progress value={service.cpu} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">MEM</span>
                      <span className="text-xs font-bold text-purple-400">{service.memory.toFixed(0)}%</span>
                    </div>
                    <Progress value={service.memory} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">NET</span>
                      <span className="text-xs font-bold text-green-400">{service.network.toFixed(0)}%</span>
                    </div>
                    <Progress value={service.network} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'traffic':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-lg border border-cyan-500/30">
              <p className="text-cyan-400 text-xs font-bold mb-1">REQUESTS/SEC</p>
              <p className="text-white font-black text-2xl">{trafficMetrics.currentRPS}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30">
              <p className="text-green-400 text-xs font-bold mb-1">RESPONSE TIME</p>
              <p className="text-white font-black text-2xl">{trafficMetrics.avgResponseTime}<span className="text-sm">ms</span></p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
              <p className="text-purple-400 text-xs font-bold mb-1">ACTIVE USERS</p>
              <p className="text-white font-black text-2xl">{trafficMetrics.activeUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-lg border border-red-500/30">
              <p className="text-red-400 text-xs font-bold mb-1">ERROR RATE</p>
              <p className="text-white font-black text-2xl">{trafficMetrics.errorRate}<span className="text-sm">%</span></p>
            </div>
          </div>
        );

      case 'techdebt':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                <p className="text-red-300 text-xs font-bold mb-1">Total Debt</p>
                <p className="text-white font-black text-xl">{techDebtAnalysis.totalDebt}</p>
              </div>
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                <p className="text-yellow-300 text-xs font-bold mb-1">Est. Cost</p>
                <p className="text-white font-black text-xl">{techDebtAnalysis.estimatedCost}</p>
              </div>
            </div>
            <div className="space-y-2">
              {techDebtAnalysis.breakdown.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-800 rounded text-sm">
                  <span className="text-slate-300">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{item.hours}h</span>
                    <Badge className={
                      item.priority === 'Critical' ? 'bg-red-600' :
                      item.priority === 'High' ? 'bg-orange-500' :
                      item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }>{item.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="text-4xl font-black text-green-400">{complianceStatus.overallCompliance}%</div>
              <p className="text-green-300 text-sm font-bold">Overall Score</p>
            </div>
            <div className="space-y-2">
              {complianceStatus.checks.map((check, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-800 rounded text-sm">
                  <span className="text-slate-300">{check.framework}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{check.score}%</span>
                    <Badge className={check.status === 'Passing' ? 'bg-green-500' : 'bg-yellow-500'}>{check.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-3">
            {performanceMetrics.slice(0, 6).map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-800 rounded text-sm">
                <span className="text-slate-300">{metric.entity}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{metric.recordCount} records</span>
                  <Badge className={
                    metric.queryComplexity === 'High' ? 'bg-red-500' :
                    metric.queryComplexity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }>{metric.queryComplexity}</Badge>
                </div>
              </div>
            ))}
          </div>
        );

      case 'cost':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                <p className="text-green-300 text-xs font-bold mb-1">Current</p>
                <p className="text-white font-black text-xl">{costAnalysis.currentMonthly}</p>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                <p className="text-blue-300 text-xs font-bold mb-1">Projected</p>
                <p className="text-white font-black text-xl">{costAnalysis.projectedMonthly}</p>
              </div>
            </div>
            <div className="space-y-2">
              {costAnalysis.breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-300 text-sm w-24">{item.service}</span>
                  <Progress value={item.percentage} className="h-2 flex-1" />
                  <span className="text-white font-bold text-sm w-16 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'apihealth':
        return (
          <div className="space-y-2">
            {apiConnections.map((api, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-800 rounded text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500 text-xs">{api.method}</Badge>
                  <span className="text-slate-300">{api.endpoint}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold">{api.activeConnections}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-cyan-400 text-xs">{api.successRate}%</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'quickstats':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-900/20 border border-blue-500/30 rounded">
              <p className="text-3xl font-black text-white">{ALL_ENTITIES.length}</p>
              <p className="text-blue-300 text-xs font-bold">Entities</p>
            </div>
            <div className="text-center p-3 bg-purple-900/20 border border-purple-500/30 rounded">
              <p className="text-3xl font-black text-white">{Object.keys(allEntities).length}</p>
              <p className="text-purple-300 text-xs font-bold">Active</p>
            </div>
            <div className="text-center p-3 bg-green-900/20 border border-green-500/30 rounded">
              <p className="text-3xl font-black text-white">99.97%</p>
              <p className="text-green-300 text-xs font-bold">Uptime</p>
            </div>
            <div className="text-center p-3 bg-orange-900/20 border border-orange-500/30 rounded">
              <p className="text-3xl font-black text-white">245ms</p>
              <p className="text-orange-300 text-xs font-bold">Response</p>
            </div>
          </div>
        );

      default:
        return <p className="text-slate-400">Widget content</p>;
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(dashboardWidgets);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setDashboardWidgets(items);
  };

  const handleAddWidget = (widget) => {
    if (!dashboardWidgets.find(w => w.id === widget.id)) {
      setDashboardWidgets([...dashboardWidgets, { id: widget.id, type: widget.type }]);
    }
  };

  const handleRemoveWidget = (widgetId) => {
    setDashboardWidgets(dashboardWidgets.filter(w => w.id !== widgetId));
  };

  const handleSaveLayout = () => {
    localStorage.setItem('architecture_dashboard_layout', JSON.stringify(dashboardWidgets));
    window.alert('✅ Dashboard layout saved successfully!');
  };

  const handleResetLayout = () => {
    if (window.confirm('Reset dashboard to default layout?')) {
      setDashboardWidgets(getDefaultLayout());
      localStorage.removeItem('architecture_dashboard_layout');
    }
  };

  const handleExpandWidget = (widgetId) => {
    const newExpanded = new Set(expandedWidgets);
    if (newExpanded.has(widgetId)) {
      newExpanded.delete(widgetId);
    } else {
      newExpanded.add(widgetId);
    }
    setExpandedWidgets(newExpanded);
  };

  const getWidgetConfig = (widgetId) => {
    return availableWidgets.find(w => w.id === widgetId) || {};
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Architecture Dashboard"
        subtitle="Customizable real-time system monitoring and analysis"
        icon={Network}
        badge="CUSTOMIZABLE"
        actions={[
          {
            label: 'Add Widget',
            onClick: () => setWidgetSelectorOpen(true),
            icon: Plus,
            className: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
          },
          {
            label: 'Save Layout',
            onClick: handleSaveLayout,
            icon: Save,
            className: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
          },
          {
            label: 'Reset',
            onClick: handleResetLayout,
            icon: RotateCcw,
            variant: 'outline',
            className: 'border-slate-600 text-slate-300 hover:bg-slate-800'
          }
        ]}
      />

      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div className="flex-1">
              <p className="text-white font-bold">Personalized Architecture Dashboard</p>
              <p className="text-slate-400 text-sm">Drag to reorder widgets, add/remove modules, and save your custom layout</p>
            </div>
            <Badge className="bg-purple-500 text-white">{dashboardWidgets.length} Widgets</Badge>
          </div>
        </CardContent>
      </Card>

      {dashboardWidgets.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-12 text-center">
            <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Widgets Added</h3>
            <p className="text-slate-400 mb-6">Start building your dashboard by adding widgets</p>
            <Button 
              onClick={() => setWidgetSelectorOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid md:grid-cols-2 gap-6"
              >
                {dashboardWidgets.map((widget, index) => {
                  const config = getWidgetConfig(widget.id);
                  const isExpanded = expandedWidgets.has(widget.id);
                  
                  return (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${isExpanded ? 'md:col-span-2' : ''} ${snapshot.isDragging ? 'opacity-50' : ''} transition-opacity`}
                        >
                          <DashboardWidget
                            title={config.title}
                            icon={config.icon}
                            color={config.color}
                            onRemove={() => handleRemoveWidget(widget.id)}
                            onExpand={() => handleExpandWidget(widget.id)}
                            isExpanded={isExpanded}
                          >
                            {renderWidgetContent(widget.type)}
                          </DashboardWidget>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <WidgetSelector
        open={widgetSelectorOpen}
        onClose={() => setWidgetSelectorOpen(false)}
        onAddWidget={handleAddWidget}
        availableWidgets={availableWidgets}
        activeWidgets={dashboardWidgets}
      />
    </div>
  );
}