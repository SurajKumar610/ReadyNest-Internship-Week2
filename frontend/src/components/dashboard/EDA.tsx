'use client';

import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { ShieldCheck, Info, HelpCircle } from 'lucide-react';

interface EDAProps {
  dataset: any;
  product: any;
  eda?: any;
}

export default function EDA({ dataset, product, eda }: EDAProps) {
  // Quality audit numbers
  const auditLogs = dataset?.cleaning_summary || {
    initial_rows: 1200,
    duplicates_removed: 0,
    missing_values_filled: {
      "Customer Name": 0,
      "Profit": 0
    },
    outliers_detected: 14,
    records_processed: 1200
  };

  const missingValuesCount = (Object.values(auditLogs.missing_values_filled || {}) as any[]).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number;
  const dataQualityScore = Math.max(70, 100 - (missingValuesCount > 0 ? 5 : 0) - (auditLogs.outliers_detected > 0 ? 6 : 0));

  // Missing values details
  const missingData = [
    { column: 'Customer ID', missing: 0 },
    { column: 'Customer Name', missing: auditLogs.missing_values_filled?.customer_name || 0 },
    { column: 'Product Name', missing: 0 },
    { column: 'Sales Amount', missing: 0 },
    { column: 'Profit', missing: auditLogs.missing_values_filled?.profit || 0 },
    { column: 'Quantity', missing: 0 },
    { column: 'Order Date', missing: 0 }
  ];

  // Correlation Matrix dataset
  const correlationMatrix = eda?.correlation_matrix || [
    { row: 'Sales Amount', col: 'Sales Amount', val: 1.00 },
    { row: 'Sales Amount', col: 'Profit', val: 0.85 },
    { row: 'Sales Amount', col: 'Quantity', val: 0.62 },
    { row: 'Profit', col: 'Sales Amount', val: 0.85 },
    { row: 'Profit', col: 'Profit', val: 1.00 },
    { row: 'Profit', col: 'Quantity', val: 0.51 },
    { row: 'Quantity', col: 'Sales Amount', val: 0.62 },
    { row: 'Quantity', col: 'Profit', val: 0.51 },
    { row: 'Quantity', col: 'Quantity', val: 1.00 }
  ];

  // Feature distributions histograms
  const salesDistribution = eda?.sales_distribution || [
    { bin: '$0-50', count: 420 },
    { bin: '$50-100', count: 310 },
    { bin: '$100-250', count: 280 },
    { bin: '$250-500', count: 120 },
    { bin: '$500-1000', count: 50 },
    { bin: '$1000+', count: 20 }
  ];

  const qtyDistribution = eda?.qty_distribution || [
    { bin: '1 unit', count: 750 },
    { bin: '2 units', count: 320 },
    { bin: '3 units', count: 85 },
    { bin: '4 units', count: 30 },
    { bin: '5+ units', count: 15 }
  ];

  // Category breakdown donut chart data
  const categoryBreakdown = product?.by_category?.map((c: any) => ({
    name: c.category || c.product_category || 'Unknown Category',
    value: c.revenue || 0
  })) || [
    { name: 'Electronics', value: 72500 },
    { name: 'Clothing', value: 32100 },
    { name: 'Home & Kitchen', value: 21450 },
    { name: 'Sports', value: 12200 },
    { name: 'Beauty', value: 7000 }
  ];

  const COLORS = ['#818cf8', '#60a5fa', '#34d399', '#f43f5e', '#fbbf24', '#a78bfa'];

  // Box plot statistical details (outlier detection boundaries)
  const boxPlotStats = eda?.box_plot_stats || [
    { metric: 'Sales Amount', min: 1.50, q1: 45.00, median: 120.00, q3: 350.00, max: 850.00, outliers: auditLogs.outliers_detected || 14 },
    { metric: 'Profit', min: -50.00, q1: 15.00, median: 40.00, q3: 110.00, max: 280.00, outliers: 8 },
    { metric: 'Quantity', min: 1, q1: 1, median: 1, q3: 2, max: 5, outliers: 2 }
  ];

  const getCorrVal = (r: string, c: string) => {
    const found = correlationMatrix.find((x: any) => x.row === r && x.col === c);
    return found ? found.val : (r === c ? 1.0 : 0.0);
  };


  const getCorrelationColor = (val: number) => {
    if (val === 1.0) return 'bg-[#10b981]/80 text-white';
    if (val > 0.8) return 'bg-indigo-500/80 text-white border-indigo-500/30';
    if (val > 0.6) return 'bg-indigo-500/50 text-slate-100 border-indigo-500/20';
    return 'bg-indigo-500/20 text-slate-300 border-indigo-500/10';
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Row 1: Profile & Missing values */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quality Audit Profile Card */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-450" /> Quality Audit Profile
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Automated validation score calculated upon dataset loading</p>
          </div>
          <div className="text-center py-6">
            <h1 className="text-6xl font-extrabold text-emerald-400">{dataQualityScore}%</h1>
            <p className="text-[10px] text-slate-400 mt-2 font-semibold">Data Quality Health Index</p>
          </div>
          <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
            <div className="flex justify-between text-slate-400">
              <span>Duplicates Removed:</span>
              <span className="font-bold text-emerald-400">{auditLogs.duplicates_removed} rows</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Missing Values Filled:</span>
              <span className="font-bold text-emerald-400">{missingValuesCount} columns</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Outliers Flagged (&gt;3 Z-score):</span>
              <span className="font-bold text-yellow-500">{auditLogs.outliers_detected} values</span>
            </div>
          </div>
        </div>

        {/* Missing Value Analysis Chart */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Missing Values Audit (By Column)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Count of empty cells detected and auto-imputed during clean step</p>
          </div>
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="column" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="missing" name="Missing Cells" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Row 2: Correlation Matrix & Category breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Correlation Heatmap Grid */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Pearson Correlation Matrix Heatmap</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Correlation coefficient matrix between key numeric features</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="text-center font-bold text-[9px] text-slate-500 py-1">Feature</div>
            <div className="text-center font-bold text-[9px] text-slate-500 py-1">Sales</div>
            <div className="text-center font-bold text-[9px] text-slate-500 py-1">Profit</div>
            
            <div className="font-bold text-[10px] text-slate-400 py-2 flex items-center">Sales Amount</div>
            <div className={`p-2 rounded text-center border text-xs font-bold ${getCorrelationColor(getCorrVal('Sales Amount', 'Sales Amount'))}`}>{getCorrVal('Sales Amount', 'Sales Amount').toFixed(2)}</div>
            <div className={`p-2 rounded text-center border text-xs font-bold ${getCorrelationColor(getCorrVal('Sales Amount', 'Profit'))}`}>{getCorrVal('Sales Amount', 'Profit').toFixed(2)}</div>
            
            <div className="font-bold text-[10px] text-slate-400 py-2 flex items-center">Profit</div>
            <div className={`p-2 rounded text-center border text-xs font-bold ${getCorrelationColor(getCorrVal('Profit', 'Sales Amount'))}`}>{getCorrVal('Profit', 'Sales Amount').toFixed(2)}</div>
            <div className={`p-2 rounded text-center border text-xs font-bold ${getCorrelationColor(getCorrVal('Profit', 'Profit'))}`}>{getCorrVal('Profit', 'Profit').toFixed(2)}</div>
            
            <div className="font-bold text-[10px] text-slate-400 py-2 flex items-center">Quantity</div>
            <div className={`p-2 rounded text-center border text-xs font-bold ${getCorrelationColor(getCorrVal('Quantity', 'Sales Amount'))}`}>{getCorrVal('Quantity', 'Sales Amount').toFixed(2)}</div>
            <div className={`p-2 rounded text-center border text-xs font-bold ${getCorrelationColor(getCorrVal('Quantity', 'Profit'))}`}>{getCorrVal('Quantity', 'Profit').toFixed(2)}</div>
          </div>
        </div>

        {/* Category breakdown pie/donut chart */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Category Sales Distribution</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Share percentage of sales volume contributed by product category</p>
          </div>
          <div className="h-56 w-full flex items-center mt-4">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="w-1/2 space-y-2 text-xs pl-4">
              {categoryBreakdown.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-450 truncate flex-1">{entry.name}</span>
                  <span className="font-bold text-white">${Number(entry.value).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Row 3: Feature Distribution Histograms & Box Plots */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Histograms for Sales Distributions */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Feature Distribution Histograms</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Quantity transaction counts and sales range distributions side-by-side</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="h-44 w-full">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center">Sales Amount Frequency</span>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesDistribution}>
                  <XAxis dataKey="bin" stroke="#94a3b8" fontSize={8} />
                  <YAxis stroke="#94a3b8" fontSize={8} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#818cf8" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-44 w-full">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center">Quantity Order Frequency</span>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qtyDistribution}>
                  <XAxis dataKey="bin" stroke="#94a3b8" fontSize={8} />
                  <YAxis stroke="#94a3b8" fontSize={8} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#34d399" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Box Plot stats */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Outlier Detection & Box-Plot Statistics</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Automatic quartile values, medians, and outliers counts flagged</p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-2">Metric</th>
                  <th className="py-2">Min</th>
                  <th className="py-2">Median</th>
                  <th className="py-2">Q3</th>
                  <th className="py-2">Max</th>
                  <th className="py-2 text-right">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-350">
                {boxPlotStats.map((b: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-900/30">
                    <td className="py-3 font-semibold text-slate-200">{b.metric}</td>
                    <td className="py-3">${b.min.toFixed(0)}</td>
                    <td className="py-3">${b.median.toFixed(0)}</td>
                    <td className="py-3">${b.q3.toFixed(0)}</td>
                    <td className="py-3">${b.max.toFixed(0)}</td>
                    <td className="py-3 text-right font-bold text-yellow-500">{b.outliers} detected</td>
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
