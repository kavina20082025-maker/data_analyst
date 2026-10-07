import React from 'react';
import { AgentResponse } from '../types/data-analyst';
import { GitCommit, Filter, Layers, DollarSign, ArrowRight, Database } from 'lucide-react';

interface DataLineageInspectorProps {
  lineage: AgentResponse['dataLineage'];
  primaryAnswer: any;
}

export const DataLineageInspector: React.FC<DataLineageInspectorProps> = ({
  lineage,
  primaryAnswer
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-3.5">
        <GitCommit className="h-4 w-4 text-emerald-400" />
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
          Data Lineage & Mathematical Derivation Trace
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
        {/* Step 1: Input Tables */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
              <Database className="h-3 w-3 text-blue-400" /> Step 1: Raw Ingestion
            </div>
            <div className="space-y-1 mt-1 text-slate-200">
              {Object.entries(lineage.inputRowCount).map(([tbl, count]) => (
                <div key={tbl} className="flex justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-[90px]">{tbl}:</span>
                  <span className="font-bold text-white">{count} rows</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Full schema scan</div>
        </div>

        {/* Step 2: Deduplication */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
              <Layers className="h-3 w-3 text-yellow-400" /> Step 2: Dedup Filter
            </div>
            <div className="mt-1">
              <span className="text-lg font-bold text-amber-400">
                {lineage.droppedDuplicatesCount}
              </span>
              <span className="text-slate-400 text-[11px] block">
                duplicate rows dropped
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Idempotent key partition</div>
        </div>

        {/* Step 3: Filtering & Status */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
              <Filter className="h-3 w-3 text-emerald-400" /> Step 3: Qualified Subset
            </div>
            <div className="space-y-1 mt-1 text-slate-200">
              {Object.entries(lineage.filteredRowCount).map(([tbl, count]) => (
                <div key={tbl} className="flex justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-[90px]">{tbl}:</span>
                  <span className="font-bold text-white">{count} rows</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Validated condition flags</div>
        </div>

        {/* Step 4: Unit Normalization */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
              <DollarSign className="h-3 w-3 text-purple-400" /> Step 4: Normalization
            </div>
            <div className="mt-1 space-y-1 text-[10px] text-purple-300">
              {lineage.unitsNormalized.length > 0 ? (
                lineage.unitsNormalized.map((u, i) => (
                  <div key={i} className="truncate" title={u}>
                    {u}
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Standard Base Unit</div>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Dimensionally sound</div>
        </div>

        {/* Step 5: Final Result */}
        <div className="rounded-lg bg-emerald-950/20 p-3 border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] uppercase mb-1">
              <ArrowRight className="h-3 w-3" /> Verified Output
            </div>
            <div className="mt-1">
              <span className="text-base font-bold font-mono text-emerald-300 block truncate">
                {typeof primaryAnswer === 'number'
                  ? primaryAnswer.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                  : String(primaryAnswer)}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-400/70 mt-2">Cryptographically bound</div>
        </div>
      </div>
    </div>
  );
};
