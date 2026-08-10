/**
 * Shared social-sharing helpers.
 *
 * Both the page-level ShareButtons component and the per-tool
 * "Share this example" button build the same share links, so the URL
 * construction + popup opening live here and never drift.
 */

export interface ShareHrefs {
  facebook: string;
  x: string;
  pinterest: string;
  linkedin: string;
  email: string;
}

/**
 * Build the five share URLs for a page or a shared message.
 *
 * - `url`   — the page to share (the post/tool link).
 * - `title` — short title used for the Pinterest description and email subject.
 * - `text`  — optional longer message (e.g. "Try this example: ..."). When
 *   given, it is used as the tweet text and email body (with the URL appended);
 *   the X intent also passes `url` separately so the link never appears twice.
 */
export function buildShareHrefs(url: string, title: string, text?: string): ShareHrefs {
  const u = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const tweet = text || title;
  const emailBody = text ? `${text}\n${url}` : url;
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(tweet)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${u}&description=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(emailBody)}`
  };
}

/**
 * Open a share URL in a popup. Returns true when a popup was opened; mailto
 * links return false so the caller lets the native mail client handle them
 * (i.e. the click's default action must be left intact).
 */
export function openShare(href: string): boolean {
  if (href.startsWith("mailto:")) return false;
  window.open(href, "_blank", "noopener,noreferrer,width=640,height=480");
  return true;
}
