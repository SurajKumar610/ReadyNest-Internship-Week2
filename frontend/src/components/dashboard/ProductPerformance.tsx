'use client';

import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ComposedChart,
  CartesianGrid, Tooltip, Legend, Line, PieChart, Pie, Cell 
} from 'recharts';
import { ShoppingBag, ArrowUpRight, TrendingUp } from 'lucide-react';

interface ProductPerformanceProps {
  product: any;
}

export default function ProductPerformance({ product }: ProductPerformanceProps) {
  // Safe fallbacks for product metrics
  const categoriesData = product?.by_category || [
    { category: 'Electronics', revenue: 72500.0, profit: 22100.0, sales: 400 },
    { category: 'Clothing', revenue: 32100.0, profit: 11500.0, sales: 320 },
    { category: 'Home & Kitchen', revenue: 21450.0, profit: 7210.0, sales: 230 },
    { category: 'Sports', revenue: 12200.0, profit: 4800.0, sales: 150 },
    { category: 'Beauty', revenue: 7000.0, profit: 2600.0, sales: 100 }
  ];

  const topProductsRaw = product?.top_products || [
    { name: 'Laptop', revenue: 38961.0, profit: 11688.0 },
    { name: 'Smartphone', revenue: 25863.0, profit: 7758.0 },
    { name: 'Jacket', revenue: 14400.0, profit: 4800.0 },
    { name: 'Air Fryer', revenue: 11900.0, profit: 3570.0 },
    { name: 'Smartwatch', revenue: 9950.0, profit: 3250.0 }
  ];

  // Standardize the objects so they always contain uniform keys
  const categories = categoriesData.map((c: any) => ({
    name: c.category || c.product_category || 'Unknown Category',
    revenue: c.revenue || 0,
    profit: c.profit || 0,
    sales: c.sales || 0
  }));

  const topProducts = topProductsRaw.map((p: any) => ({
    name: p.name || p.product_name || 'Unknown Product',
    revenue: p.revenue || 0,
    profit: p.profit || 0
  }));

  // Stacked profitability data (Revenue vs Profit stacked)
  const stackedProfitabilityData = categories.map((c: any) => ({
    name: c.name,
    cost: Math.max(0, c.revenue - c.profit),
    profit: c.profit
  }));

  // Pareto Chart (80/20 analysis) data calculations
  const totalRevenue = topProducts.reduce((sum: number, p: any) => sum + p.revenue, 0);
  let runSum = 0;
  const paretoData = topProducts.map((p: any) => {
    runSum += p.revenue;
    return {
      name: p.name,
      revenue: p.revenue,
      cumulativePercent: Math.round((runSum / totalRevenue) * 100)
    };
  });

  // Product trend lines (monthly product categories trends)
  const productTrendData = product?.category_trends || [
    { month: 'Jul', Electronics: 8500, Clothing: 4200, Home: 2100 },
    { month: 'Aug', Electronics: 9800, Clothing: 4500, Home: 2300 },
    { month: 'Sep', Electronics: 12100, Clothing: 5100, Home: 3400 },
    { month: 'Oct', Electronics: 11000, Clothing: 4900, Home: 2900 },
    { month: 'Nov', Electronics: 14500, Clothing: 6200, Home: 4800 },
    { month: 'Dec', Electronics: 16600, Clothing: 7200, Home: 5900 }
  ];

  const trackedCategories = product?.tracked_categories || ['Electronics', 'Clothing', 'Home'];

  const COLORS = ['#818cf8', '#60a5fa', '#34d399', '#f43f5e', '#fbbf24', '#a78bfa'];

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Row 1: Top Products Horizontal & Profitability Stacked */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Products (Horizontal Bar Chart) */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Top Revenue-Generating Products</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Top-selling items ranked by absolute sales volumes</p>
          </div>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="revenue" name="Sales ($)" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Product Profitability */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Product Profitability Stacked Bars</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Stacked representation of cost versus net operating profit per category</p>
          </div>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedProfitabilityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="cost" name="Direct Cost ($)" stackId="a" fill="#3b82f6" opacity={0.6} />
                <Bar dataKey="profit" name="Net Profit ($)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Row 2: CSS Treemap Grid & Pareto Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Treemap via CSS Grid */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Category Share Treemap</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Proportional grid layout representation of sales share by department</p>
          </div>
          <div className="grid grid-cols-6 gap-3.5 h-64 mt-4 text-xs font-semibold">
            {categories.slice(0, 4).map((c: any, idx: number) => {
              const gridClasses = [
                "col-span-3 row-span-2 bg-[#818cf8]/15 border border-[#818cf8]/35 hover:bg-[#818cf8]/20 text-indigo-300",
                "col-span-3 row-span-1 bg-[#60a5fa]/15 border border-[#60a5fa]/35 hover:bg-[#60a5fa]/20 text-blue-300",
                "col-span-2 row-span-1 bg-[#34d399]/15 border border-[#34d399]/35 hover:bg-[#34d399]/20 text-emerald-300",
                "col-span-1 row-span-1 bg-[#f43f5e]/15 border border-[#f43f5e]/35 hover:bg-[#f43f5e]/20 text-red-300"
              ];
              const cls = gridClasses[idx] || gridClasses[3];
              return (
                <div key={idx} className={`${cls} p-4 rounded-xl flex flex-col justify-between transition-all cursor-pointer`}>
                  <span className="font-bold block truncate">{c.name}</span>
                  <span className="text-lg font-extrabold text-white">${(c.revenue / 1000).toFixed(1)}k</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pareto 80/20 Chart */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Pareto 80/20 Revenue Drivers Curve</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Visualizing cumulative revenue percentages generated by top performing products</p>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={9} name="Revenue ($)" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={9} name="Percentage (%)" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Product Revenue ($)" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumulative Percent (%)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Row 3: Product Trends */}
      <section className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-350 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-indigo-400" /> Category Performance Trends (Last 6 Months)
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold font-sans">Monthly granularity</span>
        </div>
        <div className="h-72 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={productTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {trackedCategories.map((cat: string, index: number) => (
                <Line 
                  key={cat} 
                  type="monotone" 
                  dataKey={cat} 
                  name={`${cat} ($)`} 
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}
