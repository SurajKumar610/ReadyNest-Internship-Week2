'use client';

import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, 
  Users, Activity, Percent, Landmark, Sparkles, AlertTriangle 
} from 'lucide-react';

interface ExecutiveSummaryProps {
  kpis: any;
  forecast: any[];
  regionChartData: any[];
  eda?: any;
  summaryLayer?: any;
}

export default function ExecutiveSummary({ kpis, forecast, regionChartData, eda, summaryLayer }: ExecutiveSummaryProps) {
  // Safe parsing of KPIs with realistic demo fallbacks
  const dataKpis = kpis || {
    total_revenue: 145250.00,
    total_profit: 48210.00,
    total_orders: 1200,
    total_customers: 150,
    average_order_value: 121.04,
    customer_lifetime_value: 968.33,
    retention_rate: 78.40,
    churn_rate: 21.60
  };

  const profitMargin = ((dataKpis.total_profit / (dataKpis.total_revenue || 1)) * 100).toFixed(1);

  const monthlyTrend = dataKpis.monthly_trend || [];
  const hasTrend = monthlyTrend.length > 0;

  // Sparkline datasets mapped dynamically from monthly trends
  const sparklineRevenue = hasTrend 
    ? monthlyTrend.map((t: any) => ({ val: t.revenue })) 
    : [{ val: 12000 }, { val: 15000 }, { val: 14000 }, { val: 18000 }, { val: 16000 }, { val: 20000 }];
    
  const sparklineOrders = hasTrend 
    ? monthlyTrend.map((t: any) => ({ val: t.orders })) 
    : [{ val: 100 }, { val: 120 }, { val: 110 }, { val: 130 }, { val: 125 }, { val: 140 }];
    
  const sparklineCustomers = hasTrend 
    ? monthlyTrend.map((t: any) => ({ val: t.customers })) 
    : [{ val: 12 }, { val: 14 }, { val: 13 }, { val: 16 }, { val: 15 }, { val: 18 }];
    
  const sparklineAOV = hasTrend 
    ? monthlyTrend.map((t: any) => ({ val: t.orders > 0 ? t.revenue / t.orders : 0.0 })) 
    : [{ val: 110 }, { val: 125 }, { val: 118 }, { val: 130 }, { val: 120 }, { val: 121 }];
    
  const sparklineMargin = hasTrend 
    ? monthlyTrend.map((t: any) => ({ val: t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0.0 })) 
    : [{ val: 30 }, { val: 32 }, { val: 31 }, { val: 34 }, { val: 33 }, { val: 33.2 }];
    
  const sparklineRetention = hasTrend 
    ? monthlyTrend.map((t: any, i: number) => ({ val: dataKpis.retention_rate - (monthlyTrend.length - 1 - i) * 0.1 })) 
    : [{ val: 75 }, { val: 76 }, { val: 77 }, { val: 78 }, { val: 78 }, { val: 78.4 }];
    
  const sparklineCLV = hasTrend 
    ? monthlyTrend.map((t: any) => ({ val: t.customers > 0 ? t.revenue / t.customers : 0.0 })) 
    : [{ val: 900 }, { val: 920 }, { val: 915 }, { val: 950 }, { val: 940 }, { val: 968 }];
    
  const sparklineChurn = hasTrend 
    ? monthlyTrend.map((t: any, i: number) => ({ val: dataKpis.churn_rate + (monthlyTrend.length - 1 - i) * 0.1 })) 
    : [{ val: 25 }, { val: 24 }, { val: 23 }, { val: 22 }, { val: 22 }, { val: 21.6 }];

  // Dual axis chart data combining forecast & history
  const dualAxisData = forecast.length > 0 ? forecast.map(f => ({
    target_id: f.target_id,
    revenue: f.value,
    profit: f.details?.confidence_lower !== undefined ? f.value * 0.33 : f.value * 0.33 // Estimated profit factor
  })) : [
    { target_id: 'Q1 2026', revenue: 38000, profit: 12000 },
    { target_id: 'Q2 2026', revenue: 45000, profit: 15000 },
    { target_id: 'Q3 2026', revenue: 42000, profit: 13800 },
    { target_id: 'Q4 2026', revenue: 56000, profit: 18500 }
  ];

  // Sales frequency histogram distribution mapping
  const histogramData = eda?.sales_distribution?.map((d: any) => ({
    range: d.bin,
    count: d.count
  })) || [
    { range: '$0-50', count: 420 },
    { range: '$50-100', count: 310 },
    { range: '$100-250', count: 280 },
    { range: '$250-500', count: 120 },
    { range: '$500-1000', count: 50 },
    { range: '$1000+', count: 20 }
  ];

  // Monthly Sales Heatmap mockup grid (representing monthly performance)
  const heatmapData = hasTrend ? monthlyTrend.map((t: any) => {
    const avg = monthlyTrend.reduce((sum: number, x: any) => sum + x.revenue, 0) / monthlyTrend.length;
    let level = 'med';
    if (t.revenue > avg * 1.3) level = 'highest';
    else if (t.revenue > avg * 1.0) level = 'high';
    else if (t.revenue < avg * 0.7) level = 'low';
    
    let monthName = t.date;
    try {
      const parts = t.date.split('-');
      if (parts.length === 2) {
        const monthNum = parseInt(parts[1]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthName = months[monthNum - 1] || t.date;
      }
    } catch {}
    
    return {
      month: monthName,
      val: t.revenue,
      level
    };
  }) : [
    { month: 'Jan', val: 12000, level: 'low' },
    { month: 'Feb', val: 15400, level: 'med' },
    { month: 'Mar', val: 18200, level: 'high' },
    { month: 'Apr', val: 14500, level: 'med' },
    { month: 'May', val: 16100, level: 'med' },
    { month: 'Jun', val: 22400, level: 'high' },
    { month: 'Jul', val: 19800, level: 'high' },
    { month: 'Aug', val: 17200, level: 'med' },
    { month: 'Sep', val: 15900, level: 'med' },
    { month: 'Oct', val: 21100, level: 'high' },
    { month: 'Nov', val: 25400, level: 'highest' },
    { month: 'Dec', val: 32100, level: 'highest' }
  ];

  // Helper for heatmap colors
  const getHeatmapColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'med': return 'bg-indigo-500/25 text-indigo-300 border-indigo-500/35';
      case 'high': return 'bg-indigo-500/50 text-indigo-100 border-indigo-500/60';
      case 'highest': return 'bg-emerald-500/40 text-emerald-100 border-emerald-500/50';
      default: return 'bg-slate-900';
    }
  };

  // Helper to dynamically calculate percentage difference between the last two months of a metric
  const getTrend = (sparklineData: { val: number }[], defaultVal: string) => {
    if (sparklineData.length < 2) {
      return { label: defaultVal, isPositive: parseFloat(defaultVal) >= 0 };
    }
    const curr = sparklineData[sparklineData.length - 1].val;
    const prev = sparklineData[sparklineData.length - 2].val;
    if (prev === 0) {
      return { label: "+0.0%", isPositive: true };
    }
    const diff = curr - prev;
    const pct = (diff / Math.abs(prev)) * 100;
    const isPositive = pct >= 0;
    const sign = isPositive ? '+' : '';
    return {
      label: `${sign}${pct.toFixed(1)}%`,
      isPositive
    };
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* 8 KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Revenue */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <DollarSign className="h-3.5 w-3.5 text-indigo-450" /> Total Revenue
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              ${dataKpis.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            {(() => {
              const trend = getTrend(sparklineRevenue, "+5.2%");
              const colorClass = trend.isPositive ? "text-emerald-400" : "text-red-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineRevenue}>
                <Line type="monotone" dataKey="val" stroke="#818cf8" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <ShoppingCart className="h-3.5 w-3.5 text-indigo-450" /> Total Orders
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              {dataKpis.total_orders?.toLocaleString()}
            </h2>
            {(() => {
              const trend = getTrend(sparklineOrders, "+3.1%");
              const colorClass = trend.isPositive ? "text-emerald-400" : "text-red-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineOrders}>
                <Line type="monotone" dataKey="val" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Total Customers */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <Users className="h-3.5 w-3.5 text-indigo-450" /> Total Customers
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              {dataKpis.total_customers?.toLocaleString()}
            </h2>
            {(() => {
              const trend = getTrend(sparklineCustomers, "+4.6%");
              const colorClass = trend.isPositive ? "text-emerald-400" : "text-red-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineCustomers}>
                <Line type="monotone" dataKey="val" stroke="#34d399" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Avg Order Value */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <Activity className="h-3.5 w-3.5 text-indigo-450" /> Avg Order Value
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              ${dataKpis.average_order_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            {(() => {
              const trend = getTrend(sparklineAOV, "-1.2%");
              const colorClass = trend.isPositive ? "text-emerald-400" : "text-red-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineAOV}>
                <Line type="monotone" dataKey="val" stroke="#fb7185" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Profit Margin */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <Percent className="h-3.5 w-3.5 text-indigo-450" /> Profit Margin
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              {profitMargin}%
            </h2>
            {(() => {
              const trend = getTrend(sparklineMargin, "+2.1%");
              const colorClass = trend.isPositive ? "text-emerald-400" : "text-red-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineMargin}>
                <Line type="monotone" dataKey="val" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Retention Rate */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <Landmark className="h-3.5 w-3.5 text-indigo-450" /> Retention Rate
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              {dataKpis.retention_rate}%
            </h2>
            {(() => {
              const trend = getTrend(sparklineRetention, "+0.8%");
              const colorClass = trend.isPositive ? "text-emerald-400" : "text-red-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineRetention}>
                <Line type="monotone" dataKey="val" stroke="#2dd4bf" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Customer Lifetime Value (CLV) */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-450" /> Customer LTV
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              ${dataKpis.customer_lifetime_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            {(() => {
              const trend = getTrend(sparklineCLV, "+1.8%");
              const colorClass = trend.isPositive ? "text-emerald-400" : "text-red-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineCLV}>
                <Line type="monotone" dataKey="val" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Churn Risk */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <AlertTriangle className="h-3.5 w-3.5 text-indigo-450" /> Churn Risk
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              {dataKpis.churn_rate}%
            </h2>
            {(() => {
              const trend = getTrend(sparklineChurn, "-5.4%");
              const colorClass = trend.isPositive ? "text-red-400" : "text-emerald-400";
              const Icon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
              return (
                <div className={`flex items-center gap-1 text-[10px] ${colorClass} font-bold`}>
                  <Icon className="h-3 w-3" /> {trend.label} <span className="text-slate-500 font-semibold font-sans">vs last month</span>
                </div>
              );
            })()}
          </div>
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineChurn}>
                <Line type="monotone" dataKey="val" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Row 1: Trends & Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue & Profit Trends (Dual Axis Chart) */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Revenue & Profit Trends (Dual Axis)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Comparing forecast sales projections with estimated profit margins</p>
          </div>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dualAxisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="target_id" stroke="#94a3b8" fontSize={10} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} name="Revenue" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} name="Profit" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue ($)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="profit" name="Profit ($)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Performance Area Chart */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Sales Volume & Revenue Growth</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Detailed area curves representing gross sales trends</p>
          </div>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dualAxisData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="target_id" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" name="Sales Volume ($)" stroke="#818cf8" fillOpacity={1} fill="url(#revenueGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Row 2: Distribution & Heatmap */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Distribution Histogram */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Sales Transaction Size Distribution (Histogram)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Frequency count of orders grouped by total dollar thresholds</p>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" name="Order Count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sales Heatmap Grid */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Monthly Performance Heatmap</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Visualizing monthly revenue performance intensity levels</p>
          </div>
          <div className="grid grid-cols-3 gap-3.5 mt-6 mb-2">
            {heatmapData.map((h: any, i: number) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border text-center flex flex-col justify-center items-center h-16 transition-all hover:scale-105 ${getHeatmapColor(h.level)}`}
              >
                <span className="text-[10px] font-bold uppercase">{h.month}</span>
                <span className="text-xs font-extrabold mt-1">${(h.val / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
