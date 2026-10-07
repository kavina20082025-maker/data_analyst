import React, { useState, useEffect } from 'react';
import { MOCK_DATASETS } from './data/mockDatasets';
import { Dataset, AgentResponse } from './types/data-analyst';
import { processAgentQuery } from './services/agentEngine';
import { auditDatasetTraps } from './services/trapDetector';
import { ProofCertificateBadge } from './components/ProofCertificateBadge';
import { TrapAlertCard } from './components/TrapAlertCard';
import { CodeViewerAndEditor } from './components/CodeViewerAndEditor';
import { DataLineageInspector } from './components/DataLineageInspector';
import { TableViewer } from './components/TableViewer';
import { BenchmarkRunnerView } from './components/BenchmarkRunnerView';
import { SandboxRunnerView } from './components/SandboxRunnerView';
import { DatasetStudio } from './components/DatasetStudio';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Sparkles,
  Database,
  Terminal,
  Activity,
  Layers,
  HelpCircle,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(MOCK_DATASETS[0].id);
  const [activeTab, setActiveTab] = useState<'workbench' | 'data_health' | 'benchmark' | 'sandbox' | 'dataset_studio'>('workbench');
  const [strictMode, setStrictMode] = useState<boolean>(true);

  const [question, setQuestion] = useState<string>(
    'What is the total USD revenue from completed PAID invoices after deduplicating invoice IDs?'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [activeInspectionTable, setActiveInspectionTable] = useState<string | undefined>(undefined);

  const currentDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];
  const detectedTraps = auditDatasetTraps(currentDataset.tables);

  // Initialize with an initial query analysis on first load
  useEffect(() => {
    handleRunQuery(question);
  }, [selectedDatasetId]);

  const handleRunQuery = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    try {
      const response = await processAgentQuery(q, currentDataset, strictMode);
      setAgentResponse(response);
    } catch (err) {
      console.error('Agent query processing failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (presetQ: string) => {
    setQuestion(presetQ);
    handleRunQuery(presetQ);
  };

  const handleBenchmarkSelectQuestion = (q: string, datasetId: string) => {
    setSelectedDatasetId(datasetId);
    setQuestion(q);
    setActiveTab('workbench');
    handleRunQuery(q);
  };

  const handleInspectTable = (tableName: string) => {
    setActiveInspectionTable(tableName);
    setActiveTab('data_health');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    Proof-Carrying Data Analyst
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    HNX26PSI08
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Agentic GenAI · Sandboxed Code Verifier · Epistemic Humility Gate
                </p>
              </div>
            </div>

            {/* Dataset Selector & Epistemic Strict Mode Toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strict Mode Toggle */}
              <button
                onClick={() => {
                  const next = !strictMode;
                  setStrictMode(next);
                  handleRunQuery();
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition ${
                  strictMode
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="When active, the agent strictly refuses questions triggering traps instead of hallucinating confident guesses"
              >
                <div
                  className={`h-2 w-2 rounded-full ${strictMode ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`}
                />
                <span>Strict Epistemic Gate: {strictMode ? 'ON (Say No to Traps)' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <nav className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80 overflow-x-auto text-xs font-mono">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'workbench'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analyst Workbench</span>
            </button>

            <button
              onClick={() => setActiveTab('data_health')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'data_health'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Data Health &amp; Traps ({detectedTraps.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'benchmark'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Adversarial Benchmark Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'sandbox'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Interactive Code Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('dataset_studio')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'dataset_studio'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Dataset Studio</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: ANALYST WORKBENCH */}
        {activeTab === 'workbench' && (
          <div className="space-y-6">
            {/* Query Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-emerald-400" />
                  Ask Any Analytical Question Against Active Multi-Table Data
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {currentDataset.tables.length} Tables ·{' '}
                  {currentDataset.tables.reduce((acc, t) => acc + t.rows.length, 0)} Total Rows
                </span>
              </div>

              {/* Input & Run Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
                    placeholder="e.g. What is the total USD revenue from completed PAID invoices after deduplicating?"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
                  />
                </div>

                <button
                  onClick={() => handleRunQuery()}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 shrink-0"
                >
                  <Zap className={`h-4 w-4 ${isLoading ? 'animate-spin' : 'fill-white'}`} />
                  {isLoading ? 'Synthesizing & Verifying...' : 'Execute Agent & Verify'}
                </button>
              </div>

              {/* Sample Questions Pills (Traps vs Solvable) */}
              <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400 block mb-2 font-medium">
                  Challenge Presets (Click to test agent against specific traps):
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentDataset.sampleQuestions.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handlePresetSelect(sq.question)}
                      className={`text-left px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
                        question === sq.question
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
                          : sq.expectedOutcome === 'refusal'
                          ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-rose-500/20 hover:border-rose-500/40'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            sq.expectedOutcome === 'refusal' ? 'bg-rose-400' : 'bg-emerald-400'
                          }`}
                        />
                        <span className="truncate max-w-[340px] md:max-w-[420px]">{sq.question}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent Result Section */}
            {agentResponse && (
              <div className="space-y-6">
                {/* Proof Certificate Badge */}
                <ProofCertificateBadge
                  certificate={agentResponse.proofCertificate}
                  onReRun={() => handleRunQuery()}
                  isReRunning={isLoading}
                />

                {/* Primary Answer & Epistemic Gate Card */}
                <div
                  className={`rounded-2xl border p-6 shadow-xl ${
                    agentResponse.status === 'refused_unanswerable'
                      ? 'border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-950'
                      : 'border-slate-800 bg-slate-900/90'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
                        Agent Analytical Stance:
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold font-mono uppercase ${
                          agentResponse.status === 'refused_unanswerable'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {agentResponse.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>Epistemic Confidence:</span>
                      <span className="text-white font-bold">
                        {Math.round(agentResponse.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-medium text-slate-100 leading-relaxed">
                      {agentResponse.summary}
                    </h3>

                    {agentResponse.status === 'refused_unanswerable' && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs font-mono space-y-2">
                        <div className="text-blue-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" /> Proof of Unanswerability / Grounded Refusal
                        </div>
                        <p className="text-slate-200 leading-relaxed">
                          {agentResponse.refusalReason}
                        </p>
                        {agentResponse.assumptionsRequired && (
                          <div className="mt-2 pt-2 border-t border-blue-500/20">
                            <span className="text-blue-400 font-medium block mb-1">
                              Missing Clarifying Axioms:
                            </span>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                              {agentResponse.assumptionsRequired.map((a, i) => (
                                <li key={i}>{a}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mathematical Derivation & Data Lineage Trace */}
                {agentResponse.status === 'answered_verified' && (
                  <DataLineageInspector
                    lineage={agentResponse.dataLineage}
                    primaryAnswer={agentResponse.primaryAnswer}
                  />
                )}

                {/* Code Verifier & Interactive Execution Sandbox */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      Re-Runnable Proof-Carrying Code (Every Claimed Number Must Match)
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      Verifier runs this code against live tables
                    </span>
                  </div>

                  <CodeViewerAndEditor
                    initialCode={agentResponse.generatedCode}
                    tables={currentDataset.tables.reduce((acc, t) => {
                      acc[t.name] = t.rows;
                      return acc;
                    }, {} as Record<string, any[]>)}
                    claimedAnswer={agentResponse.primaryAnswer}
                  />
                </div>

                {/* Explanatory Notes & Follow-ups */}
                {agentResponse.suggestedFollowUps && agentResponse.suggestedFollowUps.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono">
                    <span className="text-slate-400 block mb-2 uppercase text-[10px] font-semibold">
                      Suggested Follow-Up Audits:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {agentResponse.suggestedFollowUps.map((fu, i) => (
                        <button
                          key={i}
                          onClick={() => handlePresetSelect(fu)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition text-left"
                        >
                          <span className="text-emerald-400 mr-1.5">&gt;</span>
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DATA HEALTH & TRAPS INSPECTOR */}
        {activeTab === 'data_health' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Trap Detection Engine
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {detectedTraps.length} Traps Flagged in Dataset
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Dataset Health &amp; Adversarial Trap Radar
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    Continuous static schema analysis detecting unit mismatches, ambiguous slash dates,
                    duplicate idempotency keys, and cross-table ledger contradictions.
                  </p>
                </div>
              </div>

              {/* Trap Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {detectedTraps.map((trap) => (
                  <TrapAlertCard
                    key={trap.id}
                    trap={trap}
                    onInspectTable={(tbl) => handleInspectTable(tbl)}
                  />
                ))}
              </div>
            </div>

            {/* Table & Document Explorer */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
                Multi-Table Live Explorer
              </h3>
              <TableViewer
                tables={currentDataset.tables}
                documents={currentDataset.documents}
                activeTableName={activeInspectionTable}
              />
            </div>
          </div>
        )}

        {/* TAB 3: ADVERSARIAL BENCHMARK SUITE */}
        {activeTab === 'benchmark' && (
          <BenchmarkRunnerView
            datasets={datasets}
            onSelectTestQuestion={handleBenchmarkSelectQuestion}
          />
        )}

        {/* TAB 4: INTERACTIVE CODE SANDBOX */}
        {activeTab === 'sandbox' && (
          <SandboxRunnerView tables={currentDataset.tables} />
        )}

        {/* TAB 5: DATASET STUDIO */}
        {activeTab === 'dataset_studio' && (
          <DatasetStudio
            currentDataset={currentDataset}
            onUpdateDataset={(updated) => {
              setDatasets((prev) =>
                prev.map((d) => (d.id === updated.id ? updated : d))
              );
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            Proof-Carrying Data Analyst · Agentic GenAI · Deterministic V8 Verifier Sandbox
          </div>
          <div>
            Rule: Every claimed number must have re-runnable code or score = 0
          </div>
        </div>
      </footer>
    </div>
  );
}
