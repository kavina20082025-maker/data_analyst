import React from 'react';
import { AuditTrap } from '../types/data-analyst';
import { AlertTriangle, AlertOctagon, Info, Layers, Calendar, DollarSign, GitCompare, HelpCircle, ShieldAlert } from 'lucide-react';

interface TrapAlertCardProps {
  trap: AuditTrap;
  onInspectTable?: (tableName: string) => void;
}

export const TrapAlertCard: React.FC<TrapAlertCardProps> = ({ trap, onInspectTable }) => {
  const getIcon = () => {
    switch (trap.category) {
      case 'unit_currency_mismatch':
        return <DollarSign className="h-4 w-4 text-purple-400" />;
      case 'date_ambiguity':
        return <Calendar className="h-4 w-4 text-amber-400" />;
      case 'duplicate_rows':
        return <Layers className="h-4 w-4 text-yellow-400" />;
      case 'contradictory_tables':
        return <GitCompare className="h-4 w-4 text-rose-400" />;
      case 'missing_data':
        return <HelpCircle className="h-4 w-4 text-orange-400" />;
      case 'adversarial_trick_premise':
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
  };

  const getSeverityBadge = () => {
    switch (trap.severity) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-slate-800 p-2 border border-slate-700/60">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getSeverityBadge()}`}>
                {trap.severity} TRAP
              </span>
              <span className="text-xs font-mono text-slate-400">
                {trap.category.replace(/_/g, ' ')}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mt-1">{trap.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{trap.description}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Affected Rows</span>
          <span className="text-sm font-bold font-mono text-amber-400">{trap.affectedRowsCount}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Impact on Analytic Queries
          </span>
          <p className="text-slate-300 text-[11px] leading-snug">{trap.impactOnQuestions}</p>
        </div>

        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-emerald-400/90 block mb-1">
            Verifier Guard / Refusal Rule
          </span>
          <p className="text-slate-300 text-[11px] leading-snug">{trap.recommendedRefusalOrGuard}</p>
        </div>
      </div>

      {trap.sampleEvidence && trap.sampleEvidence.length > 0 && (
        <div className="mt-2.5 bg-black/40 rounded-lg p-2 border border-slate-800/80 font-mono text-[11px] text-slate-300">
          <div className="text-[10px] uppercase text-slate-500 mb-1">Evidence Discrepancy Sample:</div>
          {trap.sampleEvidence.map((ev, i) => (
            <div key={i} className="text-amber-200/90">
              <span className="text-slate-500 mr-1.5">•</span>
              {ev.description}
            </div>
          ))}
        </div>
      )}

      {trap.tablesInvolved && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-500">Involved Tables:</span>
          {trap.tablesInvolved.map((t) => (
            <button
              key={t}
              onClick={() => onInspectTable && onInspectTable(t)}
              className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700 transition"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
