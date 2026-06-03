"use client";

// Barrel re-export. Implementation lives in:
// - ./token        client token storage + Bearer header helper
// - ./keys         slug + media-key helpers (pure)
// - ./upload       upload pipeline (presign / server) + confirm dialogs
// - ./works-api    /api/admin/* fetch wrappers
//
// Importers should keep using `@/lib/admin/api` so existing call sites stay stable.

export { getStoredAdminToken, setStoredAdminToken, clearStoredAdminToken } from "./token";
export {
  slugify,
  titleFromFilename,
  defaultMediaKey,
  workMediaKey,
  resolveUploadSlug,
  type WorkMediaKind,
} from "./keys";
export {
  SERVER_UPLOAD_MAX_BYTES,
  VIDEO_UPLOAD_WARN_BYTES,
  VIDEO_UPLOAD_CONFIRM_BYTES,
  guessContentType,
  formatUploadFailure,
  uploadFileAdmin,
  confirmMediaOverwrite,
  confirmVideoUpload,
} from "./upload";
export {
  fetchWorksAdmin,
  pullFromCosAdmin,
  fetchCategoriesAdmin,
  saveCategoriesAdmin,
  saveWorksAdmin,
  saveWorkItemAdmin,
  deleteWorkItemAdmin,
  saveWorkItemsBatchAdmin,
  type DevPullResult,
} from "./works-api";
