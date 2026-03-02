import { describe, it, expect } from "vitest";
import {
  SPORTS,
  DISPLAY_DAYS,
  getAlignmentClasses,
  getAccentLineClasses,
  getSlideDirection,
  mutedColor,
  type Alignment,
  type SportConfig,
} from "./landing-utils";

// ---------------------------------------------------------------------------
// SPORTS config
// ---------------------------------------------------------------------------
describe("SPORTS configuration", () => {
  it("has exactly 3 sports", () => {
    expect(SPORTS).toHaveLength(3);
  });

  it("includes bjj, kickboxing, and mma in order", () => {
    expect(SPORTS.map((s) => s.nameKey)).toEqual(["bjj", "kickboxing", "mma"]);
  });

  it("each sport has a valid hex color", () => {
    for (const sport of SPORTS) {
      expect(sport.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("each sport has a valid alignment", () => {
    const validAligns: Alignment[] = ["left", "right", "center"];
    for (const sport of SPORTS) {
      expect(validAligns).toContain(sport.align);
    }
  });

  it("has no duplicate nameKeys", () => {
    const keys = SPORTS.map((s) => s.nameKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has no duplicate colors", () => {
    const colors = SPORTS.map((s) => s.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("BJJ uses heritage red color", () => {
    const bjj = SPORTS.find((s) => s.nameKey === "bjj")!;
    expect(bjj.color).toBe("#B91C1C");
  });

  it("Kickboxing uses burnished gold color", () => {
    const kickboxing = SPORTS.find((s) => s.nameKey === "kickboxing")!;
    expect(kickboxing.color).toBe("#A16207");
  });

  it("MMA uses green color", () => {
    const mma = SPORTS.find((s) => s.nameKey === "mma")!;
    expect(mma.color).toBe("#22C55E");
  });

  it("uses alternating alignment pattern (left, right, center)", () => {
    expect(SPORTS.map((s) => s.align)).toEqual(["left", "right", "center"]);
  });
});

// ---------------------------------------------------------------------------
// DISPLAY_DAYS
// ---------------------------------------------------------------------------
describe("DISPLAY_DAYS configuration", () => {
  it("has exactly 6 days (Mon-Sat)", () => {
    expect(DISPLAY_DAYS).toHaveLength(6);
  });

  it("represents Monday through Saturday (1-6)", () => {
    expect([...DISPLAY_DAYS]).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("does not include Sunday (0)", () => {
    expect(DISPLAY_DAYS).not.toContain(0);
  });

  it("days are in ascending order", () => {
    for (let i = 1; i < DISPLAY_DAYS.length; i++) {
      expect(DISPLAY_DAYS[i]).toBeGreaterThan(DISPLAY_DAYS[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// getAlignmentClasses
// ---------------------------------------------------------------------------
describe("getAlignmentClasses", () => {
  it("returns center classes for mobile on all alignments", () => {
    const alignments: Alignment[] = ["left", "right", "center"];
    for (const align of alignments) {
      const classes = getAlignmentClasses(align);
      expect(classes).toContain("items-center");
      expect(classes).toContain("text-center");
    }
  });

  it("left alignment adds lg:items-start and lg:text-left", () => {
    const classes = getAlignmentClasses("left");
    expect(classes).toContain("lg:items-start");
    expect(classes).toContain("lg:text-left");
  });

  it("right alignment adds lg:items-end and lg:text-right", () => {
    const classes = getAlignmentClasses("right");
    expect(classes).toContain("lg:items-end");
    expect(classes).toContain("lg:text-right");
  });

  it("center alignment has no lg: responsive overrides", () => {
    const classes = getAlignmentClasses("center");
    expect(classes).not.toContain("lg:");
  });

  it("returns a string for all valid alignments", () => {
    const alignments: Alignment[] = ["left", "right", "center"];
    for (const align of alignments) {
      expect(typeof getAlignmentClasses(align)).toBe("string");
      expect(getAlignmentClasses(align).length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getAccentLineClasses
// ---------------------------------------------------------------------------
describe("getAccentLineClasses", () => {
  it("all alignments include mx-auto for mobile centering", () => {
    const alignments: Alignment[] = ["left", "right", "center"];
    for (const align of alignments) {
      expect(getAccentLineClasses(align)).toContain("mx-auto");
    }
  });

  it("left alignment overrides margin-left to 0 on desktop", () => {
    const classes = getAccentLineClasses("left");
    expect(classes).toContain("lg:ml-0");
  });

  it("right alignment overrides margin-right to 0 on desktop", () => {
    const classes = getAccentLineClasses("right");
    expect(classes).toContain("lg:mr-0");
  });

  it("center alignment is simply mx-auto with no desktop overrides", () => {
    expect(getAccentLineClasses("center")).toBe("mx-auto");
  });

  it("returns a string for all valid alignments", () => {
    const alignments: Alignment[] = ["left", "right", "center"];
    for (const align of alignments) {
      expect(typeof getAccentLineClasses(align)).toBe("string");
      expect(getAccentLineClasses(align).length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getSlideDirection
// ---------------------------------------------------------------------------
describe("getSlideDirection", () => {
  it("left slides in from the left (negative x)", () => {
    const { x, y } = getSlideDirection("left");
    expect(x).toBeLessThan(0);
    expect(y).toBe(0);
  });

  it("right slides in from the right (positive x)", () => {
    const { x, y } = getSlideDirection("right");
    expect(x).toBeGreaterThan(0);
    expect(y).toBe(0);
  });

  it("center slides in from below (positive y)", () => {
    const { x, y } = getSlideDirection("center");
    expect(x).toBe(0);
    expect(y).toBeGreaterThan(0);
  });

  it("left and right have symmetric x offsets", () => {
    const left = getSlideDirection("left");
    const right = getSlideDirection("right");
    expect(Math.abs(left.x)).toBe(Math.abs(right.x));
  });

  it("returns objects with x and y number properties", () => {
    const alignments: Alignment[] = ["left", "right", "center"];
    for (const align of alignments) {
      const result = getSlideDirection(align);
      expect(typeof result.x).toBe("number");
      expect(typeof result.y).toBe("number");
    }
  });

  it("each SPORT config alignment maps to a valid slide direction", () => {
    for (const sport of SPORTS) {
      const slide = getSlideDirection(sport.align);
      expect(slide).toHaveProperty("x");
      expect(slide).toHaveProperty("y");
    }
  });
});

// ---------------------------------------------------------------------------
// mutedColor
// ---------------------------------------------------------------------------
describe("mutedColor", () => {
  describe("null/undefined handling", () => {
    it("returns stone gray for null", () => {
      expect(mutedColor(null)).toBe("#A8A29E");
    });
  });

  describe("red family mapping", () => {
    it("maps #DC2626 (brand-red-light) to heritage red", () => {
      expect(mutedColor("#DC2626")).toBe("#B91C1C");
    });

    it("maps #EF4444 to heritage red", () => {
      expect(mutedColor("#EF4444")).toBe("#B91C1C");
    });

    it("maps #B91C1C to itself (heritage red)", () => {
      expect(mutedColor("#B91C1C")).toBe("#B91C1C");
    });

    it("is case-insensitive for red hex values", () => {
      expect(mutedColor("#dc2626")).toBe("#B91C1C");
      expect(mutedColor("#DC2626")).toBe("#B91C1C");
    });
  });

  describe("gold family mapping", () => {
    it("maps #EAB308 (warning/gold) to burnished gold", () => {
      expect(mutedColor("#EAB308")).toBe("#A16207");
    });

    it("maps #FACC15 to burnished gold", () => {
      expect(mutedColor("#FACC15")).toBe("#A16207");
    });

    it("maps #CA8A04 to burnished gold", () => {
      expect(mutedColor("#CA8A04")).toBe("#A16207");
    });

    it("is case-insensitive for gold hex values", () => {
      expect(mutedColor("#eab308")).toBe("#A16207");
    });
  });

  describe("green family mapping", () => {
    it("maps #22C55E (success green) to #22C55E", () => {
      expect(mutedColor("#22C55E")).toBe("#22C55E");
    });

    it("maps #16A34A to #22C55E", () => {
      expect(mutedColor("#16A34A")).toBe("#22C55E");
    });

    it("is case-insensitive for green hex values", () => {
      expect(mutedColor("#22c55e")).toBe("#22C55E");
    });
  });

  describe("unknown color fallback", () => {
    it("returns stone gray for unrecognized hex", () => {
      expect(mutedColor("#FF00FF")).toBe("#A8A29E");
    });

    it("returns stone gray for empty string", () => {
      expect(mutedColor("")).toBe("#A8A29E");
    });

    it("returns stone gray for arbitrary text", () => {
      expect(mutedColor("red")).toBe("#A8A29E");
    });
  });

  describe("integration with SPORTS config", () => {
    it("maps each sport color to a non-gray result", () => {
      for (const sport of SPORTS) {
        const result = mutedColor(sport.color);
        expect(result).not.toBe("#A8A29E");
      }
    });

    it("BJJ color maps to heritage red", () => {
      const bjj = SPORTS.find((s) => s.nameKey === "bjj")!;
      expect(mutedColor(bjj.color)).toBe("#B91C1C");
    });

    it("Kickboxing color maps to burnished gold", () => {
      const kb = SPORTS.find((s) => s.nameKey === "kickboxing")!;
      expect(mutedColor(kb.color)).toBe("#A16207");
    });

    it("MMA color maps to green", () => {
      const mma = SPORTS.find((s) => s.nameKey === "mma")!;
      expect(mutedColor(mma.color)).toBe("#22C55E");
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: consistency between SPORTS and alignment functions
// ---------------------------------------------------------------------------
describe("SPORTS + alignment function integration", () => {
  it("every sport produces valid alignment classes", () => {
    for (const sport of SPORTS) {
      const classes = getAlignmentClasses(sport.align);
      expect(classes).toContain("items-center");
      expect(classes).toContain("text-center");
    }
  });

  it("every sport produces valid accent line classes", () => {
    for (const sport of SPORTS) {
      const classes = getAccentLineClasses(sport.align);
      expect(classes).toContain("mx-auto");
    }
  });

  it("every sport produces valid slide direction", () => {
    for (const sport of SPORTS) {
      const slide = getSlideDirection(sport.align);
      // At least one axis should have a non-zero offset
      expect(Math.abs(slide.x) + Math.abs(slide.y)).toBeGreaterThan(0);
    }
  });
});
