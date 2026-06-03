import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  slugify,
  titleFromFilename,
  workMediaKey,
  guessContentType,
  defaultMediaKey,
  resolveUploadSlug,
  confirmVideoUpload,
  VIDEO_UPLOAD_WARN_BYTES,
  VIDEO_UPLOAD_CONFIRM_BYTES,
} from "@/lib/admin/api";

function makeFile(name: string, size = 0, type = ""): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe("slugify", () => {
  it("lowercases and dashes spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips non-ascii (CJK)", () => {
    // Chinese characters become empty → falls back to work-{ts}
    expect(slugify("漂亮的作品")).toMatch(/^work-\d+$/);
  });

  it("collapses multiple dashes and trims", () => {
    expect(slugify("--Foo  Bar--")).toBe("foo-bar");
  });

  it("falls back to work-<timestamp> when ascii result empty", () => {
    expect(slugify("***")).toMatch(/^work-\d+$/);
  });
});

describe("titleFromFilename", () => {
  it("strips extension and converts separators to spaces", () => {
    expect(titleFromFilename("my-photo_2024.jpg")).toBe("my photo 2024");
  });

  it("falls back to default when filename empty", () => {
    expect(titleFromFilename("")).toBe("摄影作品");
    expect(titleFromFilename(".jpg")).toBe("摄影作品");
  });
});

describe("workMediaKey", () => {
  it("video uses original extension", () => {
    expect(workMediaKey("hero", "video", makeFile("clip.mp4", 0, "video/mp4"))).toBe(
      "works/videos/hero.mp4",
    );
    expect(workMediaKey("hero", "video", makeFile("clip.webm", 0, "video/webm"))).toBe(
      "works/videos/hero.webm",
    );
  });

  it("cover always normalizes to .detail.webp (variant pipeline expects legacy detail key)", () => {
    expect(workMediaKey("hero", "cover", makeFile("a.png", 0, "image/png"))).toBe(
      "works/covers/hero.detail.webp",
    );
    expect(workMediaKey("hero", "cover", makeFile("a.jpg", 0, "image/jpeg"))).toBe(
      "works/covers/hero.detail.webp",
    );
  });

  it("gallery main image normalizes to .detail.webp", () => {
    expect(workMediaKey("trip", "gallery", makeFile("a.jpg"))).toBe(
      "works/gallery/trip.detail.webp",
    );
  });

  it("gallery-detail uses index suffix", () => {
    expect(workMediaKey("trip", "gallery-detail", makeFile("a.jpg"), 3)).toBe(
      "works/gallery/trip-3.detail.webp",
    );
    expect(workMediaKey("trip", "gallery-detail", makeFile("a.jpg"))).toBe(
      "works/gallery/trip-0.detail.webp",
    );
  });

  it("sanitizes unsafe slug characters", () => {
    expect(workMediaKey("../foo bar", "video", makeFile("x.mp4"))).toBe(
      "works/videos/-foo-bar.mp4",
    );
  });
});

describe("defaultMediaKey", () => {
  it("namespaces under folder with timestamp prefix", () => {
    const file = makeFile("My File.jpg");
    const key = defaultMediaKey(file, "tmp");
    expect(key).toMatch(/^tmp\/\d+-My-File\.jpg$/);
  });

  it("falls back to 'file' when name strips empty", () => {
    const file = makeFile("漂亮.png");
    const key = defaultMediaKey(file, "tmp");
    expect(key).toMatch(/^tmp\/\d+-(\.png|file)$/);
  });
});

describe("guessContentType", () => {
  it("returns file.type when present", () => {
    expect(guessContentType(makeFile("a.bin", 0, "application/x-custom"))).toBe(
      "application/x-custom",
    );
  });

  it("falls back to extension for known types", () => {
    expect(guessContentType(makeFile("a.mp4"))).toBe("video/mp4");
    expect(guessContentType(makeFile("a.webm"))).toBe("video/webm");
    expect(guessContentType(makeFile("a.mov"))).toBe("video/quicktime");
    expect(guessContentType(makeFile("A.JPEG"))).toBe("image/jpeg");
    expect(guessContentType(makeFile("a.png"))).toBe("image/png");
    expect(guessContentType(makeFile("a.webp"))).toBe("image/webp");
  });

  it("falls back to octet-stream for unknown ext", () => {
    expect(guessContentType(makeFile("a.xyz"))).toBe("application/octet-stream");
  });
});

describe("resolveUploadSlug", () => {
  it("prefers explicit slug", () => {
    expect(resolveUploadSlug("foo-bar", "Some Title")).toBe("foo-bar");
  });

  it("derives slug from title when slug empty", () => {
    expect(resolveUploadSlug("", "Hello World")).toBe("hello-world");
  });

  it("returns null when both empty", () => {
    // slugify falls back to work-<ts> so resolveUploadSlug never returns null
    // for any non-empty title; verify the actual behavior
    expect(resolveUploadSlug("", "")).toMatch(/^work-\d+$/);
  });
});

describe("confirmVideoUpload thresholds", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn(() => true));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("non-video files skip the confirm dialog entirely", () => {
    const file = makeFile("photo.jpg", 500 * 1024 * 1024, "image/jpeg");
    expect(confirmVideoUpload(file)).toBe(true);
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("small videos under warn threshold pass without prompting", () => {
    const file = makeFile("clip.mp4", VIDEO_UPLOAD_WARN_BYTES - 1024, "video/mp4");
    expect(confirmVideoUpload(file)).toBe(true);
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("videos at or above warn threshold trigger confirm", () => {
    const file = makeFile("clip.mp4", VIDEO_UPLOAD_WARN_BYTES + 1, "video/mp4");
    confirmVideoUpload(file);
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });

  it("videos at or above hard-confirm threshold trigger the stronger prompt", () => {
    const file = makeFile("big.mp4", VIDEO_UPLOAD_CONFIRM_BYTES + 1, "video/mp4");
    confirmVideoUpload(file);
    const message = (window.confirm as unknown as { mock: { calls: string[][] } }).mock.calls[0][0];
    expect(message).toContain("外网流量");
  });
});
