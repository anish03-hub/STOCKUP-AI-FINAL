import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Available', value: 8500, color: '#10b981' },
  { name: 'Low Stock', value: 1200, color: '#f59e0b' },
  { name: 'Near Expiry', value: 800, color: '#f97316' },
  { name: 'Out of Stock', value: 150, color: '#ef4444' },
];

const InventoryStatusChart = () => {
  return (
    <div className="chart-card">
      <h3>Inventory Status</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend 
              iconType="circle" 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '24px', fontWeight: 'bold', fill: '#1f2937' }}>
              10.6k
            </text>
            <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '13px', fill: '#6b7280' }}>
              Items
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InventoryStatusChart;
