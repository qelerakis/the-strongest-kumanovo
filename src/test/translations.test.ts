import { describe, it, expect } from "vitest";
import enMessages from "../../messages/en.json";
import mkMessages from "../../messages/mk.json";

/**
 * Recursively collect all keys from a nested object using dot notation.
 * e.g., { a: { b: "x", c: "y" } } -> ["a.b", "a.c"]
 */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Recursively collect all leaf values from a nested object.
 */
function collectValues(obj: Record<string, unknown>, prefix = ""): { key: string; value: unknown }[] {
  const entries: { key: string; value: unknown }[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      entries.push(...collectValues(value as Record<string, unknown>, fullKey));
    } else {
      entries.push({ key: fullKey, value });
    }
  }
  return entries;
}

describe("translation file structure", () => {
  describe("top-level sections", () => {
    it("en.json and mk.json have the same top-level sections", () => {
      const enSections = Object.keys(enMessages).sort();
      const mkSections = Object.keys(mkMessages).sort();
      expect(enSections).toEqual(mkSections);
    });

    it("has all expected sections", () => {
      const expectedSections = [
        "common",
        "nav",
        "sports",
        "tiers",
        "belts",
        "days",
        "landing",
        "login",
        "dashboard",
        "members",
        "attendance",
        "payments",
        "schedule",
        "memberDashboard",
        "settings",
      ];
      for (const section of expectedSections) {
        expect(enMessages).toHaveProperty(section);
        expect(mkMessages).toHaveProperty(section);
      }
    });
  });

  describe("full key parity between EN and MK", () => {
    it("en.json and mk.json have the same set of keys", () => {
      const enKeys = collectKeys(enMessages).sort();
      const mkKeys = collectKeys(mkMessages).sort();

      const missingInMk = enKeys.filter((k) => !mkKeys.includes(k));
      const extraInMk = mkKeys.filter((k) => !enKeys.includes(k));

      expect(missingInMk).toEqual([]);
      expect(extraInMk).toEqual([]);
    });

    it("each section has matching keys", () => {
      const sections = Object.keys(enMessages) as (keyof typeof enMessages)[];
      for (const section of sections) {
        const enKeys = Object.keys(enMessages[section]).sort();
        const mkKeys = Object.keys(mkMessages[section]).sort();
        expect(enKeys, `Section "${section}" key mismatch`).toEqual(mkKeys);
      }
    });
  });

  describe("no empty translation values", () => {
    it("en.json has no empty string values", () => {
      const values = collectValues(enMessages);
      const empties = values.filter(
        (v) => typeof v.value === "string" && v.value.trim() === ""
      );
      expect(empties.map((e) => e.key)).toEqual([]);
    });

    it("mk.json has no empty string values", () => {
      const values = collectValues(mkMessages);
      const empties = values.filter(
        (v) => typeof v.value === "string" && v.value.trim() === ""
      );
      expect(empties.map((e) => e.key)).toEqual([]);
    });
  });

  describe("all values are strings", () => {
    it("en.json leaf values are all strings", () => {
      const values = collectValues(enMessages);
      const nonStrings = values.filter((v) => typeof v.value !== "string");
      expect(nonStrings.map((e) => e.key)).toEqual([]);
    });

    it("mk.json leaf values are all strings", () => {
      const values = collectValues(mkMessages);
      const nonStrings = values.filter((v) => typeof v.value !== "string");
      expect(nonStrings.map((e) => e.key)).toEqual([]);
    });
  });
});

describe("landing section translations", () => {
  it("has all required landing keys in EN", () => {
    const requiredKeys = [
      "title",
      "subtitle",
      "tagline",
      "viewSchedule",
      "joinUs",
      "scheduleTitle",
      "sportsTitle",
      "contactTitle",
      "contactAddress",
      "contactPhone",
      "contactEmail",
      "contactCountry",
      "noClasses",
      "login",
    ];
    for (const key of requiredKeys) {
      expect(enMessages.landing, `Missing EN landing key: ${key}`).toHaveProperty(key);
    }
  });

  it("has all required landing keys in MK", () => {
    const requiredKeys = [
      "title",
      "subtitle",
      "tagline",
      "viewSchedule",
      "joinUs",
      "scheduleTitle",
      "sportsTitle",
      "contactTitle",
      "contactAddress",
      "contactPhone",
      "contactEmail",
      "contactCountry",
      "noClasses",
      "login",
    ];
    for (const key of requiredKeys) {
      expect(mkMessages.landing, `Missing MK landing key: ${key}`).toHaveProperty(key);
    }
  });

  it("EN tagline is correct", () => {
    expect(enMessages.landing.tagline).toBe("Train Hard. Fight Easy.");
  });

  it("MK tagline uses correct grammar (Бори се лесно)", () => {
    expect(mkMessages.landing.tagline).toBe("Тренирај напорно. Бори се лесно.");
  });

  it("MK tagline does not contain old incorrect text", () => {
    expect(mkMessages.landing.tagline).not.toContain("Борби лесно");
  });

  it("MK contact labels are translated", () => {
    expect(mkMessages.landing.contactAddress).toBe("Адреса");
    expect(mkMessages.landing.contactPhone).toBe("Телефон");
    expect(mkMessages.landing.contactEmail).toBe("Е-пошта");
  });

  it("MK country name is translated", () => {
    expect(mkMessages.landing.contactCountry).toBe("Северна Македонија");
  });

  it("MK noClasses is translated", () => {
    expect(mkMessages.landing.noClasses).toBeTruthy();
    expect(mkMessages.landing.noClasses).not.toBe(enMessages.landing.noClasses);
  });
});

describe("sports translations", () => {
  const SPORT_KEYS = ["bjj", "kickboxing", "mma"] as const;

  it("has a name translation for each sport in both locales", () => {
    for (const key of SPORT_KEYS) {
      expect(enMessages.sports).toHaveProperty(key);
      expect(mkMessages.sports).toHaveProperty(key);
    }
  });

  it("has a description translation for each sport in both locales", () => {
    for (const key of SPORT_KEYS) {
      const descKey = `${key}Description`;
      expect(enMessages.sports).toHaveProperty(descKey);
      expect(mkMessages.sports).toHaveProperty(descKey);
    }
  });

  it("description keys follow the naming convention: nameKey + 'Description'", () => {
    const sportKeys = Object.keys(enMessages.sports);
    const descKeys = sportKeys.filter((k) => k.endsWith("Description"));

    for (const descKey of descKeys) {
      const nameKey = descKey.replace("Description", "");
      expect(sportKeys, `No name key for description: ${descKey}`).toContain(nameKey);
    }
  });

  it("sport names are different between EN and MK (except possibly English-origin terms)", () => {
    // At least some sport names should differ between locales
    const hasDifference = SPORT_KEYS.some(
      (key) =>
        enMessages.sports[key] !== mkMessages.sports[key]
    );
    expect(hasDifference).toBe(true);
  });

  it("sport descriptions are different between EN and MK", () => {
    for (const key of SPORT_KEYS) {
      const descKey = `${key}Description` as keyof typeof enMessages.sports;
      expect(
        enMessages.sports[descKey],
        `EN and MK ${descKey} should differ`
      ).not.toBe(mkMessages.sports[descKey]);
    }
  });

  it("no sport has an empty description in EN", () => {
    for (const key of SPORT_KEYS) {
      const descKey = `${key}Description` as keyof typeof enMessages.sports;
      expect(enMessages.sports[descKey].length).toBeGreaterThan(0);
    }
  });

  it("no sport has an empty description in MK", () => {
    for (const key of SPORT_KEYS) {
      const descKey = `${key}Description` as keyof typeof mkMessages.sports;
      expect(mkMessages.sports[descKey].length).toBeGreaterThan(0);
    }
  });

  it("does not have wrestling-related keys", () => {
    const allKeys = Object.keys(enMessages.sports);
    const wrestlingKeys = allKeys.filter((k) =>
      k.toLowerCase().includes("wrestling")
    );
    expect(wrestlingKeys).toEqual([]);
  });
});

describe("days translations", () => {
  it("has translations for all 7 days (0-6) in both locales", () => {
    for (let i = 0; i <= 6; i++) {
      const key = String(i);
      expect(enMessages.days).toHaveProperty(key);
      expect(mkMessages.days).toHaveProperty(key);
    }
  });

  it("EN day names are correct", () => {
    expect(enMessages.days["0"]).toBe("Sunday");
    expect(enMessages.days["1"]).toBe("Monday");
    expect(enMessages.days["2"]).toBe("Tuesday");
    expect(enMessages.days["3"]).toBe("Wednesday");
    expect(enMessages.days["4"]).toBe("Thursday");
    expect(enMessages.days["5"]).toBe("Friday");
    expect(enMessages.days["6"]).toBe("Saturday");
  });

  it("MK day names are in Macedonian", () => {
    // All MK day names should differ from EN
    for (let i = 0; i <= 6; i++) {
      const key = String(i) as keyof typeof enMessages.days;
      expect(mkMessages.days[key]).not.toBe(enMessages.days[key]);
    }
  });
});

describe("belt translations", () => {
  const BELT_RANKS = ["white", "blue", "purple", "brown", "black"] as const;

  it("has all belt ranks in both locales", () => {
    for (const rank of BELT_RANKS) {
      expect(enMessages.belts).toHaveProperty(rank);
      expect(mkMessages.belts).toHaveProperty(rank);
    }
  });

  it("EN belt names contain the rank word", () => {
    for (const rank of BELT_RANKS) {
      expect(enMessages.belts[rank].toLowerCase()).toContain(rank);
    }
  });
});

describe("interpolation placeholders", () => {
  it("dashboard.welcome has {name} placeholder in both locales", () => {
    expect(enMessages.dashboard.welcome).toContain("{name}");
    expect(mkMessages.dashboard.welcome).toContain("{name}");
  });

  it("memberDashboard.welcome has {name} placeholder in both locales", () => {
    expect(enMessages.memberDashboard.welcome).toContain("{name}");
    expect(mkMessages.memberDashboard.welcome).toContain("{name}");
  });

  it("attendance.monthlyCount has {count} placeholder in both locales", () => {
    expect(enMessages.attendance.monthlyCount).toContain("{count}");
    expect(mkMessages.attendance.monthlyCount).toContain("{count}");
  });

  it("memberDashboard.sessionsCount has {count} placeholder in both locales", () => {
    expect(enMessages.memberDashboard.sessionsCount).toContain("{count}");
    expect(mkMessages.memberDashboard.sessionsCount).toContain("{count}");
  });
});
