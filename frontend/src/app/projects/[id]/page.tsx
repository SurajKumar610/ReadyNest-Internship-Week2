'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '../../../store/useStore';
import { apiFetch, apiUploadFetch, API_BASE_URL } from '../../../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

import ExecutiveSummary from '../../../components/dashboard/ExecutiveSummary';
import EDA from '../../../components/dashboard/EDA';
import ProductPerformance from '../../../components/dashboard/ProductPerformance';
import CustomerOverview from '../../../components/dashboard/CustomerOverview';
import RegionalPerformance from '../../../components/dashboard/RegionalPerformance';
import BusinessQuestions from '../../../components/dashboard/BusinessQuestions';
import PredictiveML from '../../../components/dashboard/PredictiveML';
import { 
  ArrowLeft, ArrowRight, BarChart3, Database, FileText, Bot, 
  Map, TrendingUp, Users, ChevronRight, Upload, AlertCircle, 
  CheckCircle, RefreshCw, Send, Download, Share2, Sparkles, LogOut, Check, Plus, 
  Settings, ShieldAlert, Layers, HelpCircle, Filter, LayoutGrid, FileLineChart
} from 'lucide-react';

interface Rec {
  id: number;
  category: string;
  content: string;
  impact_score: string;
  confidence_score: number;
}

export default function ProjectCockpit() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  // Global State
  const token = useStore((state) => state.token);
  const logout = useStore((state) => state.logout);
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId);

  // Local Navigation State (Sidebar Active Tab)
  const [activeTab, setActiveTab] = useState<'overview' | 'eda' | 'product' | 'customer' | 'regional' | 'questions' | 'predictions' | 'ai' | 'data' | 'reports'>('overview');

  // Local State
  const [project, setProject] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeProcessedDatasetId, setActiveProcessedDatasetId] = useState<number | null>(null);

  const activeDataset = datasets.find((d: any) => d.id === activeProcessedDatasetId);
  
  // Analytics Cache Data
  const [kpis, setKpis] = useState<any>(null);
  const [regional, setRegional] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [eda, setEda] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [summaryLayer, setSummaryLayer] = useState<any>(null);
  
  // Upload and Cleaning State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [showMappingStep, setShowMappingStep] = useState(false);
  const [cleaningStatus, setCleaningStatus] = useState<string>('');
  const [selectedUploadDatasetId, setSelectedUploadDatasetId] = useState<number | null>(null);
  
  // AI State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Reports State
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentication check
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  // Load project details & datasets
  useEffect(() => {
    if (!projectId || !token) return;

    const fetchProjectData = async () => {
      try {
        const projData = await apiFetch(`/projects/${projectId}`);
        setProject(projData);

        const dlist = await apiFetch(`/projects/${projectId}/datasets`);
        setDatasets(dlist);
        
        // Find latest processed dataset for analytics charts
        const processed = dlist.find((d: any) => d.status === 'processed') || dlist[0];
        if (processed) {
          setActiveProcessedDatasetId(processed.id);
        }
      } catch (err: any) {
        console.error("Error loading project: ", err.message);
      }
    };
    fetchProjectData();
  }, [projectId, token]);

  // Load analytics cache whenever activeProcessedDatasetId changes
  useEffect(() => {
    if (!activeProcessedDatasetId || !token) return;

    // Clear previous state to avoid showing stale data from other files
    setKpis(null);
    setRegional(null);
    setProduct(null);
    setSegments([]);
    setPredictions([]);
    setForecast([]);
    setRecs([]);
    setEda(null);
    setCustomerData(null);
    setSummaryLayer(null);

    const loadAnalytics = async () => {
      try {
        const kData = await apiFetch(`/projects/${projectId}/analytics/kpis?dataset_id=${activeProcessedDatasetId}`);
        setKpis(kData);

        const rData = await apiFetch(`/projects/${projectId}/analytics/regional?dataset_id=${activeProcessedDatasetId}`);
        setRegional(rData);

        const pData = await apiFetch(`/projects/${projectId}/analytics/product?dataset_id=${activeProcessedDatasetId}`);
        setProduct(pData);

        const segData = await apiFetch(`/projects/${projectId}/segments?dataset_id=${activeProcessedDatasetId}`);
        setSegments(segData);

        const predChurn = await apiFetch(`/projects/${projectId}/predictions?prediction_type=churn&dataset_id=${activeProcessedDatasetId}`);
        setPredictions(predChurn);

        const predForecastUrl = `/projects/${projectId}/predictions?prediction_type=sales_forecast&dataset_id=${activeProcessedDatasetId}`;
        const predForecastData = await apiFetch(predForecastUrl);
        setForecast(predForecastData);

        const recsData = await apiFetch(`/projects/${projectId}/recommendations?dataset_id=${activeProcessedDatasetId}`);
        setRecs(recsData);

        const edaData = await apiFetch(`/projects/${projectId}/analytics/eda?dataset_id=${activeProcessedDatasetId}`);
        setEda(edaData);

        const custData = await apiFetch(`/projects/${projectId}/analytics/customer?dataset_id=${activeProcessedDatasetId}`);
        setCustomerData(custData);

        const sumData = await apiFetch(`/projects/${projectId}/analytics/summary_layer?dataset_id=${activeProcessedDatasetId}`);
        setSummaryLayer(sumData);

        const reps = await apiFetch(`/projects/${projectId}/reports`);
        setReportsList(reps);
      } catch (err: any) {
        console.warn("Analytics not fully generated yet: ", err.message);
      }
    };
    loadAnalytics();
  }, [activeProcessedDatasetId, projectId, token]);

  // Load AI Conversations
  useEffect(() => {
    if (activeTab === 'ai' && projectId && token) {
      const fetchConvos = async () => {
        try {
          const list = await apiFetch(`/projects/${projectId}/ai/conversations`);
          setConversations(list);
          if (list.length > 0 && !activeConvoId) {
            setActiveConvoId(list[0].id);
            setMessages(list[0].messages || []);
          }
        } catch (err: any) {
          console.error(err);
        }
      };
      fetchConvos();
    }
  }, [activeTab, projectId, token, activeConvoId]);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle dataset upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);

    try {
      const datasetData = await apiUploadFetch(`/projects/${projectId}/datasets/upload`, uploadFile);
      setDatasets([...datasets, datasetData]);
      setSelectedUploadDatasetId(datasetData.id);
      setColumnMappings(datasetData.column_mappings || {});
      setShowMappingStep(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Run pipeline cleaning and modeling
  const handleStartPipeline = async () => {
    if (!selectedUploadDatasetId) return;
    setCleaningStatus('cleaning');
    
    try {
      // Save mappings first
      await apiFetch(`/projects/${projectId}/datasets/${selectedUploadDatasetId}/mapping`, {
        method: 'PUT',
        body: JSON.stringify({ column_mappings: columnMappings })
      });

      // Run
      await apiFetch(`/projects/${projectId}/datasets/${selectedUploadDatasetId}/process`, {
        method: 'POST'
      });

      setShowMappingStep(false);
      
      // Poll status
      const interval = setInterval(async () => {
        const data = await apiFetch(`/projects/${projectId}/datasets/${selectedUploadDatasetId}/status`);
        setCleaningStatus(data.status);
        if (data.status === 'processed' || data.status === 'error') {
          clearInterval(interval);
          // Refresh page datasets lists
          const dlist = await apiFetch(`/projects/${projectId}/datasets`);
          setDatasets(dlist);
          if (data.status === 'processed') {
            setActiveProcessedDatasetId(data.id);
          }
        }
      }, 500);

    } catch (err: any) {
      alert(err.message);
      setCleaningStatus('error');
    }
  };

  // Send AI Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConvoId) return;

    const userMsg = chatInput;
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const data = await apiFetch(`/projects/${projectId}/ai/conversations/${activeConvoId}/chat?dataset_id=${activeProcessedDatasetId || ''}`, {
        method: 'POST',
        body: JSON.stringify({ message: userMsg })
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateAIConversation = async () => {
    try {
      const convo = await apiFetch(`/projects/${projectId}/ai/conversations`, { method: 'POST' });
      setConversations([convo, ...conversations]);
      setActiveConvoId(convo.id);
      setMessages([]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Report generator handler
  const handleGenerateReport = async (type: 'pdf' | 'pptx' | 'xlsx') => {
    if (!activeProcessedDatasetId) return;
    setGeneratingReport(true);
    try {
      const rep = await apiFetch(`/projects/${projectId}/reports/generate?dataset_id=${activeProcessedDatasetId}&report_type=${type}`, {
        method: 'POST'
      });
      setReportsList([rep, ...reportsList]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Share link generator handler
  const handleShareReport = async (reportId: number) => {
    setShareToken(null);
    setShareUrl(null);
    try {
      const data = await apiFetch(`/projects/${projectId}/reports/${reportId}/share`, {
        method: 'POST',
        body: JSON.stringify({ expires_in_days: 7 })
      });
      setShareToken(data.share_token);
      setShareUrl(data.url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#64748b'];

  if (!token) return null;

  // Regions dataset for Geographic sales share chart (standardized fallbacks)
  const regionChartData = regional?.by_region || [
    { region: 'Central', revenue: 2100.0, profit: 700.0 },
    { region: 'East', revenue: 2800.0, profit: 900.0 },
    { region: 'North', revenue: 6200.0, profit: 2100.0 },
    { region: 'South', revenue: 5100.0, profit: 1600.0 },
    { region: 'West', revenue: 150.0, profit: 50.0 }
  ];

  return (
    <div className="flex-1 flex min-h-screen bg-[#070b13] text-slate-100 font-sans overflow-hidden">
      
      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <aside className="w-64 bg-[#070a12] border-r border-slate-900 flex flex-col justify-between shrink-0 z-20">
        
        {/* Logo and Nav links */}
        <div className="p-6 space-y-8">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md shadow-emerald-500/20">
              S
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">Sightfill</span>
          </div>

          {/* Sidebar Menu Groups */}
          <nav className="space-y-6">
            
            {/* Group 1: Analytics Views */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                Analytics Views
              </span>
              
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <FileLineChart className="h-4 w-4" /> Executive Summary
              </button>

              <button 
                onClick={() => setActiveTab('eda')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'eda' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Database className="h-4 w-4" /> Exploratory Data (EDA)
              </button>

              <button 
                onClick={() => setActiveTab('product')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'product' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <BarChart3 className="h-4 w-4" /> Product Performance
              </button>

              <button 
                onClick={() => setActiveTab('customer')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'customer' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Users className="h-4 w-4" /> Customer Overview
              </button>

              <button 
                onClick={() => setActiveTab('regional')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'regional' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Map className="h-4 w-4" /> Regional Performance
              </button>

              <button 
                onClick={() => setActiveTab('questions')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'questions' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <HelpCircle className="h-4 w-4" /> Business Questions
              </button>
            </div>

            {/* Group 2: AI & Predictions */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                AI & Predictions
              </span>

              <button 
                onClick={() => setActiveTab('predictions')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'predictions' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <TrendingUp className="h-4 w-4" /> Predictive ML
              </button>

              <button 
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'ai' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Bot className="h-4 w-4" /> AI Analyst & Chat
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <FileText className="h-4 w-4" /> Executive Reports
              </button>
            </div>

            {/* Group 3: Configuration */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                Configuration
              </span>

              <button 
                onClick={() => setActiveTab('data')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'data' 
                    ? 'bg-[#121c2e] text-teal-400 border-l-2 border-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Upload className="h-4 w-4" /> Upload & Clean Data
              </button>
            </div>

          </nav>
        </div>

        {/* Back Button */}
        <div className="p-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>

      </aside>

      {/* ----------------- RIGHT CONTENT CONTAINER ----------------- */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-[#070b13] border-b border-slate-900 px-8 py-5 flex items-center justify-between">
          
          {/* Path Breadcrumbs & Dataset Switcher */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Workspaces</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300 font-semibold">{project?.name || 'sales 2026'}</span>
            </div>
            
            {datasets.length > 0 && (
              <div className="flex items-center gap-2 bg-[#0d1424]/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-md">
                <Database className="h-4 w-4 text-teal-450" />
                <span className="text-xs font-bold text-slate-400">File:</span>
                <select 
                  value={activeProcessedDatasetId || ''} 
                  onChange={(e) => setActiveProcessedDatasetId(Number(e.target.value))}
                  className="bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  {datasets.map((d: any) => (
                    <option key={d.id} value={d.id} className="bg-[#0d1424] text-white">
                      {d.name} ({d.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-4">
            
            {/* Visual Icons */}
            <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-800/80 p-1.5 rounded-lg text-slate-400">
              <LayoutGrid className="h-4 w-4 p-0.5 cursor-pointer hover:text-white" />
              <FileLineChart className="h-4 w-4 p-0.5 cursor-pointer hover:text-white" />
              <Settings className="h-4 w-4 p-0.5 cursor-pointer hover:text-white" />
            </div>

            {/* Filter */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-xs font-semibold rounded-lg transition-colors">
              <Filter className="h-3.5 w-3.5 text-slate-400" /> Filters
            </button>

            {/* Sign Out */}
            <button 
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 text-xs font-semibold rounded-lg transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>

        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8 flex-1">

          {/* Unprocessed Dataset Alert */}
          {activeDataset && activeDataset.status !== 'processed' && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Analysis Required for "{activeDataset.name}"</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This file is currently in the <strong>{activeDataset.status}</strong> state. You must run the data cleaning and predictive modeling pipeline before viewing its insights.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUploadDatasetId(activeDataset.id);
                  setColumnMappings(activeDataset.column_mappings || {});
                  setShowMappingStep(true);
                  setActiveTab('data');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-colors shrink-0"
              >
                <RefreshCw className="h-4 w-4" /> Configure & Process Now
              </button>
            </div>
          )}

          {/* Loading State when dataset is processed but API is pending */}
          {activeDataset && activeDataset.status === 'processed' && !kpis && activeTab !== 'data' && activeTab !== 'ai' && (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-xs text-slate-500">Loading insights and recommendations...</p>
            </div>
          )}

          {/* Tab Views */}
          {(!activeDataset || activeDataset.status === 'processed') && kpis && (
            <>
              {activeTab === 'overview' && (
                <ExecutiveSummary kpis={kpis} forecast={forecast} regionChartData={regionChartData} eda={eda} summaryLayer={summaryLayer} />
              )}

              {activeTab === 'eda' && (
                <EDA 
                  dataset={activeDataset || datasets[0]} 
                  product={product} 
                  eda={eda}
                />
              )}

              {activeTab === 'product' && (
                <ProductPerformance product={product} />
              )}

              {activeTab === 'customer' && (
                <CustomerOverview segments={segments} customerData={customerData} regional={regional} />
              )}

              {activeTab === 'regional' && (
                <RegionalPerformance regional={regional} kpis={kpis} />
              )}

              {activeTab === 'questions' && (
                <BusinessQuestions recs={recs} kpis={kpis} summaryLayer={summaryLayer} />
              )}

              {activeTab === 'predictions' && (
                <PredictiveML predictions={[...predictions, ...forecast]} customerData={customerData} />
              )}
            </>
          )}

          {/* ----------------- TAB: AI ANALYST & CHAT ----------------- */}
          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[550px] animate-fade-in-up">
              
              {/* Conversation list */}
              <div className="bg-[#0d1424]/75 border border-slate-800/60 p-4 flex flex-col justify-between h-full rounded-xl">
                <div>
                  <button 
                    onClick={handleCreateAIConversation}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mb-4 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> New Conversation
                  </button>
                  <div className="space-y-2 overflow-y-auto max-h-[400px]">
                    {conversations.map((c) => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          setActiveConvoId(c.id);
                          setMessages(c.messages || []);
                        }}
                        className={`p-3 rounded-lg text-xs font-semibold cursor-pointer border hover:bg-slate-900 transition-colors ${
                          activeConvoId === c.id 
                            ? 'border-teal-500 bg-teal-500/5 text-teal-400' 
                            : 'border-transparent text-slate-400'
                        }`}
                      >
                        {c.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat panel */}
              <div className="bg-[#0d1424]/75 border border-slate-800/60 lg:col-span-3 flex flex-col justify-between h-full overflow-hidden rounded-xl">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                      <Bot className="h-10 w-10 text-indigo-400 mb-3" />
                      <h4 className="font-bold text-white">Chat with AI Consultant</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                        Ask natural language questions about customer behaviors, top-selling lines, regional patterns, or forecasts.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {["Give me strategic recommendations", "Summarize forecasting results", "Which region generated highest revenue?"].map((q) => (
                          <button 
                            key={q} 
                            onClick={() => setChatInput(q)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-[10px] font-semibold hover:bg-slate-850"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold ${
                          m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {m.role === 'user' ? 'U' : 'AI'}
                        </div>
                        <div className={`p-4 rounded-xl text-xs leading-relaxed border ${
                          m.role === 'user' 
                            ? 'bg-indigo-600/5 border-indigo-500/30 text-white' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-200'
                        }`}>
                          {m.content.split('\n').map((line: string, i: number) => (
                            <p key={i} className={line.startsWith('*') ? 'pl-3' : ''}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex gap-3 mr-auto items-center text-xs text-slate-400">
                      <Bot className="h-5 w-5 animate-pulse text-indigo-400" />
                      <span>AI Consultant is analyzing summaries...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 flex items-center gap-3 bg-slate-950/20">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about the dataset summaries..."
                    disabled={!activeConvoId || chatLoading}
                    className="flex-1 px-3 py-2 border border-slate-800 rounded-lg bg-[#070b13] text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={!activeConvoId || !chatInput.trim() || chatLoading}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ----------------- TAB: DATA CLEANER (CONFIGURATION) ----------------- */}
          {activeTab === 'data' && (
            <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
              <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl">
                <h3 className="font-bold text-lg text-white mb-2">Upload Sales Dataset</h3>
                <p className="text-xs text-slate-500 mb-6">Supported formats: CSV, XLSX, XLS, JSON. Files must contain columns for Order Date, Customer, Product, and Sales Amount.</p>
                
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center hover:bg-indigo-500/5 transition-colors cursor-pointer relative bg-slate-950/20">
                    <input 
                      type="file" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-300">
                      {uploadFile ? uploadFile.name : 'Drag and drop file here or click to browse'}
                    </p>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={uploading || !uploadFile}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50 transition-colors"
                  >
                    {uploading ? 'Uploading File...' : 'Upload File'}
                  </button>
                </form>
              </div>

              {/* Mapping & Processing Settings Step */}
              {showMappingStep && (
                <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl border-indigo-500/50">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" /> Smart Column Mapper
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Validate schema properties before launching the cleaning and modeling pipelines.</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {Object.keys(columnMappings).map((originalCol) => (
                      <div key={originalCol} className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
                        <span className="font-bold text-slate-400">{originalCol}</span>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-indigo-450" />
                          <select 
                            value={columnMappings[originalCol]}
                            onChange={(e) => setColumnMappings({
                              ...columnMappings,
                              [originalCol]: e.target.value
                            })}
                            className="bg-transparent border-none font-bold text-teal-400 focus:outline-none dark:bg-slate-950"
                          >
                            <option value="customer_id">Customer ID</option>
                            <option value="customer_name">Customer Name</option>
                            <option value="product_id">Product ID</option>
                            <option value="product_name">Product Name</option>
                            <option value="product_category">Product Category</option>
                            <option value="sales_amount">Sales Amount</option>
                            <option value="profit">Profit</option>
                            <option value="quantity">Quantity</option>
                            <option value="order_date">Order Date</option>
                            <option value="country">Country</option>
                            <option value="state">State</option>
                            <option value="city">City</option>
                            <option value="region">Region</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleStartPipeline}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow transition-colors"
                  >
                    Verify & Execute Pipeline
                  </button>
                </div>
              )}

              {/* Pipeline Status Indicator */}
              {cleaningStatus && (
                <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-3">
                    {cleaningStatus === 'cleaning' ? (
                      <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                    ) : cleaningStatus === 'error' ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    )}
                    <h4 className="font-bold text-white capitalize">
                      Pipeline Execution: {cleaningStatus}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {cleaningStatus === 'cleaning' 
                      ? 'Automating dates standardizations, outliers pruning, segmentations training, and forecasting modeling...' 
                      : cleaningStatus === 'error' 
                        ? 'Execution failed. Please verify column selections.' 
                        : 'Audit pipeline processing has completed successfully.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ----------------- TAB: REPORTS ----------------- */}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Export Trigger */}
              <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto rounded-xl">
                <div>
                  <h3 className="font-bold text-lg text-white">Export Executive Reports</h3>
                  <p className="text-xs text-slate-500 mt-1">Compile all analytical findings, segments matrix, and forecasts into premium PDF/PPTX/Excel documents.</p>
                </div>

                <div className="flex gap-3 shrink-0">
                  <button 
                    onClick={() => handleGenerateReport('pdf')}
                    disabled={generatingReport || !activeProcessedDatasetId}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 text-red-500" /> Export PDF Slides
                  </button>
                  <button 
                    onClick={() => handleGenerateReport('pptx')}
                    disabled={generatingReport || !activeProcessedDatasetId}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50"
                  >
                    <TrendingUp className="h-4 w-4 text-orange-500" /> Export PowerPoint
                  </button>
                  <button 
                    onClick={() => handleGenerateReport('xlsx')}
                    disabled={generatingReport || !activeProcessedDatasetId}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50"
                  >
                    <Database className="h-4 w-4 text-green-500" /> Export Excel
                  </button>
                </div>
              </div>

              {/* Reports Files List */}
              <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 max-w-4xl mx-auto rounded-xl">
                <h3 className="font-bold text-lg text-white mb-4">Generated Files & Share Links</h3>
                <div className="divide-y divide-slate-850">
                  {reportsList.map((rep) => (
                    <div key={rep.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{rep.name}</h4>
                          <span className="text-[10px] text-slate-500 capitalize">Type: {rep.type} | Created: {new Date(rep.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a 
                          href={`${API_BASE_URL}/projects/${projectId}/reports/${rep.id}/download`} 
                          download
                          className="p-2 border border-slate-800 rounded-lg hover:bg-slate-900 text-slate-350"
                          title="Download Report"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button 
                          onClick={() => handleShareReport(rep.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                        >
                          <Share2 className="h-4 w-4" /> Share Dashboard Link
                        </button>
                      </div>
                    </div>
                  ))}
                  {reportsList.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No reports generated yet. Click options above to compile slides or worksheets.
                    </div>
                  )}
                </div>
              </div>

              {/* Public Sharing link Modal */}
              {shareUrl && (
                <div className="bg-[#0d1424]/75 border border-slate-800/60 p-6 border-emerald-500/40 bg-emerald-500/5 max-w-xl mx-auto text-center rounded-xl">
                  <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <h4 className="font-bold text-white text-sm">Secure Sharing Token Generated</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    Send this link to stakeholders for read-only cockpit overview without login requirement. Expiration: 7 Days.
                  </p>
                  <div className="flex items-center gap-2 bg-[#070b13] p-2 rounded-lg border border-slate-800 text-xs">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareUrl}
                      className="flex-1 bg-transparent border-none focus:outline-none font-semibold text-slate-300"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        alert('Share link copied to clipboard!');
                      }}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
