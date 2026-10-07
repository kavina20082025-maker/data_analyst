import React, { useState } from 'react';
import { DataTable } from '../types/data-analyst';
import { executeInSandbox, generateProofHash } from '../services/sandbox';
import { Play, Terminal, Cpu, Copy, Check, Clock, Code, Sparkles, BookOpen } from 'lucide-react';

interface SandboxRunnerViewProps {
  tables: DataTable[];
}

const TEMPLATE_SCRIPTS = [
  {
    name: 'Invoice Deduplication & Currency Normalizer',
    code: `// Deduplicate invoices and convert to USD
const invoices = tables.raw_invoices || [];
const fxRates = tables.fx_rates || [];

const fxMap = {};
fxRates.forEach(r => fxMap[r.currency] = r.usd_rate);

const seen = new Set();
const dedupedPaid = [];

invoices.forEach(inv => {
  if (!seen.has(inv.invoice_id) && inv.status === 'PAID') {
    seen.add(inv.invoice_id);
    dedupedPaid.push(inv);
  }
});

console.log('Unique paid invoices:', dedupedPaid.length);

let totalUsd = 0;
dedupedPaid.forEach(inv => {
  const rate = fxMap[inv.currency] || 1.0;
  const usd = inv.amount * rate;
  totalUsd += usd;
  console.log(inv.invoice_id + ': ' + inv.amount + ' ' + inv.currency + ' -> $' + Math.round(usd));
});

return {
  uniqueCount: dedupedPaid.length,
  totalUsdRevenue: Math.round(totalUsd * 100) / 100
};`
  },
  {
    name: 'Cross-Table Contradiction Auditor',
    code: `// Compare raw invoices against bank deposits
const invoices = tables.raw_invoices || [];
const settlements = tables.bank_settlements || [];

const invMap = {};
invoices.forEach(i => invMap[i.invoice_id] = i.amount);

const discrepancies = [];

settlements.forEach(s => {
  const billedAmt = invMap[s.invoice_id];
  const settledAmt = s.settled_amount;
  if (billedAmt !== undefined && billedAmt !== settledAmt) {
    discrepancies.push({
      invoice_id: s.invoice_id,
      billed: billedAmt,
      settled: settledAmt,
      variance: settledAmt - billedAmt,
      notes: s.notes
    });
  }
});

console.log('Found discrepancies:', discrepancies.length);
return discrepancies;`
  },
  {
    name: 'Logistics Weight Mass Unit Harmonizer',
    code: `// Convert pounds (lbs) to kilograms (kg) and aggregate
const shipments = tables.freight_shipments || [];

let totalKg = 0;
let packageCount = 0;

shipments.forEach(s => {
  if (s.status === 'DELIVERED') {
    const raw = Number(s.weight_value);
    const inKg = s.weight_unit === 'lbs' ? raw * 0.45359237 : raw;
    totalKg += inKg;
    packageCount++;
    console.log(s.shipment_id + ': ' + raw + ' ' + s.weight_unit + ' -> ' + Math.round(inKg) + ' kg');
  }
});

return {
  deliveredPackages: packageCount,
  totalDeliveredMassKg: Math.round(totalKg * 100) / 100
};`
  }
];

export const SandboxRunnerView: React.FC<SandboxRunnerViewProps> = ({ tables }) => {
  const [code, setCode] = useState(TEMPLATE_SCRIPTS[0].code);
  const [stdout, setStdout] = useState<string[]>([]);
  const [output, setOutput] = useState<any>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proofHash, setProofHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tablesMap = tables.reduce((acc, t) => {
    acc[t.name] = t.rows;
    return acc;
  }, {} as Record<string, any[]>);

  const handleRun = () => {
    setError(null);
    const res = executeInSandbox(code, tablesMap);
    setExecTime(res.executionTimeMs);
    setStdout(res.stdout);

    if (res.success) {
      setOutput(res.output);
      const hash = generateProofHash('custom_query', code, res.output, tablesMap, new Date().toISOString());
      setProofHash(hash);
    } else {
      setError(res.error || 'Execution failed');
      setOutput(null);
      setProofHash(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sandbox Environment
              </span>
              <span className="text-xs font-mono text-slate-400">Isolated V8 Context</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Interactive Code Execution & Audit Studio
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Write, inspect, and execute reproducible JavaScript data queries directly against the
              loaded tables (<code className="text-emerald-400 font-mono">tables.&lt;table_name&gt;</code>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>

            <button
              onClick={handleRun}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition"
            >
              <Play className="h-4 w-4 fill-white" />
              Run Query in Sandbox
            </button>
          </div>
        </div>

        {/* Templates quick select */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-mono flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Sample Scripts:
          </span>
          {TEMPLATE_SCRIPTS.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setCode(t.code);
                setOutput(null);
                setStdout([]);
                setError(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Code Editor */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg flex flex-col">
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-emerald-400" />
              <span>sandbox_script.js</span>
            </div>
            <span className="text-[11px] text-slate-500">Global: tables, console</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={20}
            className="flex-1 w-full bg-slate-950 p-4 text-emerald-300/90 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Right: Output & Console */}
        <div className="space-y-4">
          {/* Result Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Execution Result</h3>
              </div>
              {execTime !== null && (
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" /> {execTime} ms
                </span>
              )}
            </div>

            {error ? (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                <strong>Runtime Error:</strong> {error}
              </div>
            ) : output !== null ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-black/60 border border-slate-800 text-emerald-300 overflow-x-auto max-h-48">
                  <pre>{JSON.stringify(output, null, 2)}</pre>
                </div>
                {proofHash && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 p-2 rounded bg-slate-950 border border-slate-800">
                    <span>Proof Hash:</span>
                    <span className="text-slate-200 font-bold">{proofHash}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Click &quot;Run Query in Sandbox&quot; to execute this code.
              </div>
            )}
          </div>

          {/* Console STDOUT Log */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wide">
                Console STDOUT ({stdout.length} lines)
              </span>
            </div>

            <div className="h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
              {stdout.length === 0 ? (
                <div className="text-slate-600 italic">No console logs output yet.</div>
              ) : (
                stdout.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 leading-tight">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className="text-emerald-300/90">{line}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
