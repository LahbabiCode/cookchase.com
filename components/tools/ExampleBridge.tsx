"use client";

import { useEffect } from "react";
import { publishToolExample } from "./exampleStore";

/**
 * Publishes the admin-edited "Try an example" config (hint + values) for a
 * tool into the shared store as soon as the tool page mounts. The page's
 * widget then reads it back via getToolExample() when the visitor presses the
 * button, so edits made in the admin editor take effect with no code changes.
 *
 * Empty strings are published as-is; widgets fall back to their built-in
 * values for anything the admin left blank.
 */
export default function ExampleBridge({
  slug,
  hint,
  values
}: {
  slug: string;
  hint: string;
  values: string;
}) {
  useEffect(() => {
    let parsed: Record<string, unknown> = {};
    try {
      const v = JSON.parse(values || "{}");
      if (v && typeof v === "object" && !Array.isArray(v)) parsed = v;
    } catch {
      parsed = {};
    }
    publishToolExample(slug, { hint, values: parsed });
  }, [slug, hint, values]);

  return null;
}
