'use client';

import React, { useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { MapPin, Globe, Trophy } from 'lucide-react';

interface RegionalPerformanceProps {
  regional: any;
  kpis: any;
}

export default function RegionalPerformance({ regional, kpis }: RegionalPerformanceProps) {
  // Safe fallbacks for regional data
  const byRegion = regional?.by_region || [
    { region: 'North America', revenue: 105250.00, profit: 35110.00 },
    { region: 'Europe', revenue: 40000.00, profit: 13100.00 },
    { region: 'Asia-Pacific', revenue: 15200.00, profit: 4800.00 }
  ];

  const byCountry = regional?.by_country || [
    { country: 'United States', revenue: 85250.00, profit: 28110.00, customers: 92 },
    { country: 'United Kingdom', revenue: 22000.00, profit: 7200.00, customers: 28 },
    { country: 'Canada', revenue: 20000.00, profit: 7000.00, customers: 20 },
    { country: 'Germany', revenue: 10000.00, profit: 3400.00, customers: 12 },
    { country: 'France', revenue: 8000.00, profit: 2500.00, customers: 8 }
  ];

  const byRegionSorted = [...byRegion].sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0));
  const totalRevenue = byRegionSorted.reduce((acc: number, r: any) => acc + (r.revenue || 0), 0) || 1;

  const highestMarginRegion = byRegionSorted
    .map((r: any) => ({
      region: r.region,
      margin: (r.revenue || 0) > 0 ? ((r.profit || 0) / r.revenue) * 100 : 0
    }))
    .sort((a: any, b: any) => b.margin - a.margin)[0];

  // Dynamic Leaflet Map setup (avoids SSR window crashes)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically load Leaflet package and stylesheet on browser-load only
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([L]) => {
      const mapContainer = document.getElementById('regional-leaflet-map');
      if (!mapContainer || (mapContainer as any)._leaflet_id) return;

      // Initialize map centered at US coordinates
      const map = L.map('regional-leaflet-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([37.0902, -95.7129], 3);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      // Add zoom control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Coordinates lookup for common countries
      const countryCoords: Record<string, { lat: number, lng: number }> = {
        'united states': { lat: 37.0902, lng: -95.7129 },
        'united kingdom': { lat: 55.3781, lng: -3.4360 },
        'canada': { lat: 56.1304, lng: -106.3468 },
        'germany': { lat: 51.1657, lng: 10.4515 },
        'france': { lat: 46.2276, lng: 2.2137 },
        'australia': { lat: -25.2744, lng: 133.7751 },
        'india': { lat: 20.5937, lng: 78.9629 },
        'brazil': { lat: -14.2350, lng: -51.9253 },
        'japan': { lat: 36.2048, lng: 138.2529 },
        'china': { lat: 35.8617, lng: 104.1954 },
        'russia': { lat: 61.5240, lng: 105.3188 },
        'italy': { lat: 41.8719, lng: 12.5674 },
        'spain': { lat: 40.4637, lng: -3.7492 },
        'sweden': { lat: 60.1282, lng: 18.6435 },
        'finland': { lat: 61.9241, lng: 25.7482 },
        'portugal': { lat: 39.3999, lng: -8.2245 }
      };

      // Plot markers representing key countries dynamically
      const dataToPlot = byCountry;

      dataToPlot.forEach((item: any) => {
        const countryKey = String(item.country || '').toLowerCase().trim();
        const coords = countryCoords[countryKey];
        if (coords) {
          // Calculate proportional radius
          const radius = Math.max(8, Math.sqrt(item.revenue || 0) * 0.12);
          
          const marker = L.circleMarker([coords.lat, coords.lng], {
            radius: radius,
            fillColor: '#818cf8',
            color: '#6366f1',
            weight: 1.5,
            opacity: 0.8,
            fillOpacity: 0.4
          }).addTo(map);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; padding: 4px; color: #1e293b;">
              <b style="font-size: 12px; color: #4f46e5;">${item.country}</b><br/>
              <span style="display: block; margin-top: 4px;">Sales: <b>$${Number(item.revenue || 0).toLocaleString()}</b></span>
            </div>
          `);
        }
      });
    }).catch(err => console.error("Failed to load Leaflet Map: ", err));
  }, [regional]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Row 1: Interactive Leaflet Map */}
      <section className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-350 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" /> Geographic Sales Density (Leaflet Interactive Map)
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Explore transactional volumes mapped across global coordinates (zoom/pan support)</p>
          </div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Live OSM Layer
          </span>
        </div>

        {/* Map Container */}
        <div 
          id="regional-leaflet-map" 
          className="h-80 w-full rounded-xl border border-slate-800 bg-[#070b13] relative z-0"
        />
      </section>

      {/* Row 2: Region Comparison Grouped Bars & Leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Region Comparison Bar */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Revenue & Profit Comparison by Region</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Grouped metrics showing sales efficiency across continental territories</p>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="region" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State/Country Leaderboard */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-yellow-500" /> Country Sales Leaderboard
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Rankings based on total revenue and customer footprint sizes</p>
          </div>
          <div className="overflow-y-auto max-h-60 mt-4 pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-2">Rank</th>
                  <th className="py-2">Country</th>
                  <th className="py-2">Sales</th>
                  <th className="py-2 text-right">Clients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-350">
                {byCountry.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/30">
                    <td className="py-3 font-bold text-slate-500 text-center w-8">#{idx+1}</td>
                    <td className="py-3 font-semibold text-slate-200">{c.country}</td>
                    <td className="py-3 font-bold text-teal-400">${c.revenue?.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-450">{c.customers || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* Row 3: Regional Sales Leaderboard & Additional Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regional Leaderboard (takes 2 columns for details) */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-yellow-500" /> Regional Sales Performance Leaderboard
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Rankings of geographic regions with revenue, net profit, margins, and contribution bars</p>
          </div>
          <div className="overflow-y-auto max-h-60 mt-4 pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-2 text-center w-8">Rank</th>
                  <th className="py-2">Region</th>
                  <th className="py-2">Sales Revenue</th>
                  <th className="py-2">Profit Margin</th>
                  <th className="py-2 text-right">Market Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-350">
                {byRegionSorted.map((r: any, idx: number) => {
                  const contribution = ((r.revenue || 0) / totalRevenue) * 100;
                  const margin = (r.revenue || 0) > 0 ? ((r.profit || 0) / r.revenue) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-3.5 font-bold text-slate-500 text-center w-8">#{idx + 1}</td>
                      <td className="py-3.5 font-semibold text-slate-200">{r.region}</td>
                      <td className="py-3.5 font-bold text-teal-400">${r.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3.5 font-semibold text-slate-300">
                        ${r.profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[9px] text-slate-500 ml-1.5">({margin.toFixed(1)}% margin)</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-indigo-400">
                        <div className="flex items-center justify-end gap-2">
                          <span>{contribution.toFixed(1)}%</span>
                          <div className="w-16 bg-slate-850 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div className="bg-indigo-500 h-full" style={{ width: `${contribution}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Region Quick Stats Card (takes 1 column) */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Territorial Performance Summary</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Quick analytics on sales distribution effectiveness</p>
          </div>
          <div className="space-y-4 mt-6">
            <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Top Performing Region</span>
              <span className="text-sm font-extrabold text-teal-400 mt-1 block">{byRegionSorted[0]?.region || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Highest Margin Region</span>
              <span className="text-sm font-extrabold text-indigo-400 mt-1 block">
                {highestMarginRegion?.region || 'N/A'} 
                <span className="text-xs text-slate-500 font-semibold ml-1">({highestMarginRegion?.margin.toFixed(1)}%)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
