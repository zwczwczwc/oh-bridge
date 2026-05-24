import { describe, it, expect } from "vitest";
import { registerTools } from "../src/index.js";

describe("registerTools", () => {
  it("returns exactly 5 tools", () => {
    const tools = registerTools();
    expect(tools).toHaveLength(5);
  });

  it("all tools have required fields", () => {
    const tools = registerTools();
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.label).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(tool.execute).toBeInstanceOf(Function);
    }
  });

  it("includes all expected tool names", () => {
    const tools = registerTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "hermes_capabilities",
      "hermes_enqueue",
      "hermes_execute",
      "hermes_profiles",
      "hermes_swarm",
    ]);
  });
});