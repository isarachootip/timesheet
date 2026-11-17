import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { aiHealthAnalysisSchema } from '../../schemas/projectHealthSchemas.js';
import { insertHealthSnapshot } from '../../repositories/projectHealthRepository.js';
import { calculateProjectHealth } from './projectHealthEngine.js';
import { buildProjectHealthAiContext } from './projectHealthContextBuilder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SYSTEM_PROMPT_PATH = path.resolve(
  __dirname,
  '../../prompts/projectHealthSystemPrompt.txt'
);

const GEMINI_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    root_causes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          priority: { type: SchemaType.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
          action: { type: SchemaType.STRING },
          expected_impact: { type: SchemaType.STRING },
        },
        required: ['priority', 'action', 'expected_impact'],
      },
    },
  },
  required: ['summary', 'root_causes', 'recommendations'],
};

const stripMarkdownFences = (rawText) => {
  const trimmed = String(rawText || '').trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
};

export const loadProjectHealthSystemPrompt = async (customPath = DEFAULT_SYSTEM_PROMPT_PATH) => {
  const content = await fs.readFile(customPath, 'utf8');
  if (!content.trim()) {
    throw new Error('Project health system prompt file is empty.');
  }
  return content.trim();
};

const createGeminiTextGenerator = (apiKey, modelName) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return async ({ systemPrompt, userMessage }) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: GEMINI_RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });
    const response = await model.generateContent(userMessage);
    return response.response.text();
  };
};

export const generateValidatedAiInsights = async (context, options = {}) => {
  const env = options.env || process.env;
  const apiKey = String(env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable for Project Health AI.');
  }

  const modelName = String(env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  const systemPrompt = await loadProjectHealthSystemPrompt(options.systemPromptPath);
  const generateText = options.generateText || createGeminiTextGenerator(apiKey, modelName);

  const baseUserMessage = `ข้อมูล Project Health Context (JSON):\n${JSON.stringify(context, null, 2)}`;
  let lastValidationError = '';

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const userMessage =
      attempt === 1
        ? baseUserMessage
        : `${baseUserMessage}\n\nคำตอบก่อนหน้าไม่ผ่านการตรวจสอบ Schema (${lastValidationError}) กรุณาตอบเป็น JSON Object ที่ครบถ้วนและถูกต้องตาม Schema เท่านั้น`;

    const rawText = await generateText({ systemPrompt, userMessage });
    let parsedJson;
    try {
      parsedJson = JSON.parse(stripMarkdownFences(rawText));
    } catch (parseErr) {
      lastValidationError = `Invalid JSON syntax: ${parseErr instanceof Error ? parseErr.message : 'parse error'}`;
      continue;
    }

    const validation = aiHealthAnalysisSchema.safeParse(parsedJson);
    if (validation.success) {
      return validation.data;
    }
    lastValidationError = validation.error.issues
      .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
      .join('; ');
  }

  throw new Error(`AI output failed JSON schema validation after retry: ${lastValidationError}`);
};

export const runProjectHealthAiForSnapshot = async (projectId, liveHealth, options = {}) => {
  const context = await buildProjectHealthAiContext(projectId, liveHealth, options);
  return generateValidatedAiInsights(context, options);
};

export const analyzeProjectHealth = async (projectId, options = {}) => {
  const db = options.db || (await import('../../config/db.js')).pool;
  const referenceDate = options.referenceDate || new Date();
  const liveHealth =
    options.precomputedHealth ||
    (await calculateProjectHealth(projectId, { db, referenceDate, config: options.config }));

  let aiAnalysis = null;
  let aiError = null;
  try {
    aiAnalysis = await runProjectHealthAiForSnapshot(projectId, liveHealth, {
      ...options,
      db,
      referenceDate,
    });
  } catch (err) {
    aiError = err instanceof Error ? err.message : 'AI analysis failed.';
  }

  if (options.persistSnapshot !== false) {
    await insertHealthSnapshot(db, {
      ...liveHealth,
      aiAnalysis,
      aiAnalyzedAt: aiAnalysis ? liveHealth.calculatedAt : null,
      triggerSource: 'manual_analyze',
    });
  }

  return {
    ...liveHealth,
    aiAnalysis,
    aiAnalyzedAt: aiAnalysis ? liveHealth.calculatedAt : null,
    aiError,
  };
};
