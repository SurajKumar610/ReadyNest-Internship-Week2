'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Database, FileText, Globe } from 'lucide-react';

export default function SharedDashboard() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchSharedData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/public/shared/${token}`);
        if (!response.ok) {
          throw new Error('Link has expired or is invalid.');
        }
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <p className="text-sm font-semibold">Loading Shared Dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Shared Link Inactive</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error || 'Unable to access shared dashboard data.'}</p>
      </div>
    );
  }

  const { charts, summary } = data;
  const kpis = charts.kpis || {};
  const product = charts.product || {};
  const forecast = summary.sales_forecasting_6_months || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 glass-panel border-b rounded-none px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-500" />
          <span className="font-bold text-lg text-slate-900 dark:text-white">Sightfill Public Report View</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
          Read-Only Access
        </span>
      </nav>

      {/* Main Cockpit */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        <div className="glass-panel p-6 border-indigo-500/20 bg-indigo-500/5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Executive Briefing</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Summary reports compiled on {new Date(data.created_at).toLocaleDateString()}</p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div>• Key Category: <span className="font-bold text-indigo-500">{summary.top_category}</span></div>
            <div>• Top Product: <span className="font-bold text-blue-500">{summary.top_product}</span></div>
            <div>• Leading Region: <span className="font-bold text-emerald-500">{summary.best_country}</span></div>
            <div>• Top Customer Segment: <span className="font-bold text-pink-500">{summary.top_segment}</span></div>
          </div>
        </div>

        {/* KPIs Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Revenue</p>
            <h3 className="text-xl font-extrabold text-indigo-600 mt-1">${kpis.total_revenue?.toLocaleString()}</h3>
          </div>
          <div className="glass-panel p-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Profit</p>
            <h3 className="text-xl font-extrabold text-blue-600 mt-1">${kpis.total_profit?.toLocaleString()}</h3>
          </div>
          <div className="glass-panel p-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Orders</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{kpis.total_orders?.toLocaleString()}</h3>
          </div>
          <div className="glass-panel p-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Retention</p>
            <h3 className="text-xl font-extrabold text-pink-600 mt-1">{kpis.retention_rate}%</h3>
          </div>
        </section>

        {/* Charts Split */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Forecast */}
          <div className="glass-panel p-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Projections Forecast</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Sales ($)" stroke="#6366f1" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Products Categories */}
          <div className="glass-panel p-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Category Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={product.by_category || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
