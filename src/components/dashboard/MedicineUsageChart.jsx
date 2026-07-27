import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', Paracetamol: 400, Amoxicillin: 240, Ibuprofen: 300 },
  { name: 'Tue', Paracetamol: 300, Amoxicillin: 139, Ibuprofen: 200 },
  { name: 'Wed', Paracetamol: 200, Amoxicillin: 980, Ibuprofen: 278 },
  { name: 'Thu', Paracetamol: 278, Amoxicillin: 390, Ibuprofen: 189 },
  { name: 'Fri', Paracetamol: 189, Amoxicillin: 480, Ibuprofen: 239 },
  { name: 'Sat', Paracetamol: 239, Amoxicillin: 380, Ibuprofen: 349 },
  { name: 'Sun', Paracetamol: 349, Amoxicillin: 430, Ibuprofen: 200 },
];

const MedicineUsageChart = () => {
  return (
    <div className="chart-card">
      <h3>Last 7 Days Usage</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="Paracetamol" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Amoxicillin" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Ibuprofen" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MedicineUsageChart;
