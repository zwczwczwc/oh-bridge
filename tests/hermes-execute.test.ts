import { describe, it, expect } from "vitest";
import { createHermesExecuteTool } from "../src/tools/hermes-execute.js";

describe("createHermesExecuteTool", () => {
  it("returns a tool with correct name and parameters", () => {
    const tool = createHermesExecuteTool();
    expect(tool.name).toBe("hermes_execute");
    expect(tool.label).toBe("Hermes Execute");
    expect(tool.parameters).toBeDefined();
    expect(tool.execute).toBeInstanceOf(Function);
  });
});