/**
 * Type definitions for HNX26PSI08: Proof-Carrying Data Analyst
 */

export type TrapCategory =
  | 'unit_currency_mismatch'
  | 'date_ambiguity'
  | 'duplicate_rows'
  | 'contradictory_tables'
  | 'missing_data'
  | 'unsolvable_or_out_of_bounds'
  | 'adversarial_trick_premise';

export interface AuditTrap {
  id: string;
  category: TrapCategory;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  tablesInvolved: string[];
  columnsInvolved: string[];
  description: string;
  affectedRowsCount: number;
  sampleEvidence: Array<{
    key?: string;
    description: string;
    rawValues: Record<string, any>;
  }>;
  impactOnQuestions: string;
  recommendedRefusalOrGuard: string;
}

export interface DataTable {
  name: string;
  description: string;
  columns: string[];
  rows: Record<string, any>[];
  trapsNoted?: string[];
}

export interface UnstructuredDoc {
  name: string;
  title: string;
  content: string;
}

export interface Dataset {
  id: string;
  title: string;
  description: string;
  category: string;
  tables: DataTable[];
  documents: UnstructuredDoc[];
  knownTraps: AuditTrap[];
  sampleQuestions: {
    question: string;
    expectedOutcome: 'solvable' | 'refusal' | 'conditional';
    trapType?: TrapCategory;
    explanation: string;
  }[];
}

export interface ProofCertificate {
  certificateId: string;
  timestamp: string;
  executionStatus: 'success' | 'runtime_error' | 'timeout';
  matchesClaim: boolean;
  claimedAnswer: any;
  executedOutput: any;
  executionTimeMs: number;
  stdout: string[];
  proofHash: string;
  verifierVerdict: 'PASSED_RE_RUNNABLE' | 'FAILED_MISMATCH' | 'FAILED_RUNTIME_ERROR' | 'JUSTIFIED_REFUSAL';
  score: number; // 100 or 0
  codeSha256: string;
  environment: string;
}

export interface AgentResponse {
  status: 'answered_verified' | 'refused_unanswerable' | 'conditional_solution';
  summary: string;
  primaryAnswer: string | number | null;
  confidenceScore: number; // 0 to 1
  epistemicStance: 'confident_verified' | 'humble_refusal' | 'explicit_conditional';
  trapsDetected: AuditTrap[];
  refusalReason?: string;
  assumptionsRequired?: string[];
  alternativeInterpretations?: Array<{
    interpretation: string;
    condition: string;
    calculatedValue: string | number;
    codeSnippet: string;
  }>;
  generatedCode: string;
  codeExplanation: string;
  dataLineage: {
    inputRowCount: Record<string, number>;
    filteredRowCount: Record<string, number>;
    droppedDuplicatesCount: number;
    unitsNormalized: string[];
    joinStrategy: string;
  };
  proofCertificate: ProofCertificate;
  suggestedFollowUps: string[];
}

export interface BenchmarkTestCase {
  id: string;
  title: string;
  datasetId: string;
  question: string;
  expectedOutcome: 'solvable' | 'refusal' | 'conditional';
  targetTrap?: TrapCategory;
  rubricNotes: string;
}

export interface BenchmarkResult {
  testId: string;
  title: string;
  question: string;
  expectedOutcome: 'solvable' | 'refusal' | 'conditional';
  agentOutcome: 'answered_verified' | 'refused_unanswerable' | 'conditional_solution';
  passed: boolean;
  score: number;
  details: string;
  proofVerdict: string;
  executionTimeMs: number;
  response: AgentResponse;
}
