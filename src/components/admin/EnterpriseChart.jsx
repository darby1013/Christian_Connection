import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  primary: '#22d3ee',
  secondary: '#a855f7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export default function EnterpriseChart({ 
  title, 
  subtitle,
  type = 'area',
  data,
  dataKey,
  xKey = 'name',
  height = 300,
  colors = ['primary'],
  icon: Icon,
  children
}) {
  const getColor = (colorName, index = 0) => {
    return COLORS[colorName] || COLORS[Object.keys(COLORS)[index % Object.keys(COLORS).length]];
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 }
    };

    switch(type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getColor(colors[0])} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={getColor(colors[0])} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={getColor(colors[0])} 
              fillOpacity={1} 
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
            <Bar dataKey={dataKey} fill={getColor(colors[0])} radius={[8, 8, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={getColor(colors[0])} 
              strokeWidth={3}
              dot={{ fill: getColor(colors[0]), r: 4 }}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={5}
              dataKey={dataKey}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(colors[index] || 'primary', index)} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-cyan-500/30 transition-all">
      <CardHeader className="border-b border-slate-700/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${colors[0]}-500/20 to-${colors[0]}-600/20 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${colors[0]}-400`} />
              </div>
            )}
            <div>
              <CardTitle className="text-white font-bold text-lg">{title}</CardTitle>
              {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {children || (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}