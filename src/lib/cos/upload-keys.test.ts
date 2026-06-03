import { describe, expect, it } from "vitest";
import {
  isAllowedWorksUploadKey,
  sanitizeUploadKey,
} from "@/lib/cos/upload-keys";

describe("isAllowedWorksUploadKey", () => {
  it("accepts works/* keys", () => {
    expect(isAllowedWorksUploadKey("works/videos/foo.mp4")).toBe(true);
    expect(isAllowedWorksUploadKey("works/covers/foo.detail.webp")).toBe(true);
  });

  it("strips leading slashes before checking prefix", () => {
    expect(isAllowedWorksUploadKey("/works/videos/foo.mp4")).toBe(true);
    expect(isAllowedWorksUploadKey("///works/videos/foo.mp4")).toBe(true);
  });

  it("rejects non-works prefixes", () => {
    expect(isAllowedWorksUploadKey("other/foo.mp4")).toBe(false);
    expect(isAllowedWorksUploadKey("site/works.json")).toBe(false);
    expect(isAllowedWorksUploadKey("")).toBe(false);
  });

  it("rejects path traversal", () => {
    expect(isAllowedWorksUploadKey("works/../etc/passwd")).toBe(false);
    expect(isAllowedWorksUploadKey("works/videos/..hack.mp4")).toBe(false);
  });
});

describe("sanitizeUploadKey", () => {
  it("strips leading slashes", () => {
    expect(sanitizeUploadKey("/works/x")).toBe("works/x");
    expect(sanitizeUploadKey("///works/x")).toBe("works/x");
  });

  it("removes any '..' sequences", () => {
    expect(sanitizeUploadKey("works/../x")).toBe("works//x");
    expect(sanitizeUploadKey("..works..")).toBe("works");
  });

  it("leaves clean keys untouched", () => {
    expect(sanitizeUploadKey("works/videos/foo.mp4")).toBe("works/videos/foo.mp4");
  });
});
