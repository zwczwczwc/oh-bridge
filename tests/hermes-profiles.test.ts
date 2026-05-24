import { describe, it, expect } from "vitest";
import { createHermesProfilesTool } from "../src/tools/hermes-profiles.js";
import { createHermesCapabilitiesTool } from "../src/tools/hermes-capabilities.js";

describe("createHermesProfilesTool", () => {
  it("returns a tool with correct name", () => {
    const tool = createHermesProfilesTool();
    expect(tool.name).toBe("hermes_profiles");
  });

  it("executes and returns profiles", async () => {
    const tool = createHermesProfilesTool();
    const result = await tool.execute("test", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.profiles).toBeInstanceOf(Array);
    expect(data.profiles.length).toBeGreaterThanOrEqual(4);
    expect(["live", "builtin_fallback"]).toContain(data.source);
  });
});

describe("createHermesCapabilitiesTool", () => {
  it("returns a tool with correct name", () => {
    const tool = createHermesCapabilitiesTool();
    expect(tool.name).toBe("hermes_capabilities");
  });

  it("executes and returns capabilities for default profile", async () => {
    const tool = createHermesCapabilitiesTool();
    const result = await tool.execute("test", {});
    const data = JSON.parse(result.content[0].text);
    expect(data.profile).toBe("default");
    expect(data.capabilities).toBeInstanceOf(Array);
    expect(data.capabilities.length).toBeGreaterThan(0);
  });

  it("returns capabilities for specific profile", async () => {
    const tool = createHermesCapabilitiesTool();
    const result = await tool.execute("test", { profile: "coder" });
    const data = JSON.parse(result.content[0].text);
    expect(data.profile).toBe("coder");
    expect(data.capabilities).toContain("code_generation");
  });
});