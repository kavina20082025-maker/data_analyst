import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, Edit3, RotateCcw, Sparkles } from 'lucide-react';
import { executeInSandbox } from '../services/sandbox';

interface CodeViewerAndEditorProps {
  initialCode: string;
  tables: Record<string, any[]>;
  claimedAnswer?: any;
  onCodeExecuted?: (output: any, stdout: string[], executionTime: number) => void;
}

export const CodeViewerAndEditor: React.FC<CodeViewerAndEditorProps> = ({
  initialCode,
  tables,
  claimedAnswer,
  onCodeExecuted
}) => {
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastOutput, setLastOutput] = useState<any>(null);
  const [stdout, setStdout] = useState<string[]>([]);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  // Sync if initialCode changes
  React.useEffect(() => {
    setCode(initialCode);
    setLastOutput(null);
    setStdout([]);
    setExecError(null);
  }, [initialCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setIsRunning(true);
    setExecError(null);

    setTimeout(() => {
      const res = executeInSandbox(code, tables);
      setIsRunning(false);
      setExecTime(res.executionTimeMs);
      setStdout(res.stdout);

      if (res.success) {
        setLastOutput(res.output);
        if (onCodeExecuted) {
          onCodeExecuted(res.output, res.stdout, res.executionTimeMs);
        }
      } else {
        setExecError(res.error || 'Execution failed');
      }
    }, 50);
  };

  const handleReset = () => {
    setCode(initialCode);
    setLastOutput(null);
    setStdout([]);
    setExecError(null);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
      {/* Code Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-2 text-xs font-mono font-medium text-slate-300">
            data_pipeline_verifier.js
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Executable Proof
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition border ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditing ? 'Editing Mode' : 'Edit Code'}
          </button>

          {isEditing && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
              title="Reset to original code"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
            {isRunning ? 'Running...' : 'Run in Sandbox'}
          </button>
        </div>
      </div>

      {/* Editor / Code View */}
      <div className="p-0 font-mono text-xs">
        {isEditing ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 p-4 text-emerald-300/90 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y leading-relaxed border-none"
            spellCheck={false}
          />
        ) : (
          <div className="max-h-[380px] overflow-auto p-4 bg-slate-950 text-slate-200">
            <pre className="text-xs font-mono leading-relaxed text-emerald-200/90 whitespace-pre">
              {code}
            </pre>
          </div>
        )}
      </div>

      {/* Sandbox Output Console */}
      {(lastOutput !== null || execError || stdout.length > 0) && (
        <div className="border-t border-slate-800 bg-black/60 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wide">
                Sandbox Execution Output
              </span>
            </div>
            {execTime !== null && (
              <span className="text-[11px] font-mono text-slate-400">
                Execution time: <strong className="text-slate-200">{execTime} ms</strong>
              </span>
            )}
          </div>

          {execError ? (
            <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-2.5 text-rose-300 font-mono text-xs">
              <strong>Runtime Error:</strong> {execError}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 font-mono text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Return Value:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {typeof lastOutput === 'object' ? JSON.stringify(lastOutput) : String(lastOutput)}
                  </span>
                </div>
                {claimedAnswer !== undefined && (
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block uppercase">Claimed Number:</span>
                    <span className="text-slate-200 font-mono text-xs">{String(claimedAnswer)}</span>
                  </div>
                )}
              </div>

              {stdout.length > 0 && (
                <div className="rounded-lg bg-black/50 border border-slate-800/80 p-2 font-mono text-[11px] max-h-32 overflow-y-auto space-y-0.5 text-slate-300">
                  {stdout.map((line, i) => (
                    <div key={i} className="text-slate-400">
                      <span className="text-emerald-500/70 mr-1.5">$</span>
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
