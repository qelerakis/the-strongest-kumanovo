import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: (...args: unknown[]) => mockSet(...args),
  }),
}));

const { setLocale } = await import("./locale");

describe("setLocale", () => {
  beforeEach(() => {
    mockSet.mockReset();
  });

  it("sets cookie for 'en' locale", async () => {
    await setLocale("en");

    expect(mockSet).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith("locale", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  it("sets cookie for 'mk' locale", async () => {
    await setLocale("mk");

    expect(mockSet).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith("locale", "mk", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  it("does not set cookie for unsupported locale 'fr'", async () => {
    await setLocale("fr");

    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does not set cookie for unsupported locale 'de'", async () => {
    await setLocale("de");

    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does not set cookie for empty string", async () => {
    await setLocale("");

    expect(mockSet).not.toHaveBeenCalled();
  });

  it("rejects uppercase 'EN' (case sensitive)", async () => {
    await setLocale("EN");

    expect(mockSet).not.toHaveBeenCalled();
  });

  it("sets cookie with correct path and maxAge", async () => {
    await setLocale("en");

    const options = mockSet.mock.calls[0][2];
    expect(options).toEqual({
      path: "/",
      maxAge: 31_536_000, // 60 * 60 * 24 * 365
    });
  });
});
