function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  out = out.replace(/`(.+?)`/g, "<code>$1</code>");
  out = out.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  return out;
}

function parseTable(lines: string[]): string {
  const headers = lines[0].split("|").map((c) => c.trim()).filter(Boolean);
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length) rows.push(cells);
  }
  let html = "<table><thead><tr>";
  for (const h of headers) html += `<th>${inline(h)}</th>`;
  html += "</tr></thead><tbody>";
  for (const row of rows) {
    html += "<tr>";
    for (let i = 0; i < headers.length; i++) {
      html += `<td>${inline(row[i] ?? "")}</td>`;
    }
    html += "</tr>";
  }
  return html + "</tbody></table>";
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let inCode = false;
  let codeBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let tableBuf: string[] | null = null;

  const flushList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushTable = () => {
    if (tableBuf) {
      html.push(parseTable(tableBuf));
      tableBuf = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        flushList();
        flushTable();
        inCode = true;
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      i++;
      continue;
    }

    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1].includes("-")) {
      flushList();
      tableBuf = [line];
      i++;
      while (i < lines.length && lines[i].startsWith("|")) {
        tableBuf.push(lines[i]);
        i++;
      }
      flushTable();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      flushTable();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (line.startsWith("---") || line.startsWith("***")) {
      flushList();
      flushTable();
      html.push("<hr/>");
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      flushTable();
      const isOl = /^\s*\d+\.\s+/.test(line);
      if (!listType) {
        listType = isOl ? "ol" : "ul";
        html.push(`<${listType}>`);
      } else if ((listType === "ol") !== isOl) {
        flushList();
        listType = isOl ? "ol" : "ul";
        html.push(`<${listType}>`);
      }
      const content = line.replace(/^\s*[-*]\s+/, "").replace(/^\s*\d+\.\s+/, "");
      html.push(`<li>${inline(content)}</li>`);
      i++;
      continue;
    }

    if (line.trim() === "") {
      flushList();
      flushTable();
      i++;
      continue;
    }

    flushList();
    flushTable();
    html.push(`<p>${inline(line.trim())}</p>`);
    i++;
  }

  flushList();
  flushTable();
  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  }

  return html.join("\n");
}

/**
 * Strip markdown down to plain, speakable text (read-aloud / summaries).
 * Links keep their label, emphasis is removed, tables/heading markers are
 * dropped and runs of whitespace collapse to single spaces.
 */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
