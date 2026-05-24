import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";
import { executeOneshot, resolveWorkspacePath } from "../helpers/oneshot-runner.js";

export function createHermesExecuteTool(): AnyAgentTool {
  return {
    name: "hermes_execute",
    label: "Hermes Execute",
    description:
      "Spawn a Hermes agent via oneshot mode (-z) to execute a single task. " +
      "Blocks the current turn until Hermes completes. " +
      "Use ONLY within a Hermes Relay Agent to avoid freezing the main Orchestrator turn.",
    parameters: Type.Object({
      goal: Type.String({ description: "What the Hermes agent should accomplish" }),
      profile: Type.Optional(Type.String({ default: "default" })),
      context: Type.Optional(Type.String({ description: "Optional task context" })),
      toolsets: Type.Optional(
        Type.String({
          description: "Comma-separated toolset names. Use 'moa' to enable Mixture-of-Agents.",
        }),
      ),
      model: Type.Optional(Type.String({ description: "Model override, e.g. 'anthropic/claude-opus-4-6'" })),
      timeout_seconds: Type.Optional(
        Type.Number({ minimum: 30, maximum: 3600, default: 600 }),
      ),
      workspace_path: Type.Optional(Type.String()),
    }),
    execute: async (_toolCallId, args, signal) => {
      const params = args as Record<string, unknown>;
      const goal = readStringParam(params, "goal", { required: true })!;
      const profile = readStringParam(params, "profile") ?? "default";
      const context = readStringParam(params, "context");
      const startTime = Date.now();

      const prompt = context ? `## Task\n${goal}\n\n## Context\n${context}` : goal;

      const result = await executeOneshot({
        prompt,
        profile,
        toolsets: readStringParam(params, "toolsets"),
        model: readStringParam(params, "model"),
        cwd: resolveWorkspacePath(readStringParam(params, "workspace_path")),
        timeoutMs: ((params.timeout_seconds as number) ?? 600) * 1000,
        signal,
      });

      return jsonResult({
        status: result.cancelled
          ? "cancelled"
          : result.timedOut
            ? "timeout"
            : result.exitCode === 0
              ? "success"
              : "partial",
        summary: result.stdout.slice(0, 500),
        output: result.stdout.slice(0, 10000),
        metrics: {
          duration_seconds: Math.round((Date.now() - startTime) / 10) / 100,
        },
        errors: result.stderr ? [result.stderr.slice(0, 1000)] : [],
        exit_code: result.exitCode,
      });
    },
  };
}