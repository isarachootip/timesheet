import type { AiHealthAnalysis } from '../../schemas/projectHealthSchemas.js';
import type { DbQueryable, ProjectHealthConfigOverrides, ProjectHealthResult } from './projectHealthEngine.js';

export interface GenerateAiInsightsOptions {
  env?: Record<string, string | undefined>;
  systemPromptPath?: string;
  generateText?: (args: { systemPrompt: string; userMessage: string }) => Promise<string>;
}

export interface AnalyzeProjectHealthOptions extends GenerateAiInsightsOptions {
  db?: DbQueryable;
  referenceDate?: Date | string;
  config?: ProjectHealthConfigOverrides;
  precomputedHealth?: ProjectHealthResult;
  persistSnapshot?: boolean;
}

export interface AnalyzeProjectHealthResponse extends ProjectHealthResult {
  aiAnalysis: AiHealthAnalysis | null;
  aiAnalyzedAt: string | null;
  aiError: string | null;
}

export function loadProjectHealthSystemPrompt(customPath?: string): Promise<string>;

export function generateValidatedAiInsights(
  context: Record<string, unknown>,
  options?: GenerateAiInsightsOptions
): Promise<AiHealthAnalysis>;

export function runProjectHealthAiForSnapshot(
  projectId: string,
  liveHealth: ProjectHealthResult,
  options?: AnalyzeProjectHealthOptions
): Promise<AiHealthAnalysis>;

export function analyzeProjectHealth(
  projectId: string,
  options?: AnalyzeProjectHealthOptions
): Promise<AnalyzeProjectHealthResponse>;
