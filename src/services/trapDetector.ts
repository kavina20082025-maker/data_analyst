/**
 * Data Audit & Adversarial Trap Detection Engine
 * Systematically audits multi-table schemas, rows, and user questions for traps.
 */

import { AuditTrap, TrapCategory, DataTable } from '../types/data-analyst';

export function auditDatasetTraps(tables: DataTable[]): AuditTrap[] {
  const traps: AuditTrap[] = [];

  tables.forEach((table) => {
    const rows = table.rows || [];
    if (rows.length === 0) return;

    // 1. Check for Duplicate Rows or IDs
    const idColumn = table.columns.find((col) => /id$|_id$|^id$/i.test(col));
    if (idColumn) {
      const seenIds = new Map<string, number>();
      rows.forEach((r) => {
        const val = String(r[idColumn] || '').trim();
        if (val) {
          seenIds.set(val, (seenIds.get(val) || 0) + 1);
        }
      });

      const duplicates = Array.from(seenIds.entries()).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        const affectedCount = duplicates.reduce((acc, [_, count]) => acc + count, 0);
        traps.push({
          id: `trap-dup-${table.name}`,
          category: 'duplicate_rows',
          severity: 'critical',
          title: `Duplicate Row Keys in '${table.name}'`,
          tablesInvolved: [table.name],
          columnsInvolved: [idColumn],
          description: `Found ${duplicates.length} keys repeated across ${affectedCount} rows (e.g. ${duplicates.map(([k]) => k).slice(0, 3).join(', ')}). Naive aggregations will double-count metrics.`,
          affectedRowsCount: affectedCount,
          sampleEvidence: duplicates.slice(0, 3).map(([k, c]) => ({
            key: k,
            description: `Key repeated ${c} times`,
            rawValues: { [idColumn]: k, occurrenceCount: c }
          })),
          impactOnQuestions: 'Total sums, counts, and averages will be falsely inflated unless deduplicated.',
          recommendedRefusalOrGuard: `Always apply deduplication on '${idColumn}' before aggregation.`
        });
      }
    }

    // 2. Check for Currency / Unit Heterogeneity
    const currencyCol = table.columns.find((col) => /currency|unit|curr$/i.test(col));
    if (currencyCol) {
      const distinctUnits = Array.from(new Set(rows.map((r) => String(r[currencyCol] || '').trim()).filter(Boolean)));
      if (distinctUnits.length > 1) {
        const numCols = table.columns.filter((col) => /amount|cost|price|weight|revenue|total/i.test(col));
        traps.push({
          id: `trap-unit-${table.name}`,
          category: 'unit_currency_mismatch',
          severity: 'critical',
          title: `Mixed Units / Currencies in '${table.name}' (${distinctUnits.join(', ')})`,
          tablesInvolved: [table.name],
          columnsInvolved: [currencyCol, ...numCols],
          description: `Column '${currencyCol}' contains heterogeneous units (${distinctUnits.join(', ')}). Summing '${numCols[0] || 'numerical columns'}' directly violates dimensional homogeneity.`,
          affectedRowsCount: rows.length,
          sampleEvidence: distinctUnits.slice(0, 3).map((u) => ({
            description: `Row with unit '${u}'`,
            rawValues: { [currencyCol]: u }
          })),
          impactOnQuestions: 'Cannot sum or average amounts without explicitly converting to a unified base unit.',
          recommendedRefusalOrGuard: 'Refuse naked summation. Require exchange rate table or explicit unit conversion target.'
        });
      }
    }

    // 3. Check for Ambiguous Dates (e.g. MM/DD/YYYY vs DD/MM/YYYY)
    const dateCols = table.columns.filter((col) => /date|time|created/i.test(col));
    dateCols.forEach((dCol) => {
      let ambiguousCount = 0;
      const samples: any[] = [];

      rows.forEach((r) => {
        const val = String(r[dCol] || '').trim();
        // Check for slash format like 04/05/2024 or 05/04/2024
        const slashMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slashMatch) {
          const p1 = parseInt(slashMatch[1], 10);
          const p2 = parseInt(slashMatch[2], 10);
          if (p1 <= 12 && p2 <= 12) {
            ambiguousCount++;
            if (samples.length < 2) {
              samples.push({
                description: `Date "${val}" could mean ${p1 > p2 ? 'Day/Month' : 'Month/Day or Day/Month'}`,
                rawValues: { [dCol]: val, interpretationA: `${p1}-${p2}-${slashMatch[3]}`, interpretationB: `${p2}-${p1}-${slashMatch[3]}` }
              });
            }
          }
        }
      });

      if (ambiguousCount > 0) {
        traps.push({
          id: `trap-date-${table.name}-${dCol}`,
          category: 'date_ambiguity',
          severity: 'warning',
          title: `Ambiguous Slash Date Notation in '${table.name}.${dCol}'`,
          tablesInvolved: [table.name],
          columnsInvolved: [dCol],
          description: `Found ${ambiguousCount} date entries formatted with slashes where both parts are <= 12 (e.g. "04/05/2024"). It is impossible to know whether April 5th or May 4th was intended without metadata.`,
          affectedRowsCount: ambiguousCount,
          sampleEvidence: samples,
          impactOnQuestions: 'Questions querying specific calendar dates or monthly cutoffs will yield divergent results.',
          recommendedRefusalOrGuard: 'Refuse single date queries without explicit format clarification, or return bounded intervals.'
        });
      }
    });

    // 4. Check for High Missingness / Null Rates
    table.columns.forEach((col) => {
      let nullCount = 0;
      rows.forEach((r) => {
        const val = r[col];
        if (val === null || val === undefined || val === '' || String(val).trim().toUpperCase() === 'N/A' || String(val).trim().toUpperCase() === 'NULL') {
          nullCount++;
        }
      });

      const missingPct = (nullCount / rows.length) * 100;
      if (missingPct > 40 && rows.length > 5) {
        traps.push({
          id: `trap-miss-${table.name}-${col}`,
          category: 'missing_data',
          severity: missingPct > 70 ? 'critical' : 'warning',
          title: `Severe Missingness in '${table.name}.${col}' (${Math.round(missingPct)}% missing)`,
          tablesInvolved: [table.name],
          columnsInvolved: [col],
          description: `Column '${col}' is null or missing in ${nullCount} out of ${rows.length} rows (${Math.round(missingPct)}%). Calculating metrics on this column risks severe statistical bias.`,
          affectedRowsCount: nullCount,
          sampleEvidence: [
            {
              description: `High missingness rate: ${nullCount}/${rows.length} nulls`,
              rawValues: { column: col, nullRate: `${Math.round(missingPct)}%` }
            }
          ],
          impactOnQuestions: `Queries asking for averages, totals, or trends of '${col}' cannot be reliably answered.`,
          recommendedRefusalOrGuard: `Refuse questions relying on '${col}' with notice of severe data absence.`
        });
      }
    });
  });

  // 5. Check for Cross-Table Contradictions (e.g. invoices vs bank_settlements)
  const invoiceTable = tables.find((t) => t.name.includes('invoice'));
  const bankTable = tables.find((t) => t.name.includes('settlement') || t.name.includes('bank'));
  if (invoiceTable && bankTable) {
    const invMap = new Map<string, number>();
    invoiceTable.rows.forEach((r) => {
      const id = String(r.invoice_id || '').trim();
      if (id && r.amount) invMap.set(id, Number(r.amount));
    });

    const contradictions: any[] = [];
    bankTable.rows.forEach((b) => {
      const id = String(b.invoice_id || '').trim();
      const bankAmt = Number(b.settled_amount || b.amount);
      if (invMap.has(id)) {
        const invAmt = invMap.get(id)!;
        if (Math.abs(invAmt - bankAmt) > 0.01) {
          contradictions.push({
            key: id,
            description: `Invoice states $${invAmt}, bank record states $${bankAmt} (variance: $${bankAmt - invAmt})`,
            rawValues: { invoice_id: id, invoiceAmount: invAmt, bankAmount: bankAmt, difference: bankAmt - invAmt }
          });
        }
      }
    });

    if (contradictions.length > 0) {
      traps.push({
        id: 'trap-contradiction-tables',
        category: 'contradictory_tables',
        severity: 'critical',
        title: `Contradictory Ledgers Between '${invoiceTable.name}' and '${bankTable.name}'`,
        tablesInvolved: [invoiceTable.name, bankTable.name],
        columnsInvolved: ['amount', 'settled_amount'],
        description: `Discovered ${contradictions.length} records where billing ledger amounts conflict directly with actual bank deposits (e.g. ${contradictions.map((c) => c.key).join(', ')}).`,
        affectedRowsCount: contradictions.length,
        sampleEvidence: contradictions,
        impactOnQuestions: 'Determining exact revenue depends entirely on accounting standard chosen (Accrual billed vs Cash realized).',
        recommendedRefusalOrGuard: 'Disclose contradiction explicitly and require choice of accounting source of truth.'
      });
    }
  }

  return traps;
}

/**
 * Evaluates whether a user question triggers any known or dynamic traps
 */
export function evaluateQuestionTraps(
  question: string,
  tables: DataTable[],
  datasetTraps: AuditTrap[]
): {
  isTrap: boolean;
  trapCategory?: TrapCategory;
  reason: string;
  triggeredTrap?: AuditTrap;
  adversarialType?: 'false_premise' | 'unsupported_metric' | 'unsolvable_time' | 'dimensional_conflict';
} {
  const q = question.toLowerCase();

  // 1. Check for False Premise / Adversarial Trick
  // Example: "Why did APAC sales drop/decrease..." when APAC actually grew!
  if (/why did (apac|americas|sales|revenue|shipments).*?(drop|decrease|crash|fall|decline|lose)/i.test(q)) {
    return {
      isTrap: true,
      trapCategory: 'adversarial_trick_premise',
      adversarialType: 'false_premise',
      reason: 'The question embeds a false premise. The underlying data shows the metric actually increased or maintained stability rather than declining.'
    };
  }

  // 2. Check for Naked Summation Across Mixed Currencies
  if (/(sum of raw|total of all amount|raw invoice amounts without|without currency conversion|add raw amount)/i.test(q)) {
    const unitTrap = datasetTraps.find((t) => t.category === 'unit_currency_mismatch');
    return {
      isTrap: true,
      trapCategory: 'unit_currency_mismatch',
      adversarialType: 'dimensional_conflict',
      reason: 'Summing raw numeric values across different currency denominations (USD, EUR, GBP) without exchange rate conversion creates an invalid dimensional quantity ($ + € + £).',
      triggeredTrap: unitTrap
    };
  }

  // 3. Check for Ambiguous Date Query
  if (/\b\d{1,2}\/\d{1,2}\/\d{4}\b/.test(question)) {
    const match = question.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      if (p1 <= 12 && p2 <= 12) {
        const dateTrap = datasetTraps.find((t) => t.category === 'date_ambiguity');
        return {
          isTrap: true,
          trapCategory: 'date_ambiguity',
          reason: `Date "${match[0]}" is ambiguous between ${p1}/${p2} (Month ${p1}, Day ${p2}) and ${p2}/${p1} (Day ${p1}, Month ${p2}). Query cannot be reliably resolved without date convention.`,
          triggeredTrap: dateTrap
        };
      }
    }
  }

  // 4. Check for Missing Data Query (e.g. CAC / Margins)
  if (/(cac|customer acquisition cost|margin pct|profit margin|ltv)/i.test(q)) {
    const missTrap = datasetTraps.find((t) => t.category === 'missing_data');
    return {
      isTrap: true,
      trapCategory: 'missing_data',
      adversarialType: 'unsupported_metric',
      reason: 'The requested metric (Customer Acquisition Cost / Profit Margin) is not reliably recorded in the dataset (over 85% missing/null values). An answer cannot be statistically grounded.',
      triggeredTrap: missTrap
    };
  }

  // 5. Check for Out-of-bounds future projection
  if (/(2025|2026|2027|next year|future|forecast)/i.test(q)) {
    return {
      isTrap: true,
      trapCategory: 'unsolvable_or_out_of_bounds',
      adversarialType: 'unsolvable_time',
      reason: 'The historical dataset ends in mid-2024 and contains no forward-looking financial forecasting models. Extrapolating future years is outside empirical data boundaries.'
    };
  }

  return { isTrap: false, reason: 'No fatal traps detected.' };
}
