import type { TSchema } from "typebox";

// ── Minimal local type shims matching @earendil-works/pi-agent-core ──

export type AgentToolResult<TDetails = unknown> = {
  content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>;
  details?: TDetails;
};

export type AgentTool<TParameters extends TSchema, TResult> = {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly parameters: TParameters;
  execute(
    toolCallId: string,
    params: unknown,
    signal?: AbortSignal,
  ): Promise<AgentToolResult<TResult>>;
};

export type AnyAgentTool = AgentTool<TSchema, unknown> & {
  ownerOnly?: boolean;
  displaySummary?: string;
};

// ── Helpers ──

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolInputError";
  }
}

export function readStringParam(
  params: Record<string, unknown>,
  key: string,
  options: { required: true; label?: string },
): string;
export function readStringParam(
  params: Record<string, unknown>,
  key: string,
  options?: { required?: boolean; label?: string },
): string | undefined;
export function readStringParam(
  params: Record<string, unknown>,
  key: string,
  options: { required?: boolean; label?: string } = {},
): string | undefined {
  const { required = false, label = key } = options;
  const raw = params[key];
  if (typeof raw !== "string") {
    if (required) throw new ToolInputError(`${label} required`);
    return undefined;
  }
  const value = raw.trim();
  if (!value) {
    if (required) throw new ToolInputError(`${label} required`);
    return undefined;
  }
  return value;
}

export function jsonResult(payload: unknown): AgentToolResult<unknown> {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    details: payload,
  };
}