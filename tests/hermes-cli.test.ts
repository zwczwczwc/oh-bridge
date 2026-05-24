import { describe, it, expect } from "vitest";
import { getProfiles, getProfileCapabilities, getAllProfilesForCapabilities } from "../src/helpers/hermes-cli.js";

describe("getProfiles", () => {
  it("returns at least 4 profiles (live or built-in)", () => {
    const profiles = getProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);
    // When hermes CLI is available, live profiles may differ from built-in
    // When unavailable, falls back to built-in: default, coder, reviewer, researcher, ops
    const builtIns = ["default", "coder", "reviewer", "researcher", "ops"];
    const names = profiles.map((p) => p.name);
    const foundBuiltIns = builtIns.filter((b) => names.includes(b));
    // At least some known profiles should exist (live or built-in)
    expect(foundBuiltIns.length).toBeGreaterThan(0);
  });
});

describe("getProfileCapabilities", () => {
  it("returns capabilities for known profile", () => {
    const caps = getProfileCapabilities("coder");
    expect(caps).toContain("code_generation");
    expect(caps).toContain("debugging");
  });

  it("returns default capabilities for unknown profile", () => {
    const caps = getProfileCapabilities("nonexistent");
    expect(caps.length).toBeGreaterThan(0);
  });
});

describe("getAllProfilesForCapabilities", () => {
  it("returns map with all built-in profiles", () => {
    const all = getAllProfilesForCapabilities();
    expect(Object.keys(all)).toContain("coder");
    expect(Object.keys(all)).toContain("ops");
  });
});