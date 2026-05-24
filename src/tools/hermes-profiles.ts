import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";
import { getProfiles, hermesVersionAvailable, type ProfileInfo } from "../helpers/hermes-cli.js";

export function createHermesProfilesTool(): AnyAgentTool {
  return {
    name: "hermes_profiles",
    label: "Hermes Profiles",
    description: "List available Hermes profiles. Falls back to built-in defaults if hermes CLI is unavailable.",
    parameters: Type.Object({}),
    execute: async () => {
      const liveAvailable = hermesVersionAvailable();
      const profiles: ProfileInfo[] = getProfiles();
      return jsonResult({
        source: liveAvailable ? "live" : "builtin_fallback",
        profiles: profiles.map((p) => ({
          name: p.name,
          description: p.description ?? "",
        })),
      });
    },
  };
}