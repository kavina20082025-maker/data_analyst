import React from 'react';
import { ProofCertificate } from '../types/data-analyst';
import { ShieldCheck, ShieldAlert, Cpu, Hash, Clock, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

interface ProofCertificateBadgeProps {
  certificate: ProofCertificate;
  onReRun?: () => void;
  isReRunning?: boolean;
}

export const ProofCertificateBadge: React.FC<ProofCertificateBadgeProps> = ({
  certificate,
  onReRun,
  isReRunning = false
}) => {
  const isPassed = certificate.score === 100;
  const isRefusal = certificate.verifierVerdict === 'JUSTIFIED_REFUSAL';

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isPassed
          ? isRefusal
            ? 'border-blue-500/30 bg-blue-950/20 text-blue-100'
            : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-100'
          : 'border-rose-500/40 bg-rose-950/30 text-rose-100'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          {isPassed ? (
            isRefusal ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40">
                <ShieldCheck className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40">
              <ShieldAlert className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase text-slate-400">
                Proof-Carrying Verification Certificate
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${
                  isPassed
                    ? isRefusal
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {certificate.verifierVerdict.replace(/_/g, ' ')}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white">
              {isPassed
                ? isRefusal
                  ? 'Grounded Refusal Certified (Epistemic Humility Gate Passed)'
                  : 'Reproducible Code & Mathematical Proof Verified'
                : 'Verification Failed: Code output does not match claimed answer'}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[11px] text-slate-400 font-mono">Verifier Score</span>
            <span
              className={`text-xl font-bold font-mono ${
                certificate.score === 100
                  ? isRefusal
                    ? 'text-blue-400'
                    : 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {certificate.score}/100
            </span>
          </div>
          {onReRun && (
            <button
              onClick={onReRun}
              disabled={isReRunning}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <Cpu className={`h-3.5 w-3.5 ${isReRunning ? 'animate-spin' : ''}`} />
              {isReRunning ? 'Executing...' : 'Re-verify Sandbox'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs font-mono">
        <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
          <span className="text-slate-400 text-[10px] block uppercase flex items-center gap-1">
            <Hash className="h-3 w-3" /> Certificate ID
          </span>
          <span className="text-slate-200 truncate block mt-0.5">{certificate.certificateId}</span>
        </div>

        <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
          <span className="text-slate-400 text-[10px] block uppercase flex items-center gap-1">
            <Clock className="h-3 w-3" /> Sandbox Exec Time
          </span>
          <span className="text-slate-200 block mt-0.5">{certificate.executionTimeMs} ms</span>
        </div>

        <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
          <span className="text-slate-400 text-[10px] block uppercase flex items-center gap-1">
            <Cpu className="h-3 w-3" /> Proof Hash
          </span>
          <span className="text-slate-200 truncate block mt-0.5">{certificate.proofHash}</span>
        </div>

        <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
          <span className="text-slate-400 text-[10px] block uppercase flex items-center gap-1">
            <Terminal className="h-3 w-3" /> Environment
          </span>
          <span className="text-slate-200 truncate block mt-0.5">Isolated V8 Sandbox</span>
        </div>
      </div>

      {certificate.stdout && certificate.stdout.length > 0 && (
        <div className="mt-3 bg-black/40 rounded-lg p-2.5 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Terminal className="h-3 w-3 text-emerald-400" /> Verifier Sandbox STDOUT ({certificate.stdout.length} lines)
            </span>
          </div>
          <div className="max-h-28 overflow-y-auto font-mono text-[11px] text-emerald-300/90 space-y-0.5">
            {certificate.stdout.map((line, idx) => (
              <div key={idx} className="leading-tight">
                <span className="text-slate-600 select-none mr-2">&gt;</span>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
