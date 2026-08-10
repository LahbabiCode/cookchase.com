// Pure user-agent parsing for the visitor /account "signed-in devices" list.
// Free of DB imports so the node test runner can load it directly.

export interface DeviceInfo {
  kind: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
  /** Human label, e.g. "Chrome on Windows" or "Safari on iPhone (mobile)". */
  label: string;
  /** Icon glyph suggestion used by the account page. */
  icon: "Smartphone" | "Tablet" | "Laptop";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
  return "Browser";
}

function detectOs(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Device";
}

export function parseUserAgent(ua: string | null | undefined): DeviceInfo {
  const raw = (ua || "").slice(0, 400);
  const kind: "mobile" | "tablet" | "desktop" = /ipad|tablet|kindle|silk/i.test(raw)
    ? "tablet"
    : /mobile|iphone|ipod|android.*mobi/i.test(raw)
      ? "mobile"
      : "desktop";
  const browser = detectBrowser(raw);
  const os = detectOs(raw);
  const suffix = kind === "desktop" ? "" : ` (${kind})`;
  return {
    kind,
    browser,
    os,
    label: `${browser} on ${os}${suffix}`,
    icon: kind === "mobile" ? "Smartphone" : kind === "tablet" ? "Tablet" : "Laptop"
  };
}
