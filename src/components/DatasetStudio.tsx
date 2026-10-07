import React, { useState } from 'react';
import { Dataset, DataTable } from '../types/data-analyst';
import { Plus, Upload, Trash2, Database, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';

interface DatasetStudioProps {
  currentDataset: Dataset;
  onUpdateDataset: (updated: Dataset) => void;
}

export const DatasetStudio: React.FC<DatasetStudioProps> = ({
  currentDataset,
  onUpdateDataset
}) => {
  const [newTableName, setNewTableName] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleParseAndAdd = () => {
    setParseError(null);
    setSuccessMsg(null);

    if (!newTableName.trim()) {
      setParseError('Please provide a table name.');
      return;
    }

    if (!csvContent.trim()) {
      setParseError('Please provide CSV data.');
      return;
    }

    try {
      const lines = csvContent.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setParseError('CSV must contain a header line and at least one data row.');
        return;
      }

      const columns = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        const rowObj: Record<string, any> = {};
        columns.forEach((col, idx) => {
          const val = parts[idx] ?? '';
          const num = Number(val);
          rowObj[col] = !isNaN(num) && val !== '' ? num : val;
        });
        return rowObj;
      });

      const newTable: DataTable = {
        name: newTableName.toLowerCase().replace(/\s+/g, '_'),
        description: `Custom user-uploaded table (${rows.length} rows)`,
        columns,
        rows
      };

      const updated = {
        ...currentDataset,
        tables: [...currentDataset.tables, newTable]
      };

      onUpdateDataset(updated);
      setSuccessMsg(`Successfully added table '${newTable.name}' with ${rows.length} rows!`);
      setNewTableName('');
      setCsvContent('');
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse CSV format.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      const inferredName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      setNewTableName(inferredName);
    };
    reader.readAsText(file);
  };

  const handleDeleteTable = (tableName: string) => {
    if (currentDataset.tables.length <= 1) {
      alert('Cannot delete the last table in dataset.');
      return;
    }
    const updated = {
      ...currentDataset,
      tables: currentDataset.tables.filter((t) => t.name !== tableName)
    };
    onUpdateDataset(updated);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Dataset Management Studio</h2>
        </div>
        <p className="text-sm text-slate-300 mt-1">
          Add custom tables, paste CSV data, or upload messy real-world files to test the
          Proof-Carrying Data Analyst agent against your own data pipelines.
        </p>

        {/* Current Tables List */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Active Tables in Current Dataset ({currentDataset.tables.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentDataset.tables.map((t) => (
              <div
                key={t.name}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-start justify-between gap-2"
              >
                <div>
                  <h4 className="text-sm font-semibold font-mono text-emerald-300">{t.name}</h4>
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">
                    {t.rows.length} rows · {t.columns.length} columns
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 truncate max-w-[200px]">
                    Cols: {t.columns.join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTable(t.name)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                  title="Remove table"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload & Add Form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Plus className="h-4 w-4 text-emerald-400" /> Add New Table via CSV
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Table Name</label>
              <input
                type="text"
                placeholder="e.g. inventory_audit"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Upload File (.csv)
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 transition">
                <Upload className="h-4 w-4 text-emerald-400" />
                <span>Choose CSV File</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              CSV Content (Headers in first line)
            </label>
            <textarea
              rows={6}
              placeholder={`id,product,units,price_usd\n1,Alpha Widget,45,12.50\n2,Beta Gizmo,80,24.00`}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-300/90 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {parseError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleParseAndAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Parse &amp; Ingest Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
