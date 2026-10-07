import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

const PORT = 3000;

// Initialize server-side Gemini client if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Sandbox execution helper on server
function runServerSandbox(code: string, tables: Record<string, any[]>) {
  const startTime = Date.now();
  const stdout: string[] = [];

  const isolatedTables = JSON.parse(JSON.stringify(tables || {}));
  const customConsole = {
    log: (...args: any[]) => {
      stdout.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    warn: (...args: any[]) => {
      stdout.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    error: (...args: any[]) => {
      stdout.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    }
  };

  try {
    const wrappedCode = `
      "use strict";
      return (function(tables, console) {
        ${code}
      })(isolatedTables, customConsole);
    `;
    const runner = new Function('isolatedTables', 'customConsole', wrappedCode);
    const output = runner(isolatedTables, customConsole);
    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      output,
      stdout,
      executionTimeMs
    };
  } catch (err: any) {
    return {
      success: false,
      output: null,
      stdout,
      executionTimeMs: Date.now() - startTime,
      error: err?.message || String(err)
    };
  }
}

// API: Code Execution Sandbox
app.post('/api/sandbox/run', (req: Request, res: Response) => {
  const { code, tables } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  const result = runServerSandbox(code, tables || {});
  return res.json(result);
});

// API: Agent Query with Gemini 3.8 Flash
app.post('/api/agent/query', async (req: Request, res: Response) => {
  const { question, tables, documents, strictMode } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // If Gemini API is configured, use Gemini 3.8 Flash
  if (ai) {
    try {
      const systemInstruction = `You are a world-class Proof-Carrying Data Analyst agent.
CRITICAL RULES YOU MUST OBEY:
1. Every numerical answer MUST come with working executable JavaScript code that receives 'tables' (Record<string, any[]>) and 'console' and returns the exact number.
2. If code doesn't run or gives a different answer, you fail completely (score 0).
3. KNOW WHEN TO SAY NO:
   - If units don't match (e.g. $ + € + £ without exchange rates), you MUST refuse: "I cannot determine this from the data".
   - If dates are ambiguous (e.g. 04/05/2024 with no locale convention), you MUST refuse.
   - If tables contradict each other (e.g. invoices vs bank settlement), you MUST refuse or state the contradiction clearly.
   - If rows are duplicated, you MUST write deduplication logic in your code.
   - If data is missing (>50% nulls), you MUST refuse.
   - If the question is designed to trick you or has a false premise (e.g. asking why sales dropped when they grew), you MUST refuse and rebut the false premise.
   - Confident wrong answers are penalized far worse than refusal.
4. Output valid JSON adhering to the required schema. In status: 'answered_verified' or 'refused_unanswerable'.`;

      const prompt = `Data Tables Available:
${JSON.stringify(tables, null, 2).slice(0, 8000)}

Documents Available:
${JSON.stringify(documents || []).slice(0, 3000)}

User Question: "${question}"
Strict Epistemic Mode: ${strictMode ? 'ACTIVE (Refuse if any ambiguity exists)' : 'PERMISSIVE'}

Analyze the question and data carefully. If any trap exists, refuse and provide programmatic proof. If solvable, synthesize deterministic JavaScript code that handles deduplication and units, and return the primary answer.`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "'answered_verified' or 'refused_unanswerable'"
              },
              summary: { type: Type.STRING },
              primaryAnswer: { type: Type.STRING },
              refusalReason: { type: Type.STRING },
              generatedCode: {
                type: Type.STRING,
                description: "Executable JavaScript snippet returning the calculated answer"
              },
              codeExplanation: { type: Type.STRING },
              assumptionsRequired: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['status', 'summary', 'generatedCode', 'codeExplanation']
          }
        }
      });

      const parsed = JSON.parse(geminiRes.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini API call failed, delegating to client fallback:', err);
      return res.status(500).json({ error: 'Gemini inference failed', details: err?.message });
    }
  }

  // If no Gemini API key configured on server, return 404 so client executes local deterministic agent
  return res.status(404).json({ error: 'GEMINI_API_KEY not configured, using local deterministic engine' });
});

// Setup Vite in Dev or serve static in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proof-Carrying Data Analyst server listening on port ${PORT}`);
  });
}

startServer();
