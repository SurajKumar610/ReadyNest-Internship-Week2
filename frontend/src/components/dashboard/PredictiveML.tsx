'use client';

import React, { useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { BrainCircuit, Cpu, TrendingUp, Sparkles } from 'lucide-react';

interface PredictiveMLProps {
  predictions: any[];
  customerData?: any;
}

export default function PredictiveML({ predictions, customerData }: PredictiveMLProps) {
  const [activeForecastTab, setActiveForecastTab] = useState<'revenue' | 'profit' | 'demand'>('revenue');

  // Safe fallbacks for churn classification and time-series models
  const churnList = predictions.filter((p: any) => p.type === 'churn') || [];
  
  const churnRiskStats = {
    Low: 0,
    Medium: 0,
    High: 0
  };
  
  churnList.forEach((c: any) => {
    const level = c.details?.risk_level || 'Low';
    if (level in churnRiskStats) {
      churnRiskStats[level as keyof typeof churnRiskStats] += 1;
    }
  });

  // Default mock if list is empty
  const hasChurnData = churnList.length > 0;
  const churnDonutData = hasChurnData ? Object.entries(churnRiskStats).map(([name, value]) => ({
    name: `${name} Risk`,
    value
  })) : [
    { name: 'Low Risk', value: 120 },
    { name: 'Medium Risk', value: 18 },
    { name: 'High Risk', value: 12 }
  ];

  const churnHistogramData = [
    { range: '0-20%', count: hasChurnData ? churnList.filter(c => c.value <= 0.2).length : 95 },
    { range: '20-40%', count: hasChurnData ? churnList.filter(c => c.value > 0.2 && c.value <= 0.4).length : 25 },
    { range: '40-60%', count: hasChurnData ? churnList.filter(c => c.value > 0.4 && c.value <= 0.6).length : 18 },
    { range: '60-80%', count: hasChurnData ? churnList.filter(c => c.value > 0.6 && c.value <= 0.8).length : 8 },
    { range: '80-100%', count: hasChurnData ? churnList.filter(c => c.value > 0.8).length : 4 }
  ];

  // Feature Importance weights for RF Churn Classifier & Regressors
  const featureImportances = customerData?.feature_importances || [
    { feature: 'Recency (R-Score)', importance: 42 },
    { feature: 'Monetary Value (M-Score)', importance: 28 },
    { feature: 'Frequency (F-Score)', importance: 18 },
    { feature: 'Category (Electronics)', importance: 7 },
    { feature: 'Region (North America)', importance: 5 }
  ];

  // Forecasting forecasts
  const forecastList = predictions.filter((p: any) => p.type === 'sales_forecast') || [];
  const hasForecastData = forecastList.length > 0;

  const rawForecastData = hasForecastData ? forecastList.map((f: any) => ({
    date: f.target_id,
    revenue: f.value,
    revenueLower: f.details?.confidence_lower || f.value * 0.85,
    revenueUpper: f.details?.confidence_upper || f.value * 1.15,
    profit: f.value * 0.33,
    profitLower: (f.details?.confidence_lower || f.value * 0.85) * 0.3,
    profitUpper: (f.details?.confidence_upper || f.value * 1.15) * 0.35,
    demand: Math.round(f.value / 121), // Divided by AOV
    demandLower: Math.round((f.details?.confidence_lower || f.value * 0.85) / 121),
    demandUpper: Math.round((f.details?.confidence_upper || f.value * 1.15) / 121)
  })) : [
    { date: '2026-07-31', revenue: 18500, revenueLower: 16500, revenueUpper: 20500, profit: 6100, profitLower: 5400, profitUpper: 6800, demand: 152, demandLower: 136, demandUpper: 169 },
    { date: '2026-08-31', revenue: 19200, revenueLower: 16600, revenueUpper: 21800, profit: 6330, profitLower: 5470, profitUpper: 7190, demand: 158, demandLower: 137, demandUpper: 180 },
    { date: '2026-09-30', revenue: 17800, revenueLower: 14600, revenueUpper: 21000, profit: 5870, profitLower: 4815, profitUpper: 6930, demand: 147, demandLower: 120, demandUpper: 173 },
    { date: '2026-10-31', revenue: 20100, revenueLower: 16300, revenueUpper: 23900, profit: 6630, profitLower: 5380, profitUpper: 7890, demand: 166, demandLower: 134, demandUpper: 197 },
    { date: '2026-11-30', revenue: 24500, revenueLower: 20000, revenueUpper: 29000, profit: 8080, profitLower: 6600, profitUpper: 9570, demand: 202, demandLower: 165, demandUpper: 239 },
    { date: '2026-12-31', revenue: 29800, revenueLower: 24400, revenueUpper: 35200, profit: 9830, profitLower: 8050, profitUpper: 11620, demand: 246, demandLower: 201, demandUpper: 290 }
  ];

  const COLORS = ['#10b981', '#fbbf24', '#f43f5e'];

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Tab 1: Time Series Forecasts with confidence bounds */}
      <section className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-350 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" /> Machine Learning Time-Series Forecaster (6-Month Horizon)
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Average forecasts of Holt-Winters, ARIMA, and Random Forest models with confidence limits</p>
          </div>
          
          {/* Sub tabs */}
          <div className="flex bg-slate-950/40 p-1 rounded-lg border border-slate-850 shrink-0 text-xs">
            <button 
              onClick={() => setActiveForecastTab('revenue')}
              className={`px-3 py-1 rounded-md transition-colors ${activeForecastTab === 'revenue' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-450 hover:text-white'}`}
            >
              Revenue Forecast
            </button>
            <button 
              onClick={() => setActiveForecastTab('profit')}
              className={`px-3 py-1 rounded-md transition-colors ${activeForecastTab === 'profit' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-450 hover:text-white'}`}
            >
              Profit Forecast
            </button>
            <button 
              onClick={() => setActiveForecastTab('demand')}
              className={`px-3 py-1 rounded-md transition-colors ${activeForecastTab === 'demand' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-450 hover:text-white'}`}
            >
              Demand Forecast
            </button>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rawForecastData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
              <YAxis stroke="#94a3b8" fontSize={9} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              
              {/* Confidence interval area */}
              {activeForecastTab === 'revenue' && (
                <>
                  <Area type="monotone" dataKey="revenueUpper" name="Upper Limit" stroke="none" fill="#818cf8" fillOpacity={0.06} />
                  <Area type="monotone" dataKey="revenueLower" name="Lower Limit" stroke="none" fill="#818cf8" fillOpacity={0.06} />
                  <Line type="monotone" dataKey="revenue" name="Revenue Forecast ($)" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4 }} />
                </>
              )}

              {activeForecastTab === 'profit' && (
                <>
                  <Area type="monotone" dataKey="profitUpper" name="Upper Limit" stroke="none" fill="#10b981" fillOpacity={0.06} />
                  <Area type="monotone" dataKey="profitLower" name="Lower Limit" stroke="none" fill="#10b981" fillOpacity={0.06} />
                  <Line type="monotone" dataKey="profit" name="Profit Forecast ($)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                </>
              )}

              {activeForecastTab === 'demand' && (
                <>
                  <Area type="monotone" dataKey="demandUpper" name="Upper Limit" stroke="none" fill="#fbbf24" fillOpacity={0.06} />
                  <Area type="monotone" dataKey="demandLower" name="Lower Limit" stroke="none" fill="#fbbf24" fillOpacity={0.06} />
                  <Line type="monotone" dataKey="demand" name="Demand Forecast (Qty)" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 4 }} />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Row 2: Churn Distribution Donut & Churn Probability Histogram */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Churn Risk Distribution Donut */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-350">Churn Risk Distribution (Classifier)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Categorized customer count proportions by predicted risk levels</p>
          </div>
          <div className="h-44 w-full flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={churnDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {churnDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '9px' }} verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Risk Probability Histogram */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between lg:col-span-2">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Customer Churn Probability Histogram</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Distribution count representing client database likelihood to churn</p>
          </div>
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnHistogramData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" name="Customer Count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Row 3: Feature Importance Horizontal Bars */}
      <section className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-350 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-400" /> Machine Learning Model Feature Importance Weights
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Gini importance calculations highlighting key fields influencing the Random Forest models</p>
        </div>
        <div className="h-56 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureImportances}
              layout="vertical"
              margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" opacity={0.3} />
              <XAxis type="number" stroke="#94a3b8" fontSize={9} />
              <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={9} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="importance" name="Importance Score (%)" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}
