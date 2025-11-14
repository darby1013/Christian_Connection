import React from 'react';
import EnterpriseCard from './EnterpriseCard';

export default function EnterpriseStats({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <EnterpriseCard
          key={idx}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          trendValue={stat.trendValue}
          subtitle={stat.subtitle}
          color={stat.color || 'cyan'}
        />
      ))}
    </div>
  );
}