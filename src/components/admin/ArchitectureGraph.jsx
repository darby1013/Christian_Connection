import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

export default function ArchitectureGraph({ dependencyGraph, realtimeMetrics }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!dependencyGraph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Create nodes with positions
    const entityNames = Object.keys(dependencyGraph).slice(0, 30);
    const centerX = width / 4;
    const centerY = height / 4;
    const radius = Math.min(width, height) / 5;

    const graphNodes = entityNames.map((name, idx) => {
      const angle = (idx / entityNames.length) * 2 * Math.PI;
      const spread = dependencyGraph[name]?.length || 0;
      const nodeRadius = radius * (1 + spread * 0.05);
      
      return {
        id: name,
        x: centerX + nodeRadius * Math.cos(angle),
        y: centerY + nodeRadius * Math.sin(angle),
        radius: 8 + spread * 2,
        deps: dependencyGraph[name] || [],
        health: getNodeHealth(name, realtimeMetrics)
      };
    });

    setNodes(graphNodes);

    // Animation loop
    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, width / 2, height / 2);

      // Apply zoom
      ctx.save();
      ctx.scale(zoom, zoom);

      // Draw edges
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.2)';
      ctx.lineWidth = 1;
      graphNodes.forEach(node => {
        node.deps.forEach(depName => {
          const depNode = graphNodes.find(n => n.id === depName);
          if (depNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(depNode.x, depNode.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      graphNodes.forEach(node => {
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;

        // Node glow for hovered/selected
        if (isHovered || isSelected) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = node.health === 'healthy' ? '#10b981' : 
                            node.health === 'warning' ? '#f59e0b' : '#ef4444';
        }

        // Node color based on health
        ctx.fillStyle = node.health === 'healthy' ? '#10b981' : 
                        node.health === 'warning' ? '#f59e0b' : '#ef4444';
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (isHovered ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Node label
        if (isHovered || isSelected || zoom > 1.2) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.id, node.x, node.y - node.radius - 5);
        }

        // Dependency count
        if (node.deps.length > 0) {
          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.deps.length.toString(), node.x, node.y + 3);
        }
      });

      ctx.restore();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [dependencyGraph, realtimeMetrics, zoom, selectedNode, hoveredNode]);

  const getNodeHealth = (entityName, metrics) => {
    if (!metrics?.services) return 'healthy';
    
    const serviceName = entityName.toLowerCase().includes('service') ? entityName : 
                       entityName.toLowerCase().includes('user') ? 'Auth Service' :
                       entityName.toLowerCase().includes('product') ? 'Product Service' :
                       entityName.toLowerCase().includes('order') ? 'Order Service' : null;
    
    const service = metrics.services.find(s => s.name === serviceName);
    if (!service) return 'healthy';
    
    if (service.cpu > 80 || service.memory > 75) return 'critical';
    if (service.cpu > 60 || service.memory > 60) return 'warning';
    return 'healthy';
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * 2 / zoom;
    const y = (e.clientY - rect.top) * 2 / zoom;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  const handleCanvasMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * 2 / zoom;
    const y = (e.clientY - rect.top) * 2 / zoom;

    const hoveredNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    setHoveredNode(hoveredNode ? hoveredNode.id : null);
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border-purple-500/30">
      <CardHeader className="border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-3 text-xl">
            <Network className="w-6 h-6 text-purple-400" />
            Live System Topology Graph
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              className="border-slate-700 bg-slate-800/50"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoom(1)}
              className="border-slate-700 bg-slate-800/50"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoom(Math.min(3, zoom + 0.2))}
              className="border-slate-700 bg-slate-800/50"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <div>
              <p className="text-white font-bold text-sm">Healthy</p>
              <p className="text-green-400 text-xs">Optimal performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <div>
              <p className="text-white font-bold text-sm">Warning</p>
              <p className="text-yellow-400 text-xs">Elevated metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <p className="text-white font-bold text-sm">Critical</p>
              <p className="text-red-400 text-xs">Requires attention</p>
            </div>
          </div>
        </div>

        <div className="relative bg-slate-950 rounded-xl border border-slate-700 overflow-hidden" style={{ height: '500px' }}>
          <canvas 
            ref={canvasRef} 
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
            className="w-full h-full cursor-pointer"
            style={{ width: '100%', height: '100%' }}
          />
          
          {selectedNodeData && (
            <div className="absolute top-4 left-4 bg-slate-900/95 border border-cyan-500/50 rounded-lg p-4 min-w-[250px] shadow-2xl">
              <h4 className="text-white font-bold text-lg mb-3">{selectedNodeData.id}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Health Status:</span>
                  <Badge className={
                    selectedNodeData.health === 'healthy' ? 'bg-green-600' :
                    selectedNodeData.health === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                  }>
                    {selectedNodeData.health}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dependencies:</span>
                  <span className="text-cyan-400 font-bold">{selectedNodeData.deps.length}</span>
                </div>
                {selectedNodeData.deps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-slate-400 text-xs mb-2">Connected To:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNodeData.deps.map(dep => (
                        <Badge key={dep} className="bg-purple-600 text-xs">{dep}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-slate-400 text-sm mt-4 text-center">
          Click nodes to view details • Scroll to zoom • Colors indicate real-time health status
        </p>
      </CardContent>
    </Card>
  );
}