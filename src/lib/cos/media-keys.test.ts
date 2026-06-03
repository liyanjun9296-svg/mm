import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

const TEST_BUCKET = "test-bucket-1305428454";
const TEST_REGION = "ap-beijing";
const PUBLIC_BASE = `https://${TEST_BUCKET}.cos.${TEST_REGION}.myqcloud.com`;

beforeEach(() => {
  vi.resetModules();
  process.env.COS_SECRET_ID = "id";
  process.env.COS_SECRET_KEY = "key";
  process.env.COS_BUCKET = TEST_BUCKET;
  process.env.COS_REGION = TEST_REGION;
  process.env.COS_PUBLIC_BASE_URL = PUBLIC_BASE;
});

afterEach(() => {
  delete process.env.COS_SECRET_ID;
  delete process.env.COS_SECRET_KEY;
  delete process.env.COS_BUCKET;
  delete process.env.COS_REGION;
  delete process.env.COS_PUBLIC_BASE_URL;
});

describe("cosKeyFromPublicUrl", () => {
  it("extracts works/* key from a matching COS public URL", async () => {
    const { cosKeyFromPublicUrl } = await import("@/lib/cos/media-keys");
    expect(cosKeyFromPublicUrl(`${PUBLIC_BASE}/works/videos/foo.mp4`)).toBe(
      "works/videos/foo.mp4",
    );
  });

  it("returns null for non-works prefixes", async () => {
    const { cosKeyFromPublicUrl } = await import("@/lib/cos/media-keys");
    expect(cosKeyFromPublicUrl(`${PUBLIC_BASE}/site/works.json`)).toBeNull();
  });

  it("returns null for foreign hosts", async () => {
    const { cosKeyFromPublicUrl } = await import("@/lib/cos/media-keys");
    expect(cosKeyFromPublicUrl("https://evil.example.com/works/x.mp4")).toBeNull();
  });

  it("returns null for blank input", async () => {
    const { cosKeyFromPublicUrl } = await import("@/lib/cos/media-keys");
    expect(cosKeyFromPublicUrl("")).toBeNull();
    expect(cosKeyFromPublicUrl("   ")).toBeNull();
  });
});

describe("cosKeyFromDevMediaUrl", () => {
  it("extracts key from /api/dev/media?key=works/...", async () => {
    const { cosKeyFromDevMediaUrl } = await import("@/lib/cos/media-keys");
    expect(
      cosKeyFromDevMediaUrl("/api/dev/media?key=works/videos/foo.mp4"),
    ).toBe("works/videos/foo.mp4");
  });

  it("returns null when key is missing or non-works", async () => {
    const { cosKeyFromDevMediaUrl } = await import("@/lib/cos/media-keys");
    expect(cosKeyFromDevMediaUrl("/api/dev/media?key=other/x")).toBeNull();
    expect(cosKeyFromDevMediaUrl("/static/asset.png")).toBeNull();
  });
});

describe("media variants", () => {
  it("isWorksImageDetailKey: legacy gallery/cover image keys are detail", async () => {
    const { isWorksImageDetailKey } = await import("@/lib/cos/media-variants");
    expect(isWorksImageDetailKey("works/gallery/foo.jpg")).toBe(true);
    expect(isWorksImageDetailKey("works/covers/foo.png")).toBe(true);
  });

  it("isWorksImageDetailKey: list/admin webp variants are not detail", async () => {
    const { isWorksImageDetailKey } = await import("@/lib/cos/media-variants");
    expect(isWorksImageDetailKey("works/gallery/foo.list.webp")).toBe(false);
    expect(isWorksImageDetailKey("works/gallery/foo.admin.webp")).toBe(false);
  });

  it("isWorksImageDetailKey: video keys are not images", async () => {
    const { isWorksImageDetailKey } = await import("@/lib/cos/media-variants");
    expect(isWorksImageDetailKey("works/videos/foo.mp4")).toBe(false);
  });

  it("mediaBaseFromKey strips legacy ext and variant suffix", async () => {
    const { mediaBaseFromKey } = await import("@/lib/cos/media-variants");
    expect(mediaBaseFromKey("works/gallery/foo.jpg")).toBe("works/gallery/foo");
    expect(mediaBaseFromKey("works/gallery/foo.list.webp")).toBe("works/gallery/foo");
    expect(mediaBaseFromKey("works/videos/foo.mp4")).toBeNull();
  });

  it("expandMediaKeysWithVariants expands image keys to detail + list + admin", async () => {
    const { expandMediaKeysWithVariants } = await import("@/lib/cos/media-variants");
    const expanded = expandMediaKeysWithVariants(["works/gallery/trip.jpg"]);
    expect(expanded.sort()).toEqual(
      [
        "works/gallery/trip.jpg",
        "works/gallery/trip.list.webp",
        "works/gallery/trip.admin.webp",
      ].sort(),
    );
  });

  it("expandMediaKeysWithVariants leaves video keys untouched", async () => {
    const { expandMediaKeysWithVariants } = await import("@/lib/cos/media-variants");
    expect(expandMediaKeysWithVariants(["works/videos/foo.mp4"])).toEqual([
      "works/videos/foo.mp4",
    ]);
  });
});
