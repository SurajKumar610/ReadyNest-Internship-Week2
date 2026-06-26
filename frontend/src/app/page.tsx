'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Bot, Compass, Download, ShieldCheck, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b rounded-none px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full mt-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/30">
            S
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Sightfill</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
            Sign In
          </Link>
          <Link href="/auth/register" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-6xl mx-auto text-center mt-12 md:mt-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Bot className="h-4 w-4" /> Next-Gen Customer intelligence
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-tight">
          Turn Raw Sales Datasets Into <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">Actionable Growth Insights</span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Sightfill automatically cleans, analyzes, segments, and forecasts customer transactions. Chat with your data using our AI Analyst and generate executive-grade PDF/Excel reports instantly.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link href="/auth/register" className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 flex items-center gap-2 group transition-all hover:-translate-y-0.5">
            Start Analyzing Free <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/auth/login" className="px-6 py-3 rounded-lg glass-card text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all">
            Explore Demo Project
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 md:mt-36 mb-24">
          <div className="glass-panel p-6 text-left flex flex-col items-start">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Predictive Forecasting</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Generate Sales, Profit, and Demand forecasts with advanced Holt-Winters, ARIMA, and Random Forest models out-of-the-box.
            </p>
          </div>

          <div className="glass-panel p-6 text-left flex flex-col items-start">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">AI Analyst Chatbot</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Ask questions directly about your datasets. Our summarization layer translates large transactions into conversational answers securely.
            </p>
          </div>

          <div className="glass-panel p-6 text-left flex flex-col items-start">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Branded Report Exports</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Export professional corporate PDF slides, PowerPoint presentations, and formatted Excel sheets in one click.
            </p>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 max-w-7xl mx-auto w-full mt-auto">
        &copy; {new Date().getFullYear()} Sightfill Inc. All rights reserved. Professional Portfolio Project.
      </footer>
    </div>
  );
}
