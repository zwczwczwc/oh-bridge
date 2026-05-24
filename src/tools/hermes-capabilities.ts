import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";
import { getAllProfilesForCapabilities } from "../helpers/hermes-cli.js";

export function createHermesCapabilitiesTool(): AnyAgentTool {
  return {
    name: "hermes_capabilities",
    label: "Hermes Capabilities",
    description:
      "Query capabilities for a Hermes profile (built-in capability table).",
    parameters: Type.Object({
      profile: Type.Optional(Type.String({ default: "default" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const profile = (params.profile as string) ?? "default";
      const all = getAllProfilesForCapabilities();
      return jsonResult({
        profile,
        capabilities: all[profile] ?? all["default"] ?? [],
        all_profiles: Object.keys(all),
      });
    },
  };
}