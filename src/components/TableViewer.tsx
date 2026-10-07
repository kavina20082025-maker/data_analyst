import React, { useState } from 'react';
import { DataTable, UnstructuredDoc } from '../types/data-analyst';
import { Search, AlertTriangle, Layers, Calendar, DollarSign, FileText, Table as TableIcon } from 'lucide-react';

interface TableViewerProps {
  tables: DataTable[];
  documents?: UnstructuredDoc[];
  activeTableName?: string;
  onTableChange?: (name: string) => void;
}

export const TableViewer: React.FC<TableViewerProps> = ({
  tables,
  documents = [],
  activeTableName,
  onTableChange
}) => {
  const [selectedTable, setSelectedTable] = useState<string>(activeTableName || tables[0]?.name || '');
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Sync if prop changes
  React.useEffect(() => {
    if (activeTableName) {
      setSelectedTable(activeTableName);
      setActiveDoc(null);
    }
  }, [activeTableName]);

  const currentTable = tables.find((t) => t.name === selectedTable);
  const currentDoc = documents.find((d) => d.name === activeDoc);

  // Check row conditions for traps
  const getRowTrapStyle = (row: Record<string, any>, tableName: string) => {
    // Duplicate invoice check
    if (tableName === 'raw_invoices' && (row.invoice_id === 'INV-1002' || row.invoice_id === 'INV-1008')) {
      return 'bg-amber-950/20 hover:bg-amber-950/30 border-l-2 border-l-amber-500';
    }
    // Contradiction check
    if (tableName === 'raw_invoices' && row.invoice_id === 'INV-1004') {
      return 'bg-rose-950/25 hover:bg-rose-950/35 border-l-2 border-l-rose-500';
    }
    if (tableName === 'bank_settlements' && row.invoice_id === 'INV-1004') {
      return 'bg-rose-950/25 hover:bg-rose-950/35 border-l-2 border-l-rose-500';
    }
    // Ambiguous date check
    if (row.invoice_date && typeof row.invoice_date === 'string' && row.invoice_date.includes('/')) {
      return 'bg-purple-950/20 hover:bg-purple-950/30 border-l-2 border-l-purple-500';
    }
    return 'hover:bg-slate-800/40';
  };

  const filteredRows = currentTable
    ? currentTable.rows.filter((r) => {
        if (!search) return true;
        return Object.values(r).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase())
        );
      })
    : [];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg">
      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-slate-500 mr-1 flex items-center gap-1">
            <TableIcon className="h-3 w-3" /> Tables:
          </span>
          {tables.map((tbl) => (
            <button
              key={tbl.name}
              onClick={() => {
                setSelectedTable(tbl.name);
                setActiveDoc(null);
                if (onTableChange) onTableChange(tbl.name);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                selectedTable === tbl.name && !activeDoc
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{tbl.name}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-slate-400">
                {tbl.rows.length}
              </span>
            </button>
          ))}

          {documents.length > 0 && (
            <>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <span className="text-[10px] font-mono uppercase text-slate-500 mr-1 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Docs:
              </span>
              {documents.map((doc) => (
                <button
                  key={doc.name}
                  onClick={() => setActiveDoc(doc.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                    activeDoc === doc.name
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>{doc.name}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {!activeDoc && (
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-44 md:w-56"
            />
          </div>
        )}
      </div>

      {/* Unstructured Document View */}
      {activeDoc && currentDoc && (
        <div className="p-6 bg-slate-950/60">
          <div className="max-w-3xl mx-auto rounded-xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <FileText className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-semibold text-white">{currentDoc.title}</h3>
              <span className="text-xs font-mono text-slate-500 ml-auto">{currentDoc.name}</span>
            </div>
            <div className="prose prose-invert prose-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {currentDoc.content}
            </div>
          </div>
        </div>
      )}

      {/* Table Data View */}
      {!activeDoc && currentTable && (
        <div>
          {/* Table Description & Legend */}
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-sans">{currentTable.description}</span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Duplicate Key
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /> Cross-table Contradiction
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" /> Ambiguous Date
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-500 w-12 text-center">#</th>
                  {currentTable.columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredRows.map((row, idx) => {
                  const trapClass = getRowTrapStyle(row, currentTable.name);
                  return (
                    <tr key={idx} className={`transition ${trapClass}`}>
                      <td className="py-2 px-3 text-slate-500 text-center select-none text-[11px]">
                        {idx + 1}
                      </td>
                      {currentTable.columns.map((col) => {
                        const val = row[col];
                        const isNull = val === null || val === undefined;
                        const isTrapDate = col.includes('date') && typeof val === 'string' && val.includes('/');
                        const isContradiction = col.includes('amount') && (row.invoice_id === 'INV-1004');
                        const isDuplicate = (row.invoice_id === 'INV-1002' || row.invoice_id === 'INV-1008') && col === 'invoice_id';

                        return (
                          <td key={col} className="py-2 px-3 whitespace-nowrap">
                            {isNull ? (
                              <span className="text-slate-600 italic">null</span>
                            ) : isDuplicate ? (
                              <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                                {String(val)}
                                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 uppercase">
                                  DUP
                                </span>
                              </span>
                            ) : isContradiction ? (
                              <span className="inline-flex items-center gap-1 text-rose-300 font-bold">
                                {String(val)}
                                <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-400 uppercase">
                                  DISPUTE
                                </span>
                              </span>
                            ) : isTrapDate ? (
                              <span className="inline-flex items-center gap-1 text-purple-300 font-medium">
                                <Calendar className="h-3 w-3 text-purple-400" />
                                {String(val)}
                              </span>
                            ) : typeof val === 'number' ? (
                              <span className="font-mono text-emerald-300">{val.toLocaleString()}</span>
                            ) : (
                              <span>{String(val)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
