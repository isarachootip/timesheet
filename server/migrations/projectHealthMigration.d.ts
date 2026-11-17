export interface MigrationQueryClient {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
}

export function runProjectHealthMigration(client: MigrationQueryClient): Promise<void>;
