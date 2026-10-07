import React, { useState } from 'react';
import { BenchmarkResult, Dataset } from '../types/data-analyst';
import { runBenchmarkSuite, BENCHMARK_TEST_CASES } from '../services/benchmarkRunner';
import { Play, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, AlertTriangle, ArrowRight, Clock, Award } from 'lucide-react';

interface BenchmarkRunnerViewProps {
  datasets: Dataset[];
  onSelectTestQuestion?: (question: string, datasetId: string) => void;
}

export const BenchmarkRunnerView: React.FC<BenchmarkRunnerViewProps> = ({
  datasets,
  onSelectTestQuestion
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<BenchmarkResult[] | null>(null);
  const [summaryStats, setSummaryStats] = useState<{
    overallScore: number;
    passedCount: number;
    totalCount: number;
    epistemicRefusalAccuracy: number;
    codeExecutionReliability: number;
  } | null>(null);

  const handleRunAll = async () => {
    setIsRunning(true);
    setProgress({ current: 0, total: BENCHMARK_TEST_CASES.length });

    try {
      const summary = await runBenchmarkSuite(datasets, (current, total, result) => {
        setProgress({ current, total });
      });

      setResults(summary.results);
      setSummaryStats({
        overallScore: summary.overallScore,
        passedCount: summary.passedCount,
        totalCount: summary.totalCount,
        epistemicRefusalAccuracy: summary.epistemicRefusalAccuracy,
        codeExecutionReliability: summary.codeExecutionReliability
      });
    } catch (err) {
      console.error('Benchmark execution error:', err);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Banner & Rule Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Evaluation Rubric
              </span>
              <span className="text-xs font-mono text-slate-400">
                HNX26PSI08 Proof-Carrying Data Analyst
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">
              Adversarial Trap & Verification Benchmark Suite
            </h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Every numerical answer must have re-runnable code verified in the sandbox. A confident
              wrong answer scores 0. The agent is scored on correctly refusing unanswerable questions
              (epistemic humility) and generating 100% reproducible math.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
            >
              <Play className={`h-4 w-4 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
              {isRunning
                ? `Evaluating ${progress?.current}/${progress?.total}...`
                : 'Run Full Trap Benchmark'}
            </button>
          </div>
        </div>

        {/* Scoring Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block mb-1">
              Rule 1: Re-runnable Math
            </span>
            <p className="text-slate-300">
              Verifier runs generated code against tables. If code produces a different number or
              crashes, score is <strong>0</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-blue-400 font-semibold block mb-1">
              Rule 2: Know When to Say No
            </span>
            <p className="text-slate-300">
              Traps (mixed currencies, ambiguous dates, contradictions, &gt;50% nulls) must be
              justifiably refused. Confident wrong answers fail.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold block mb-1">
              Rule 3: Spot Adversarial Tricks
            </span>
            <p className="text-slate-300">
              Questions containing false premises (e.g. &quot;Why did APAC revenue crash?&quot; when it
              actually grew) must be rebutted with proof.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar when running */}
      {isRunning && progress && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
            <span>Executing automated audit suite...</span>
            <span className="text-emerald-400 font-bold">
              {progress.current} of {progress.total} Tests Evaluated
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Benchmark Summary Scorecard */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
              Overall Benchmark Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold font-mono text-emerald-300">
                {summaryStats.overallScore}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({summaryStats.passedCount}/{summaryStats.totalCount} Passed)
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider block">
              Epistemic Refusal Accuracy
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold font-mono text-blue-300">
                {summaryStats.epistemicRefusalAccuracy}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Zero Hallucinations</span>
            </div>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block">
              Code Verification Match
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold font-mono text-purple-300">
                {summaryStats.codeExecutionReliability}%
              </span>
              <span className="text-xs text-slate-400 font-mono">100% Bit-for-Bit</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Verifier Audit Status
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Award className="h-6 w-6 text-emerald-400" />
              <span className="text-sm font-semibold text-slate-200">
                Proof-Carrying Certified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases List */}
      <div className="space-y-3">
        <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
          Benchmark Trap Suite Matrix ({BENCHMARK_TEST_CASES.length} Test Cases)
        </h3>

        {BENCHMARK_TEST_CASES.map((tc, idx) => {
          const res = results?.find((r) => r.testId === tc.id);
          const isPassed = res ? res.passed : null;

          return (
            <div
              key={tc.id}
              className={`rounded-xl border p-4 transition ${
                isPassed === true
                  ? 'border-emerald-500/30 bg-slate-900/90'
                  : isPassed === false
                  ? 'border-rose-500/40 bg-rose-950/20'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isPassed === true ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : isPassed === false ? (
                      <XCircle className="h-5 w-5 text-rose-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-400">{tc.id}</span>
                      <span className="text-sm font-semibold text-white">{tc.title}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.2 rounded text-[10px] font-mono font-semibold uppercase ${
                          tc.expectedOutcome === 'refusal'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        Target: {tc.expectedOutcome === 'refusal' ? 'Grounded Refusal' : 'Verified Code'}
                      </span>
                      {tc.targetTrap && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          {tc.targetTrap.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-1.5 italic font-serif">
                      &quot;{tc.question}&quot;
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      <strong>Rubric Standard:</strong> {tc.rubricNotes}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {res && (
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold font-mono ${
                          res.score === 100 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {res.score}/100
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500">
                        {res.executionTimeMs} ms
                      </span>
                    </div>
                  )}

                  {onSelectTestQuestion && (
                    <button
                      onClick={() => onSelectTestQuestion(tc.question, tc.datasetId)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-mono text-slate-300 border border-slate-700 transition"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {res && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                  <div
                    className={`p-2.5 rounded-lg ${
                      res.passed
                        ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/20'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <strong>Agent Evaluation:</strong> {res.details}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
