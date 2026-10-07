import { Dataset } from '../types/data-analyst';

export const MOCK_DATASETS: Dataset[] = [
  {
    id: 'saas_ledger_reconciliation',
    title: 'Global SaaS Multi-Currency & Ledger Audit',
    description: 'Messy enterprise SaaS billing with duplicate submissions, mixed currencies (USD/EUR/GBP), ambiguous date formats, and conflicting bank settlements.',
    category: 'Finance & Billing',
    knownTraps: [
      {
        id: 'trap-1',
        category: 'duplicate_rows',
        severity: 'critical',
        title: 'Duplicate Invoice Submissions',
        tablesInvolved: ['raw_invoices'],
        columnsInvolved: ['invoice_id', 'created_at'],
        description: 'Invoice INV-1002 and INV-1008 appear twice due to retry clicks on network timeout. Summing without deduplication inflates revenue by $46,200.',
        affectedRowsCount: 3,
        sampleEvidence: [
          {
            key: 'INV-1002',
            description: 'Duplicate transaction recorded 2 seconds apart with identical customer and amount',
            rawValues: { invoice_id: 'INV-1002', customer: 'Acme Corp', amount: 24200, currency: 'USD' }
          }
        ],
        impactOnQuestions: 'Any aggregate revenue or invoice count must be deduplicated by invoice_id.',
        recommendedRefusalOrGuard: 'Enforce deduplication on invoice_id keeping the canonical record or flag duplicates.'
      },
      {
        id: 'trap-2',
        category: 'unit_currency_mismatch',
        severity: 'critical',
        title: 'Mixed Currency Without In-Row Normalization',
        tablesInvolved: ['raw_invoices', 'fx_rates'],
        columnsInvolved: ['amount', 'currency'],
        description: 'Amounts in raw_invoices contain USD, EUR, and GBP. Adding raw numbers directly results in meaningless dimensional addition ($ + € + £).',
        affectedRowsCount: 24,
        sampleEvidence: [
          {
            description: 'INV-1003 is €18,500 while INV-1001 is $35,000',
            rawValues: { invoice_id: 'INV-1003', amount: 18500, currency: 'EUR' }
          }
        ],
        impactOnQuestions: 'Asking "What is total sales amount?" without specifying target currency or FX conversion date is invalid.',
        recommendedRefusalOrGuard: 'Refuse naked raw summation; require conversion to unified base currency using daily fx_rates.'
      },
      {
        id: 'trap-3',
        category: 'date_ambiguity',
        severity: 'warning',
        title: 'Ambiguous Slash Dates (DD/MM/YYYY vs MM/DD/YYYY)',
        tablesInvolved: ['raw_invoices'],
        columnsInvolved: ['invoice_date'],
        description: 'Dates like "04/05/2024" and "06/07/2024" cannot be reliably parsed without knowing locale (April 5th vs May 4th).',
        affectedRowsCount: 8,
        sampleEvidence: [
          {
            key: 'INV-1005',
            description: 'Invoice date is recorded as "04/05/2024" while EMEA invoices use "05/04/2024"',
            rawValues: { invoice_id: 'INV-1005', invoice_date: '04/05/2024' }
          }
        ],
        impactOnQuestions: 'Monthly breakdown questions (e.g. April revenue) diverge wildly based on parsing convention.',
        recommendedRefusalOrGuard: 'Flag date ambiguity; refuse single deterministic answer unless convention is clarified or provide both bounds.'
      },
      {
        id: 'trap-4',
        category: 'contradictory_tables',
        severity: 'critical',
        title: 'Bank Settlement Contradicts Billed Invoice',
        tablesInvolved: ['raw_invoices', 'bank_settlements'],
        columnsInvolved: ['amount', 'settled_amount', 'status'],
        description: 'INV-1004 shows $45,000 marked as "PAID" in raw_invoices, but bank_settlements proves only $32,000 was settled due to an unresolved chargeback.',
        affectedRowsCount: 2,
        sampleEvidence: [
          {
            key: 'INV-1004',
            description: 'Invoice ledger claims $45,000 settled, bank statement shows $32,000 deposit',
            rawValues: { invoice_amount: 45000, bank_deposit: 32000, difference: -13000 }
          }
        ],
        impactOnQuestions: 'Questions asking "How much cash did we collect?" cannot be answered from invoices alone.',
        recommendedRefusalOrGuard: 'Must disclose cross-table discrepancy or refuse unqualified cash reconciliation.'
      },
      {
        id: 'trap-5',
        category: 'missing_data',
        severity: 'warning',
        title: 'Missing Customer Acquisition Cost (CAC) & Null Margins',
        tablesInvolved: ['raw_invoices'],
        columnsInvolved: ['customer_acquisition_cost', 'margin_pct'],
        description: 'The column customer_acquisition_cost is 88% NULL; margin_pct has corrupt string entries ("N/A", null, "").',
        affectedRowsCount: 21,
        sampleEvidence: [
          {
            description: 'CAC recorded for only 3 out of 24 enterprise contracts',
            rawValues: { invoice_id: 'INV-1006', cac: null, margin_pct: 'N/A' }
          }
        ],
        impactOnQuestions: 'Cannot calculate ROI, LTV/CAC, or Net Profit Margin from this dataset.',
        recommendedRefusalOrGuard: 'Refuse queries asking for CAC or profit margins due to missing data.'
      }
    ],
    tables: [
      {
        name: 'raw_invoices',
        description: 'Raw transactions exported from ERP. Contains duplicate clicks, whitespace, and mixed currencies.',
        columns: ['invoice_id', 'customer', 'region', 'invoice_date', 'amount', 'currency', 'status', 'customer_acquisition_cost'],
        rows: [
          { invoice_id: 'INV-1001', customer: 'Apex Global', region: 'Americas', invoice_date: '2024-01-15', amount: 35000, currency: 'USD', status: 'PAID', customer_acquisition_cost: 4200 },
          { invoice_id: 'INV-1002', customer: 'Acme Corp', region: 'Americas', invoice_date: '2024-01-20', amount: 24200, currency: 'USD', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1002', customer: 'Acme Corp', region: 'Americas', invoice_date: '2024-01-20', amount: 24200, currency: 'USD', status: 'PAID', customer_acquisition_cost: null }, // DUPLICATE
          { invoice_id: 'INV-1003', customer: 'Berlin Cloud GmbH', region: 'EMEA', invoice_date: '2024-02-04', amount: 18500, currency: 'EUR', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1004', customer: 'Titan Logistics', region: 'Americas', invoice_date: '2024-02-12', amount: 45000, currency: 'USD', status: 'PAID', customer_acquisition_cost: 5100 }, // CONTRADICTS BANK
          { invoice_id: 'INV-1005', customer: 'Vortex Tech', region: 'Americas', invoice_date: '04/05/2024', amount: 14000, currency: 'USD', status: 'PAID', customer_acquisition_cost: null }, // AMBIGUOUS DATE
          { invoice_id: 'INV-1006', customer: 'Nordic Retail AS', region: 'EMEA', invoice_date: '2024-03-01', amount: 22000, currency: 'EUR', status: 'DISPUTED', customer_acquisition_cost: null },
          { invoice_id: 'INV-1007', customer: 'London Media Ltd', region: 'EMEA', invoice_date: '2024-03-14', amount: 12500, currency: 'GBP', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1008', customer: 'Tokyo Robotics', region: 'APAC', invoice_date: '2024-03-25', amount: 22000, currency: 'USD', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1008', customer: 'Tokyo Robotics', region: 'APAC', invoice_date: '2024-03-25', amount: 22000, currency: 'USD', status: 'PAID', customer_acquisition_cost: null }, // DUPLICATE
          { invoice_id: 'INV-1009', customer: 'Kyoto Labs', region: 'APAC', invoice_date: '2024-04-02', amount: 31000, currency: 'USD', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1010', customer: 'Paris Health SA', region: 'EMEA', invoice_date: '05/06/2024', amount: 26000, currency: 'EUR', status: 'PAID', customer_acquisition_cost: null }, // AMBIGUOUS DATE
          { invoice_id: 'INV-1011', customer: 'Delta Energy', region: 'Americas', invoice_date: '2024-04-18', amount: 52000, currency: 'USD', status: 'PAID', customer_acquisition_cost: 6000 },
          { invoice_id: 'INV-1012', customer: 'Zurich FinServices', region: 'EMEA', invoice_date: '2024-05-10', amount: 41000, currency: 'EUR', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1013', customer: 'Sydney Maritime', region: 'APAC', invoice_date: '2024-05-22', amount: 19500, currency: 'USD', status: 'PENDING', customer_acquisition_cost: null },
          { invoice_id: 'INV-1014', customer: 'Austin Semiconductor', region: 'Americas', invoice_date: '2024-06-05', amount: 64000, currency: 'USD', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1015', customer: 'Manchester AI', region: 'EMEA', invoice_date: '2024-06-12', amount: 16000, currency: 'GBP', status: 'PAID', customer_acquisition_cost: null },
          { invoice_id: 'INV-1016', customer: 'Singapore Bio', region: 'APAC', invoice_date: '2024-06-28', amount: 38000, currency: 'USD', status: 'PAID', customer_acquisition_cost: null }
        ]
      },
      {
        name: 'bank_settlements',
        description: 'Official bank statement deposits. Real cash received after merchant processor fees and chargebacks.',
        columns: ['settlement_id', 'invoice_id', 'settled_date', 'settled_amount', 'bank_currency', 'notes'],
        rows: [
          { settlement_id: 'SET-901', invoice_id: 'INV-1001', settled_date: '2024-01-18', settled_amount: 35000, bank_currency: 'USD', notes: 'Cleared' },
          { settlement_id: 'SET-902', invoice_id: 'INV-1002', settled_date: '2024-01-22', settled_amount: 24200, bank_currency: 'USD', notes: 'Cleared single payment' },
          { settlement_id: 'SET-903', invoice_id: 'INV-1003', settled_date: '2024-02-07', settled_amount: 18500, bank_currency: 'EUR', notes: 'SEPA deposit' },
          { settlement_id: 'SET-904', invoice_id: 'INV-1004', settled_date: '2024-02-16', settled_amount: 32000, bank_currency: 'USD', notes: 'CONTRADICTION: Customer withheld $13,000 for SLA dispute' },
          { settlement_id: 'SET-905', invoice_id: 'INV-1005', settled_date: '2024-05-08', settled_amount: 14000, bank_currency: 'USD', notes: 'Cleared' },
          { settlement_id: 'SET-906', invoice_id: 'INV-1007', settled_date: '2024-03-18', settled_amount: 12500, bank_currency: 'GBP', notes: 'BACS transfer' },
          { settlement_id: 'SET-907', invoice_id: 'INV-1008', settled_date: '2024-03-28', settled_amount: 22000, bank_currency: 'USD', notes: 'Single payment received' },
          { settlement_id: 'SET-908', invoice_id: 'INV-1009', settled_date: '2024-04-05', settled_amount: 31000, bank_currency: 'USD', notes: 'Cleared' },
          { settlement_id: 'SET-909', invoice_id: 'INV-1011', settled_date: '2024-04-22', settled_amount: 52000, bank_currency: 'USD', notes: 'Wire transfer' },
          { settlement_id: 'SET-910', invoice_id: 'INV-1012', settled_date: '2024-05-15', settled_amount: 41000, bank_currency: 'EUR', notes: 'SEPA deposit' },
          { settlement_id: 'SET-911', invoice_id: 'INV-1014', settled_date: '2024-06-08', settled_amount: 64000, bank_currency: 'USD', notes: 'Wire transfer' },
          { settlement_id: 'SET-912', invoice_id: 'INV-1015', settled_date: '2024-06-15', settled_amount: 16000, bank_currency: 'GBP', notes: 'Cleared' },
          { settlement_id: 'SET-913', invoice_id: 'INV-1016', settled_date: '2024-07-02', settled_amount: 38000, bank_currency: 'USD', notes: 'Cleared' }
        ]
      },
      {
        name: 'fx_rates',
        description: 'Historical currency conversion multipliers to USD (1 unit of currency = X USD).',
        columns: ['currency', 'usd_rate', 'effective_quarter', 'source'],
        rows: [
          { currency: 'USD', usd_rate: 1.000, effective_quarter: '2024-ALL', source: 'Base' },
          { currency: 'EUR', usd_rate: 1.085, effective_quarter: '2024-Q1/Q2', source: 'ECB Daily' },
          { currency: 'GBP', usd_rate: 1.272, effective_quarter: '2024-Q1/Q2', source: 'Bank of England' }
        ]
      }
    ],
    documents: [
      {
        name: 'contracts_and_rebates.md',
        title: 'Master Enterprise Rebate & Accounting Policies 2024',
        content: `# Enterprise Rebate & Accounting Policies (FY2024)
1. **EMEA Tier-2 Volume Rebates**:
   - Customers in the EMEA region receive an automatic retroactive rebate of 5% on invoices exceeding €20,000, provided their status is 'PAID'.
   - Disputed invoices (status = 'DISPUTED') are excluded from all rebate calculations until mediation completes.

2. **Revenue Recognition**:
   - Only invoices with status 'PAID' may be counted towards recognized revenue.
   - Pending invoices ('PENDING') represent non-guaranteed pipeline commitments.

3. **Discrepancy Protocol**:
   - In any audit where the billing ledger contradicts the bank statement (e.g. partial withholding or chargeback), the **Bank Settlement** takes precedence as the sole proof of realized cash.`
      }
    ],
    sampleQuestions: [
      {
        question: 'What is the total USD revenue from completed PAID invoices after deduplicating invoice IDs?',
        expectedOutcome: 'solvable',
        trapType: 'duplicate_rows',
        explanation: 'Solvable: Must deduplicate by invoice_id, filter status == "PAID", convert EUR and GBP using fx_rates.'
      },
      {
        question: 'What is the sum of raw invoice amounts without currency conversion?',
        expectedOutcome: 'refusal',
        trapType: 'unit_currency_mismatch',
        explanation: 'MUST REFUSE: Summing raw EUR, GBP, and USD numbers without conversion produces a meaningless dimensional quantity.'
      },
      {
        question: 'How much revenue was generated on 04/05/2024?',
        expectedOutcome: 'refusal',
        trapType: 'date_ambiguity',
        explanation: 'MUST REFUSE or flag ambiguity: 04/05/2024 is ambiguous between April 5 and May 4 in international vs US notation.'
      },
      {
        question: 'What is the verified realized cash for invoice INV-1004 between invoices and bank records?',
        expectedOutcome: 'conditional',
        trapType: 'contradictory_tables',
        explanation: 'Contradiction trap: raw_invoices says $45,000, but bank_settlements proves only $32,000 was collected due to an SLA dispute.'
      },
      {
        question: 'What is our average Customer Acquisition Cost (CAC) across all customers?',
        expectedOutcome: 'refusal',
        trapType: 'missing_data',
        explanation: 'MUST REFUSE: 88% of CAC data is missing/null, making an average statistically invalid and deceptive.'
      },
      {
        question: 'Why did APAC regional sales decrease by 40% between Q1 and Q2?',
        expectedOutcome: 'refusal',
        trapType: 'adversarial_trick_premise',
        explanation: 'MUST REFUSE / REBUT: False premise! APAC sales actually increased (INV-1008 in March: $22k; INV-1009, 1013, 1016 in Q2: $88.5k). Do not invent an excuse.'
      }
    ]
  },
  {
    id: 'logistics_supply_chain',
    title: 'Cross-Border Logistics & Customs Manifests',
    description: 'International freight records with mixed weight units (kg vs lbs in same column), duplicate tracking scans, and missing customs clearance codes.',
    category: 'Supply Chain & Logistics',
    knownTraps: [
      {
        id: 'trap-log-1',
        category: 'unit_currency_mismatch',
        severity: 'critical',
        title: 'Mixed Mass Units (kg vs lbs) in Single Column',
        tablesInvolved: ['freight_shipments'],
        columnsInvolved: ['weight_value', 'weight_unit'],
        description: 'Some shipments record weight in kilograms (kg) while US routes record pounds (lbs). Adding weight_value directly without converting lbs to kg (1 lb = 0.453592 kg) is corrupt.',
        affectedRowsCount: 15,
        sampleEvidence: [
          {
            key: 'SHP-301',
            description: 'Weight is 450 kg vs SHP-302 weight 992 lbs',
            rawValues: { shipment_id: 'SHP-301', weight_value: 450, weight_unit: 'kg' }
          }
        ],
        impactOnQuestions: 'Total freight weight queries will fail if units are not unified.',
        recommendedRefusalOrGuard: 'Enforce unit normalization to kilograms or pounds before any aggregation.'
      },
      {
        id: 'trap-log-2',
        category: 'duplicate_rows',
        severity: 'warning',
        title: 'Checkpoint Re-Scans',
        tablesInvolved: ['freight_shipments'],
        columnsInvolved: ['tracking_no', 'status'],
        description: 'Tracking numbers scanned at intermediate transit hubs appear as duplicate entries.',
        affectedRowsCount: 4,
        sampleEvidence: [
          {
            key: 'TRK-9811',
            description: 'Same tracking code scanned at Hamburg and Rotterdam with same payload',
            rawValues: { tracking_no: 'TRK-9811', destination: 'Rotterdam' }
          }
        ],
        impactOnQuestions: 'Shipment count and distinct package count diverge.',
        recommendedRefusalOrGuard: 'Deduplicate on unique package tracking_no.'
      }
    ],
    tables: [
      {
        name: 'freight_shipments',
        description: 'Manifest of international cargo dispatches.',
        columns: ['shipment_id', 'tracking_no', 'origin', 'destination', 'weight_value', 'weight_unit', 'freight_cost_usd', 'status'],
        rows: [
          { shipment_id: 'SHP-301', tracking_no: 'TRK-9810', origin: 'Shanghai', destination: 'Rotterdam', weight_value: 450, weight_unit: 'kg', freight_cost_usd: 1200, status: 'DELIVERED' },
          { shipment_id: 'SHP-302', tracking_no: 'TRK-9811', origin: 'Chicago', destination: 'Frankfurt', weight_value: 992, weight_unit: 'lbs', freight_cost_usd: 1450, status: 'DELIVERED' },
          { shipment_id: 'SHP-303', tracking_no: 'TRK-9811', origin: 'Chicago', destination: 'Frankfurt', weight_value: 992, weight_unit: 'lbs', freight_cost_usd: 1450, status: 'DELIVERED' }, // DUPLICATE SCAN
          { shipment_id: 'SHP-304', tracking_no: 'TRK-9812', origin: 'Yokohama', destination: 'Long Beach', weight_value: 620, weight_unit: 'kg', freight_cost_usd: 1800, status: 'DELIVERED' },
          { shipment_id: 'SHP-305', tracking_no: 'TRK-9813', origin: 'Miami', destination: 'Santos', weight_value: 1200, weight_unit: 'lbs', freight_cost_usd: 2100, status: 'IN_TRANSIT' },
          { shipment_id: 'SHP-306', tracking_no: 'TRK-9814', origin: 'Singapore', destination: 'Dubai', weight_value: 380, weight_unit: 'kg', freight_cost_usd: 950, status: 'DELIVERED' }
        ]
      }
    ],
    documents: [
      {
        name: 'customs_standard.md',
        title: 'Air & Maritime Freight Metric Standards',
        content: `# Standard Metric Protocols
All maritime and air cargo declarations must standardize payload mass in Kilograms (kg).
Conversion formula: 1 pound (lb) = 0.45359237 kg.`
      }
    ],
    sampleQuestions: [
      {
        question: 'What is the total cargo weight in kilograms (kg) for delivered shipments after deduplication?',
        expectedOutcome: 'solvable',
        trapType: 'unit_currency_mismatch',
        explanation: 'Solvable: Deduplicate by tracking_no, filter DELIVERED, convert lbs to kg, and sum.'
      },
      {
        question: 'What is the average freight weight by just taking the mean of weight_value?',
        expectedOutcome: 'refusal',
        trapType: 'unit_currency_mismatch',
        explanation: 'MUST REFUSE: Averaging un-normalized kg and lbs numbers is invalid physics.'
      }
    ]
  }
];
