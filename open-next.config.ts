// ============================================================
// NEXGEAR — OpenNext Cloudflare Config
// File: open-next.config.ts
// ============================================================
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Default cho Cloudflare Workers
  // Bundle đã được tree-shake; việc tách routes xử lý qua wrangler.jsonc
});