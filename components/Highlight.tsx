/**
 * Case-insensitive keyword highlighter for search results.
 *
 * Wraps every substring of `text` that matches one of the query terms in a
 * <mark> styled with the brand accent, so users instantly see which part of
 * a tool name or article title matched. Term characters are regex-escaped so
 * queries like "c++" or "50/50" match literally. Multi-word queries highlight
 * each term independently ("meal prep" lights up "meal" and "prep").
 *
 * Deliberately hook-free: this renders inside both the client-side header
 * dropdown and a server component (the /search results page), so it stays a
 * pure function of its props.
 */
export default function Highlight({
  text,
  query,
  className = "rounded bg-brand-100 px-0.5 font-bold text-brand-700"
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter((t) => t.length > 0);

  // Short-circuit: no query, or nothing to highlight.
  if (terms.length === 0 || !text) return <>{text}</>;

  // Split on any term, keeping the separators (capturing group) so we can
  // tell matched fragments from plain ones.
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const isMatch = new RegExp(`^(?:${terms.join("|")})$`, "i");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        return isMatch.test(part) ? (
          <mark key={i} className={className}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
