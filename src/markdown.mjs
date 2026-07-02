import { createSearchMatcher } from './editor-search.mjs';

const headingPattern = /^(#{1,6})\s+(.+?)\s*#*$/;

export function renderMarkdown(markdown = '') {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let index = 0;
  let headingIndex = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const language = line.trim().slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      if (isFlowchartBlock(language, code.join('\n'))) {
        html.push(renderFlowchart(code.join('\n')));
        continue;
      }
      const className = language ? ` class="language-${escapeAttribute(language)}"` : '';
      html.push(`<pre><code${className}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(headingPattern);
    if (heading) {
      const level = heading[1].length;
      const text = stripMarkdown(heading[2].trim());
      const id = slugify(text);
      html.push(`<h${level} id="${id}" data-heading-index="${headingIndex}">${formatInline(heading[2].trim())}</h${level}>`);
      headingIndex += 1;
      index += 1;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      html.push('<hr>');
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const tableLines = [lines[index], lines[index + 1]];
      index += 2;
      while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    if (/^\s{0,3}>\s?/.test(line)) {
      const block = [];
      while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) {
        block.push(lines[index].replace(/^\s{0,3}>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote>${renderMarkdown(block.join('\n'))}</blockquote>`);
      continue;
    }

    if (/^\s*(?:[-+*]|\d+\.)\s+/.test(line)) {
      const items = [];
      const ordered = /^\s*\d+\.\s+/.test(line);
      while (index < lines.length && /^\s*(?:[-+*]|\d+\.)\s+/.test(lines[index])) {
        const raw = lines[index].replace(/^\s*(?:[-+*]|\d+\.)\s+/, '');
        const task = raw.match(/^\[(x|X| )\]\s+(.*)$/);
        if (task) {
          const checked = task[1].toLowerCase() === 'x' ? ' checked' : '';
          items.push(`<li class="task-item"><input type="checkbox"${checked} disabled> ${formatInline(task[2])}</li>`);
        } else {
          items.push(`<li>${formatInline(raw)}</li>`);
        }
        index += 1;
      }
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockBoundary(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${formatInline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

export function extractHeadings(markdown = '') {
  return String(markdown)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line, lineIndex) => ({ match: line.match(headingPattern), lineIndex }))
    .filter((entry) => entry.match)
    .map((entry, index) => {
      const match = entry.match;
      const text = stripMarkdown(match[2].trim());
      return {
        level: match[1].length,
        text,
        id: slugify(text),
        lineIndex: entry.lineIndex,
        headingIndex: index,
      };
    });
}

export function highlightSearch(html = '', query = '', options = {}) {
  const term = String(query).trim();
  if (!term) return html;

  const matcher = createSearchMatcher(term, options);
  if (!matcher) return html;
  return String(html)
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(matcher, '<mark>$&</mark>');
    })
    .join('');
}

export function getDocumentStats(markdown = '') {
  const text = String(markdown);
  const plainText = stripMarkdown(text);
  const words = plainText.match(/[A-Za-z0-9_]+|[\u4e00-\u9fff]/g) || [];
  const lines = text ? text.split(/\r\n?|\n/).length : 0;

  return {
    characters: text.length,
    words: words.length,
    headings: extractHeadings(text).length,
    lines,
    readingMinutes: Math.max(1, Math.ceil(words.length / 220)),
  };
}

export function buildExportHtml(title = 'Markdown Document', renderedHtml = '') {
  const safeTitle = escapeHtml(title || 'Markdown Document');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; background: #f7f5f0; color: #25221d; font: 17px/1.75 ui-serif, Georgia, "Times New Roman", serif; }
    .markdown-body { max-width: 820px; margin: 48px auto; padding: 0 28px 64px; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.25; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    pre { overflow: auto; padding: 18px; border-radius: 8px; background: #24211d; color: #f7f2e8; }
    blockquote { margin-left: 0; padding-left: 18px; border-left: 3px solid #b08b57; color: #6b6256; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd4c4; padding: 8px 10px; }
    .diagram-flowchart { overflow: auto; padding: 18px; border: 1px solid #ddd4c4; border-radius: 8px; background: #fffdf8; }
    .diagram-stage { position: relative; margin: 0 auto; }
    .diagram-stage svg { display: block; width: var(--diagram-base-width); height: var(--diagram-base-height); transform: scale(var(--diagram-zoom, 1)); transform-origin: top left; }
    .diagram-toolbar { display: none; }
    .diagram-node-shape { fill: #fffdf8; stroke: #1f7a6d; stroke-width: 2; }
    .diagram-node-label, .diagram-edge-label { fill: #25221d; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; font-weight: 700; text-anchor: middle; }
    .diagram-edge { fill: none; stroke: #1f7a6d; stroke-width: 2; }
    .diagram-arrow { fill: #1f7a6d; }
    .diagram-edge-label { text-anchor: start; font-size: 12px; fill: #6b6256; }
  </style>
</head>
<body>
  <article class="markdown-body">
${renderedHtml}
  </article>
</body>
</html>`;
}

function isBlockBoundary(lines, index) {
  const line = lines[index];
  return (
    /^```/.test(line.trim()) ||
    headingPattern.test(line) ||
    /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    /^\s{0,3}>\s?/.test(line) ||
    /^\s*(?:[-+*]|\d+\.)\s+/.test(line) ||
    isTableStart(lines, index)
  );
}

function isTableStart(lines, index) {
  return Boolean(
    lines[index] &&
      lines[index + 1] &&
      /^\s*\|.*\|\s*$/.test(lines[index]) &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])
  );
}

function renderTable(lines) {
  const rows = lines.map(parseTableRow);
  const head = rows[0] || [];
  const body = rows.slice(2);
  return `<table><thead><tr>${head.map((cell) => `<th>${formatInline(cell)}</th>`).join('')}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${formatInline(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function isFlowchartBlock(language, code) {
  const lang = String(language).trim().toLowerCase();
  const firstMeaningfulLine = String(code)
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  return lang === 'mermaid' || /^(flowchart|graph)\s+(td|tb|bt|lr|rl)\b/i.test(firstMeaningfulLine || '');
}

function renderFlowchart(code) {
  const parsed = parseFlowchart(code);
  if (!parsed.nodes.length) {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }

  const nodeHeight = 68;
  const verticalGap = 72;
  const horizontalGap = 88;
  const padding = 42;
  const layout = layoutFlowchart(parsed, { nodeHeight, verticalGap, horizontalGap, padding });
  const { width, height, positions, nodeWidths } = layout;

  const edges = parsed.edges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return '';
      const startY = from.y + nodeHeight;
      const endY = to.y;
      const middleY = startY + (endY - startY) / 2;
      const path =
        Math.abs(from.x - to.x) < 1
          ? `M ${from.x} ${startY} L ${to.x} ${endY}`
          : `M ${from.x} ${startY} C ${from.x} ${middleY}, ${to.x} ${middleY}, ${to.x} ${endY}`;
      const label = edge.label
        ? `<text class="diagram-edge-label" x="${(from.x + to.x) / 2 + 12}" y="${middleY - 8}">${escapeHtml(edge.label)}</text>`
        : '';
      return `<path class="diagram-edge" d="${path}" marker-end="url(#flowchart-arrow)"></path>${label}`;
    })
    .join('');

  const nodes = parsed.nodes
    .map((node) => {
      const position = positions.get(node.id);
      const widthForNode = nodeWidths.get(node.id);
      const shape =
        node.shape === 'diamond'
          ? `<polygon class="diagram-node-shape" points="0,${nodeHeight / 2} ${widthForNode / 2},0 ${widthForNode},${nodeHeight / 2} ${widthForNode / 2},${nodeHeight}"></polygon>`
          : `<rect class="diagram-node-shape" width="${widthForNode}" height="${nodeHeight}" rx="8"></rect>`;
      return `<g class="diagram-node diagram-node-${node.shape}" transform="translate(${position.x - widthForNode / 2} ${position.y})">
        ${shape}
        ${renderSvgText(node.label, widthForNode, nodeHeight)}
      </g>`;
    })
    .join('');

  return `<figure class="diagram-flowchart" data-direction="${escapeAttribute(parsed.direction)}" data-zoom="1">
    <div class="diagram-stage" data-base-width="${width}" data-base-height="${height}" style="--diagram-base-width: ${width}px; --diagram-base-height: ${height}px; --diagram-zoom: 1; width: ${width}px; height: ${height}px;">
      <svg role="img" aria-label="Flowchart diagram" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="flowchart-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="diagram-arrow"></path>
          </marker>
        </defs>
        ${edges}
        ${nodes}
      </svg>
    </div>
    <div class="diagram-toolbar" aria-label="流程图缩放控制">
      <button type="button" data-diagram-action="zoom-out" aria-label="缩小流程图">−</button>
      <span data-diagram-zoom>100%</span>
      <button type="button" data-diagram-action="zoom-in" aria-label="放大流程图">+</button>
      <button type="button" data-diagram-action="zoom-reset" aria-label="重置流程图缩放">↻</button>
      <button type="button" data-diagram-action="open" aria-label="放大查看流程图">⛶</button>
    </div>
  </figure>`;
}

function layoutFlowchart(parsed, { nodeHeight, verticalGap, horizontalGap, padding }) {
  const nodeWidths = new Map(parsed.nodes.map((node) => [node.id, getFlowchartNodeWidth(node)]));
  const ranks = rankFlowchartNodes(parsed);
  const maxRank = Math.max(...ranks.values(), 0);
  const layers = Array.from({ length: maxRank + 1 }, () => []);
  parsed.nodes.forEach((node) => {
    const rank = ranks.get(node.id) || 0;
    layers[rank].push(node);
  });

  const order = new Map(parsed.nodes.map((node, index) => [node.id, index]));
  const incoming = new Map(parsed.nodes.map((node) => [node.id, []]));
  parsed.edges.forEach((edge) => {
    incoming.get(edge.to)?.push(edge.from);
  });

  for (let index = 1; index < layers.length; index += 1) {
    layers[index].sort((a, b) => {
      const aParentOrder = average(incoming.get(a.id)?.map((id) => order.get(id)).filter(Number.isFinite));
      const bParentOrder = average(incoming.get(b.id)?.map((id) => order.get(id)).filter(Number.isFinite));
      return aParentOrder - bParentOrder || order.get(a.id) - order.get(b.id);
    });
    layers[index].forEach((node, nodeIndex) => order.set(node.id, nodeIndex));
  }

  const layerWidths = layers.map((layer) =>
    layer.reduce((total, node, index) => total + nodeWidths.get(node.id) + (index === 0 ? 0 : horizontalGap), 0),
  );
  const width = Math.max(920, Math.ceil(Math.max(...layerWidths, 0) + padding * 2));
  const positions = new Map();
  layers.forEach((layer, layerIndex) => {
    const layerWidth = layerWidths[layerIndex] || 0;
    let cursor = (width - layerWidth) / 2;
    layer.forEach((node) => {
      const widthForNode = nodeWidths.get(node.id);
      positions.set(node.id, {
        x: cursor + widthForNode / 2,
        y: padding + layerIndex * (nodeHeight + verticalGap),
      });
      cursor += widthForNode + horizontalGap;
    });
  });

  const height = padding * 2 + layers.length * nodeHeight + Math.max(0, layers.length - 1) * verticalGap;
  return { width, height, positions, nodeWidths };
}

function rankFlowchartNodes(parsed) {
  const ranks = new Map(parsed.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(parsed.nodes.map((node) => [node.id, []]));
  const indegree = new Map(parsed.nodes.map((node) => [node.id, 0]));

  parsed.edges.forEach((edge) => {
    outgoing.get(edge.from)?.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1);
  });

  const queue = parsed.nodes.filter((node) => (indegree.get(node.id) || 0) === 0).map((node) => node.id);
  if (!queue.length && parsed.nodes[0]) queue.push(parsed.nodes[0].id);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const target of outgoing.get(current) || []) {
      const nextRank = Math.max(ranks.get(target) || 0, (ranks.get(current) || 0) + 1);
      if (nextRank !== ranks.get(target)) {
        ranks.set(target, nextRank);
        queue.push(target);
      }
    }
  }

  return ranks;
}

function getFlowchartNodeWidth(node) {
  return Math.min(330, Math.max(142, visualLength(node.label) * 9 + 34));
}

function average(values = []) {
  if (!values.length) return Number.POSITIVE_INFINITY;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function parseFlowchart(code) {
  const nodes = new Map();
  const edges = [];
  let direction = 'TD';

  String(code)
    .split('\n')
    .map((line) => line.trim().replace(/;$/, ''))
    .filter(Boolean)
    .forEach((line) => {
      const header = line.match(/^(?:flowchart|graph)\s+(td|tb|bt|lr|rl)\b/i);
      if (header) {
        direction = header[1].toUpperCase();
        return;
      }

      const labeledEdge = line.match(/^(.+?)\s*-->\s*\|([^|]+)\|\s*(.+)$/);
      const plainEdge = line.match(/^(.+?)\s*-->\s*(.+)$/);
      const match = labeledEdge || plainEdge;
      if (!match) return;

      const from = parseFlowchartNode(match[1]);
      const to = parseFlowchartNode(labeledEdge ? match[3] : match[2]);
      if (!from || !to) return;

      rememberFlowchartNode(nodes, from);
      rememberFlowchartNode(nodes, to);
      edges.push({
        from: from.id,
        to: to.id,
        label: labeledEdge ? stripMermaidQuotes(match[2].trim()) : '',
      });
    });

  return {
    direction,
    nodes: [...nodes.values()],
    edges,
  };
}

function rememberFlowchartNode(nodes, node) {
  const existing = nodes.get(node.id);
  if (!existing) {
    nodes.set(node.id, node);
    return;
  }

  const nodeHasExplicitLabel = node.label !== node.id;
  const existingHasOnlyImplicitLabel = existing.label === existing.id;
  if (nodeHasExplicitLabel || existingHasOnlyImplicitLabel) {
    nodes.set(node.id, { ...existing, ...node });
  }
}

function parseFlowchartNode(value) {
  const expression = String(value).trim();
  const shaped = expression.match(/^([A-Za-z][\w-]*)\s*(\[\[|\[|\{|\()([\s\S]+?)(\]\]|\]|\}|\))$/);
  if (shaped) {
    return {
      id: shaped[1],
      label: stripMermaidQuotes(shaped[3]),
      shape: shaped[2] === '{' ? 'diamond' : 'rect',
    };
  }

  const plain = expression.match(/^([A-Za-z][\w-]*)$/);
  if (!plain) return null;
  return {
    id: plain[1],
    label: plain[1],
    shape: 'rect',
  };
}

function stripMermaidQuotes(value) {
  return String(value).trim().replace(/^["']|["']$/g, '');
}

function renderSvgText(label, width, height) {
  const lines = wrapSvgText(label, Math.max(8, Math.floor(width / 14)));
  if (lines.length === 1) {
    return `<text class="diagram-node-label" x="${width / 2}" y="${height / 2}" dominant-baseline="middle">${escapeHtml(lines[0])}</text>`;
  }

  const startY = height / 2 - (lines.length - 1) * 10;
  return `<text class="diagram-node-label" x="${width / 2}" y="${startY}">
    ${lines.map((line, index) => `<tspan x="${width / 2}" dy="${index === 0 ? 0 : 20}">${escapeHtml(line)}</tspan>`).join('')}
  </text>`;
}

function wrapSvgText(value, maxChars) {
  const text = String(value).trim();
  if (visualLength(text) <= maxChars) return [text];

  const chunks = [];
  let current = '';
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    const next = `${current}${part}`;
    if (current && visualLength(next) > maxChars) {
      chunks.push(current.trim());
      current = part.trimStart();
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks.slice(0, 3) : [text];
}

function visualLength(value) {
  return [...String(value)].reduce((total, char) => total + (/[\u4e00-\u9fff]/.test(char) ? 2 : 1), 0);
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function formatInline(value = '') {
  const tokens = [];
  const store = (html) => {
    const key = `\u0000${tokens.length}\u0000`;
    tokens.push(html);
    return key;
  };

  let text = String(value).replace(/`([^`]+)`/g, (_, code) => store(`<code>${escapeHtml(code)}</code>`));
  text = escapeHtml(text);

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    const safeSrc = sanitizeUrl(src);
    return safeSrc ? store(`<img src="${safeSrc}" alt="${escapeAttribute(alt)}">`) : _;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const safeHref = sanitizeUrl(href);
    return safeHref ? store(`<a href="${safeHref}" target="_blank" rel="noreferrer">${label}</a>`) : _;
  });

  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');

  return text.replace(/\u0000(\d+)\u0000/g, (_, tokenIndex) => tokens[Number(tokenIndex)]);
}

function stripMarkdown(value = '') {
  return String(value)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*(?:[-+*]|\d+\.)\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
}

function slugify(value = '') {
  const slug = String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return slug || 'section';
}

function sanitizeUrl(value = '') {
  const url = String(value).trim();
  if (/^(https?:|mailto:|#|\.{0,2}\/|[^:]+$)/i.test(url) && !/^javascript:/i.test(url)) {
    return escapeAttribute(url);
  }
  return '';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
