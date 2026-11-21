import { describe, expect, it } from "vitest";
import { getDebriefPrompts } from "./debrief-prompts";

describe("getDebriefPrompts", () => {
  it("asks how the group confirmed delivery when nobody is isolated", () => {
    expect(getDebriefPrompts([], [])).toContain(
      "What confirmed that every role received the update?",
    );
  });

  it("asks how an isolated role would know the update is missing", () => {
    expect(getDebriefPrompts(["Welcome desk"], [])).toContain(
      "How would Welcome desk know the update never arrived?",
    );
  });

  it("names route mismatches when the selected backup does not fit", () => {
    expect(getDebriefPrompts([], ["Spoken relay → Programs lead"])).toContain(
      "Which written backup could reach people missed by Spoken relay → Programs lead?",
    );
  });

  it("asks the group to choose one role to check when several are isolated", () => {
    expect(getDebriefPrompts(["Pantry team", "Library partner"], [])).toContain(
      "Which isolated role would you check on first, and why?",
    );
  });
});
