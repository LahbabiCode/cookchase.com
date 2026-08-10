import { Info } from "lucide-react";

/**
 * Small plain-language helper text shown under an admin form field.
 * Keep `children` simple — this is the "what do I write here?" nudge.
 */
export default function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-400">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
