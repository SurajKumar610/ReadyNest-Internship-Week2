'use client';

import React from 'react';
import { 
  AlertTriangle, Sparkles, TrendingUp, Compass, 
  CheckCircle, ArrowUpRight, ShieldAlert, BadgeAlert 
} from 'lucide-react';

interface Rec {
  id: number;
  category: string;
  content: string;
  impact_score: string;
  confidence_score: number;
}

interface BusinessQuestionsProps {
  recs: Rec[];
  kpis: any;
  summaryLayer?: any;
}

export default function BusinessQuestions({ recs, kpis, summaryLayer }: BusinessQuestionsProps) {
  // Safe fallbacks for recommendations
  const activeRecs = recs.length > 0 ? recs : [
    { id: 1, category: 'cross-sell', content: 'Promote Accessories to buyers of the top selling product category to boost average order value.', impact_score: 'High', confidence_score: 0.85 },
    { id: 2, category: 'retention', content: 'Engage clients in At Risk segments with a custom loyalty rewards campaign to prevent churn.', impact_score: 'High', confidence_score: 0.90 },
    { id: 3, category: 'upsell', content: 'Propose promotional bundled offerings matching the top seller product to increase transaction sizes.', impact_score: 'Medium', confidence_score: 0.80 },
    { id: 4, category: 'inventory', content: 'Audit stock holdings for the leading product categories in top performing regional countries.', impact_score: 'Medium', confidence_score: 0.75 },
    { id: 5, category: 'expansion', content: 'Deploy target marketing campaigns and expand distribution in underrepresented regional zones.', impact_score: 'Low', confidence_score: 0.70 }
  ];

  // Helper values for recommendations cards
  const recMetadata: Record<string, { priority: string, benefit: string }> = {
    'cross-sell': { priority: 'Medium', benefit: 'Optimize cross-sells' },
    'retention': { priority: 'Critical', benefit: 'Prevent customer churn' },
    'upsell': { priority: 'Low', benefit: 'Boost unit margins' },
    'inventory': { priority: 'High', benefit: 'Avoid stock shortages' },
    'expansion': { priority: 'High', benefit: 'Expand regional footprint' }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Medium': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const drivers = summaryLayer?.revenue_drivers || [
    { name: "1. Laptops (Product Category)", value: "$38.9k Sales" },
    { name: "2. US Western Region", value: "45.2% share" },
    { name: "3. Alice Johnson (Customer)", value: "$849.00 CLV" }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Row 1: Key Findings, Opportunities, Risks Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Opportunity Card */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Key Opportunity
            </h4>
            <h3 className="font-bold text-white text-sm mt-3">{summaryLayer?.opportunity_headline || "Product Upselling Campaign"}</h3>
            <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">
              {summaryLayer?.opportunity_content || "Initiating bundled product cross-sells will optimize transaction sizes and increase average order values."}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between text-[10px] font-bold text-emerald-400">
            <span>Expected growth potential</span>
            <span className="flex items-center gap-0.5"><ArrowUpRight className="h-3.5 w-3.5" /> High Impact</span>
          </div>
        </div>

        {/* Warning/Risk Card */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Active Platform Risks
            </h4>
            <h3 className="font-bold text-white text-sm mt-3">{summaryLayer?.risk_headline || "At Risk Customer Cohorts"}</h3>
            <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">
              {summaryLayer?.risk_content || "Inactive customer accounts present churn risks. Engaging these clients with targeted discounts will improve retention."}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between text-[10px] font-bold text-red-400">
            <span>Requires retention action</span>
            <span className="flex items-center gap-0.5">High Severity</span>
          </div>
        </div>

        {/* Revenue Drivers Table */}
        <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-400" /> Key Revenue Drivers
            </h4>
            <div className="space-y-3 mt-4 text-xs">
              {drivers.map((d: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-slate-400">
                  <span>{d.name}</span>
                  <span className="font-bold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Row 2: Business Recommendations List (5 to 15 recommendations) */}
      <section className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl">
        <h3 className="font-bold text-sm text-slate-300 mb-6 flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-400" /> Prioritized Strategic Actions & Business Recommendations
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {activeRecs.map((rec, index) => {
            const meta = recMetadata[rec.category] || { priority: 'Medium', benefit: 'Increase Profit margins' };
            return (
              <div 
                key={rec.id}
                className="p-4 rounded-xl border border-slate-850 bg-slate-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-slate-900/30"
              >
                {/* Content */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getPriorityColor(meta.priority)}`}>
                      {meta.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      Category: {rec.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    {rec.content}
                  </p>
                </div>

                {/* Scores & Benefits */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 text-xs w-full sm:w-auto shrink-0 justify-between sm:justify-start border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-850">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Impact Score</span>
                    <span className="font-extrabold text-emerald-400">{rec.impact_score}</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Confidence</span>
                    <span className="font-extrabold text-white">{Math.round(rec.confidence_score * 100)}%</span>
                  </div>
                  <div className="text-left sm:text-right bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] text-indigo-400 block uppercase font-bold">Expected Benefit</span>
                    <span className="font-extrabold text-white">{meta.benefit}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
