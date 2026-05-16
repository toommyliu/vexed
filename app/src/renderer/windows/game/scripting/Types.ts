export type ScriptDiagnosticSeverity = "info" | "warning" | "error";

export interface ScriptDiagnostic {
  readonly id: number;
  readonly sourceName: string;
  readonly command?: string;
  readonly instructionIndex?: number;
  readonly severity: ScriptDiagnosticSeverity;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
}

export interface ScriptDiagnosticInput {
  readonly command?: string;
  readonly instructionIndex?: number;
  readonly severity: ScriptDiagnosticSeverity;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}
