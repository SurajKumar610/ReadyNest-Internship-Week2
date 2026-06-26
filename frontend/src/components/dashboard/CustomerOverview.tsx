'use client';

import React, { useState } from 'react';
import { 
  ResponsiveContainer as RC, LineChart as LC, Line as L, AreaChart as AC, Area as A, 
  ScatterChart as SC, Scatter as S, XAxis as X, YAxis as Y, ZAxis as Z, CartesianGrid as CG, Tooltip as T,
  PieChart as PC, Pie as P, Cell as C, Legend as Leg 
} from 'recharts';
import { Users, UserPlus, HeartHandshake, UserX, Trophy, MapPin, TrendingUp } from 'lucide-react';

interface CustomerOverviewProps {
  segments: any[];
  customerData?: any;
  regional?: any;
}

export default function CustomerOverview({ segments, customerData, regional }: CustomerOverviewProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Safe fallback data
  const dataSegments = segments.length > 0 ? segments : [
    { id: 1, customer_name: 'Alice Johnson', rfm_recency: 15, rfm_frequency: 12, rfm_monetary: 849.00, segment_name: 'Champions', cluster_id: 0 },
    { id: 2, customer_name: 'Bob Smith', rfm_recency: 30, rfm_frequency: 8, rfm_monetary: 2058.00, segment_name: 'Loyal Customers', cluster_id: 0 },
    { id: 3, customer_name: 'Charlie Brown', rfm_recency: 105, rfm_frequency: 1, rfm_monetary: 120.00, segment_name: 'At Risk', cluster_id: 1 },
    { id: 4, customer_name: 'Diana Prince', rfm_recency: 90, rfm_frequency: 2, rfm_monetary: 178.00, segment_name: 'Potential Loyalists', cluster_id: 2 },
    { id: 5, customer_name: 'Evan Wright', rfm_recency: 80, rfm_frequency: 1, rfm_monetary: 95.00, segment_name: 'At Risk', cluster_id: 1 },
    { id: 6, customer_name: 'Fiona Gallagher', rfm_recency: 70, rfm_frequency: 3, rfm_monetary: 550.00, segment_name: 'Loyal Customers', cluster_id: 0 },
    { id: 7, customer_name: 'George Clark', rfm_recency: 60, rfm_frequency: 1, rfm_monetary: 49.00, segment_name: 'New Customers', cluster_id: 3 }
  ];

  // RFM segment card aggregations
  const segmentStats = {
    'Champions': { count: 0, total_sales: 0, icon: Users, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    'Loyal Customers': { count: 0, total_sales: 0, icon: HeartHandshake, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    'Potential Loyalists': { count: 0, total_sales: 0, icon: UserPlus, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    'At Risk': { count: 0, total_sales: 0, icon: UserX, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    'New Customers': { count: 0, total_sales: 0, icon: UserPlus, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' }
  };

  dataSegments.forEach((s: any) => {
    const name = s.segment_name;
    if (name in segmentStats) {
      segmentStats[name as keyof typeof segmentStats].count += 1;
      segmentStats[name as keyof typeof segmentStats].total_sales += s.rfm_monetary;
    }
  });

  // Growth & Retention chart dataset (last 6 months)
  const growthRetentionData = customerData?.monthly_customer_trend || [
    { month: 'Jul', activeCustomers: 110, newCustomers: 15, retentionRate: 75.1 },
    { month: 'Aug', activeCustomers: 122, newCustomers: 18, retentionRate: 75.8 },
    { month: 'Sep', activeCustomers: 129, newCustomers: 12, retentionRate: 76.5 },
    { month: 'Oct', activeCustomers: 135, newCustomers: 14, retentionRate: 77.2 },
    { month: 'Nov', activeCustomers: 142, newCustomers: 19, retentionRate: 77.9 },
    { month: 'Dec', activeCustomers: 150, newCustomers: 22, retentionRate: 78.4 }
  ];

  // Pie chart segment distribution
  const segmentPieData = Object.entries(segmentStats).map(([name, data]) => ({
    name,
    value: data.count
  })).filter(d => d.value > 0);

  const COLORS = ['#10b981', '#818cf8', '#60a5fa', '#f43f5e', '#2dd4bf'];

  // K-Means Scatter Plot clusters formatting
  const cluster0Data = dataSegments.filter((s: any) => s.cluster_id === 0).map((s: any) => ({ x: s.rfm_recency, y: s.rfm_monetary, z: s.rfm_frequency, name: s.customer_name }));
  const cluster1Data = dataSegments.filter((s: any) => s.cluster_id === 1).map((s: any) => ({ x: s.rfm_recency, y: s.rfm_monetary, z: s.rfm_frequency, name: s.customer_name }));
  const cluster2Data = dataSegments.filter((s: any) => s.cluster_id === 2).map((s: any) => ({ x: s.rfm_recency, y: s.rfm_monetary, z: s.rfm_frequency, name: s.customer_name }));
  const cluster3Data = dataSegments.filter((s: any) => s.cluster_id === 3).map((s: any) => ({ x: s.rfm_recency, y: s.rfm_monetary, z: s.rfm_frequency, name: s.customer_name }));

  const filteredCustomers = selectedSegment
    ? dataSegments.filter((s: any) => s.segment_name === selectedSegment)
    : dataSegments;

  const top10Customers = [...dataSegments]
    .sort((a, b) => (b.rfm_monetary || 0) - (a.rfm_monetary || 0))
    .slice(0, 10);

  const byRegionData = regional?.by_region || [
    { region: 'North America', revenue: 105250.00, profit: 35110.00 },
    { region: 'Europe', revenue: 40000.00, profit: 13100.00 },
    { region: 'Asia-Pacific', revenue: 15200.00, profit: 4800.00 }
  ];
  const totalRegionRevenue = byRegionData.reduce((acc: number, r: any) => acc + (r.revenue || 0), 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Interactive Segment summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(segmentStats).map(([name, stat]) => {
          const Icon = stat.icon;
          const isSelected = selectedSegment === name;
          return (
            <div 
              key={name}
              onClick={() => setSelectedSegment(isSelected ? null : name)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-102 flex flex-col justify-between h-28 ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'bg-[#0d1424]/75 border-slate-800/60'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[80%]">{name}</span>
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-2">
                <h2 className="text-2xl font-extrabold text-white">{stat.count}</h2>
                <p className="text-[9px] text-slate-500 font-semibold truncate">Avg: ${(stat.total_sales / Math.max(1, stat.count)).toFixed(0)} / customer</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Row 1: Growth & Retention & Segment Donut */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Growth & Retention charts */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-350">Customer Growth & Retention Curves</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Active customer counts and percentage retention curves side-by-side</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="h-52 w-full">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center">Active Customer Count</span>
              <RC width="100%" height="100%">
                <LC data={growthRetentionData}>
                  <CG strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                  <X dataKey="month" stroke="#94a3b8" fontSize={8} />
                  <Y stroke="#94a3b8" fontSize={8} />
                  <T />
                  <L type="monotone" dataKey="activeCustomers" name="Active" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
                </LC>
              </RC>
            </div>
            <div className="h-52 w-full">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center">Customer Retention Rate (%)</span>
              <RC width="100%" height="100%">
                <AC data={growthRetentionData}>
                  <CG strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                  <X dataKey="month" stroke="#94a3b8" fontSize={8} />
                  <Y stroke="#94a3b8" fontSize={8} domain={[60, 100]} />
                  <T />
                  <A type="monotone" dataKey="retentionRate" name="Retention (%)" stroke="#34d399" fill="#34d399" fillOpacity={0.05} strokeWidth={2} />
                </AC>
              </RC>
            </div>
          </div>
        </div>

        {/* Donut distribution */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-350">Segment Distribution</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Segment proportions representing total client database</p>
          </div>
          <div className="h-44 w-full flex items-center justify-center mt-4">
            <RC width="100%" height="100%">
              <PC>
                <P
                  data={segmentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {segmentPieData.map((entry, index) => (
                    <C key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </P>
                <T />
                <Leg verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px' }} />
              </PC>
            </RC>
          </div>
        </div>

      </section>

      {/* Row 2: Top 10 Customers Leaderboard */}
      <section className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl">
        <div>
          <h3 className="font-bold text-sm text-slate-350 flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-yellow-500 animate-pulse" /> Top 10 Customers Leaderboard
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Top high-value contributors ranked by total monetary purchase amount</p>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 text-center w-12">Rank</th>
                <th className="py-3">Customer Name</th>
                <th className="py-3">Customer ID</th>
                <th className="py-3">Monetary Spend</th>
                <th className="py-3">Recency</th>
                <th className="py-3">Frequency</th>
                <th className="py-3 text-right">Segment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-350">
              {top10Customers.map((c, idx) => (
                <tr key={c.customer_id || idx} className="hover:bg-slate-900/30">
                  <td className="py-4 font-bold text-center text-sm w-12 text-slate-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="py-4 font-bold text-slate-100 text-xs">
                    {c.customer_name || `Customer ${c.customer_id}`}
                  </td>
                  <td className="py-4 font-mono text-slate-450 text-[10px]">
                    <span className="bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800/50">
                      {c.customer_id}
                    </span>
                  </td>
                  <td className="py-4 font-extrabold text-teal-400 text-xs">
                    ${(c.rfm_monetary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-slate-300">
                    {c.rfm_recency} days ago
                  </td>
                  <td className="py-4 font-semibold text-slate-300">
                    {c.rfm_frequency} orders
                  </td>
                  <td className="py-4 text-right">
                    <span className={`px-2 py-1 rounded text-[8px] font-extrabold uppercase tracking-wide border ${
                      c.segment_name === 'Champions' 
                        ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                        : c.segment_name === 'At Risk' 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {c.segment_name}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Row 2: Cluster Scatter Plot & Customer Matrix Table */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Cluster Scatter Plot */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-350">K-Means Customer Clusters (Recency vs Monetary)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Visualizing customer groups scattered across recency days and dollar spend levels</p>
          </div>
          <div className="h-64 w-full mt-4">
            <RC width="100%" height="100%">
              <SC margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CG strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <X type="number" dataKey="x" name="Recency (days ago)" stroke="#94a3b8" fontSize={9} />
                <Y type="number" dataKey="y" name="Monetary Spend ($)" stroke="#94a3b8" fontSize={9} />
                <Z type="number" dataKey="z" range={[40, 400]} name="Frequency" />
                <T cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, name: any, props: any) => [v, name]} />
                <Leg wrapperStyle={{ fontSize: '10px' }} />
                <S name="Cluster 0 (Champions)" data={cluster0Data} fill="#10b981" />
                <S name="Cluster 1 (At Risk)" data={cluster1Data} fill="#f43f5e" />
                <S name="Cluster 2 (Loyal)" data={cluster2Data} fill="#818cf8" />
                <S name="Cluster 3 (New/Pot)" data={cluster3Data} fill="#2dd4bf" />
              </SC>
            </RC>
          </div>
        </div>

        {/* Customer RFM Matrix table */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Customer RFM Scores</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Detailing customers scores in filtered segmentation list</p>
          </div>
          <div className="overflow-y-auto max-h-60 mt-4 pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-2">Name</th>
                  <th className="py-2">Recency</th>
                  <th className="py-2">Spend</th>
                  <th className="py-2 text-right">Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-350">
                {filteredCustomers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/30">
                    <td className="py-3 font-semibold text-slate-200 truncate max-w-[80px]">{s.customer_name}</td>
                    <td className="py-3">{s.rfm_recency}d ago</td>
                    <td className="py-3 font-bold text-teal-400">${s.rfm_monetary?.toFixed(0)}</td>
                    <td className="py-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        s.segment_name === 'Champions' 
                          ? 'bg-emerald-500/10 text-emerald-550' 
                          : s.segment_name === 'At Risk' 
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {s.segment_name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

    </div>
  );
}
