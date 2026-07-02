import assert from 'node:assert/strict';
import {
  buildExportHtml,
  extractHeadings,
  getDocumentStats,
  highlightSearch,
  renderMarkdown,
} from '../src/markdown.mjs';

const markdown = `# Project Notes

Intro with **bold**, *italic*, \`code\`, and [OpenAI](https://openai.com).

## Tasks

- [x] Read the document
- [ ] Polish the interface

> Keep writing tools quiet.

| Item | Status |
| --- | --- |
| Parser | Ready |

\`\`\`js
console.log('hello');
\`\`\`
`;

const html = renderMarkdown(markdown);

assert.match(html, /<h1 id="project-notes" data-heading-index="0">Project Notes<\/h1>/);
assert.match(html, /<strong>bold<\/strong>/);
assert.match(html, /<em>italic<\/em>/);
assert.match(html, /<code>code<\/code>/);
assert.match(html, /<a href="https:\/\/openai.com" target="_blank" rel="noreferrer">OpenAI<\/a>/);
assert.match(html, /type="checkbox" checked disabled/);
assert.match(html, /<blockquote>/);
assert.match(html, /<table>/);
assert.match(html, /<pre><code class="language-js">/);

assert.deepEqual(extractHeadings(markdown), [
  { level: 1, text: 'Project Notes', id: 'project-notes', lineIndex: 0, headingIndex: 0 },
  { level: 2, text: 'Tasks', id: 'tasks', lineIndex: 4, headingIndex: 1 },
]);

assert.deepEqual(getDocumentStats('One two\n\n# Heading'), {
  characters: 18,
  words: 3,
  headings: 1,
  lines: 3,
  readingMinutes: 1,
});

assert.match(highlightSearch('<p>Alpha beta alpha</p>', 'alpha'), /<mark>Alpha<\/mark> beta <mark>alpha<\/mark>/);
assert.doesNotMatch(highlightSearch('<p>Alpha beta alpha</p>', 'alpha', { caseSensitive: true }), /<mark>Alpha<\/mark>/);
assert.match(highlightSearch('<p>alpha alphabet alpha</p>', 'alpha', { wholeWord: true }), /<mark>alpha<\/mark> alphabet <mark>alpha<\/mark>/);
assert.match(highlightSearch('<p>A12 B34</p>', '[A-Z]\\d+', { useRegex: true }), /<mark>A12<\/mark> <mark>B34<\/mark>/);

const exported = buildExportHtml('Project Notes', renderMarkdown(markdown));
assert.match(exported, /<title>Project Notes<\/title>/);
assert.match(exported, /<aside class="export-outline" aria-label="文档目录">/);
assert.match(exported, /<a class="export-outline-link level-1" href="#project-notes">Project Notes<\/a>/);
assert.match(exported, /<a class="export-outline-link level-2" href="#tasks">Tasks<\/a>/);
assert.match(exported, /<main class="export-layout">/);
assert.match(exported, /<article class="markdown-body">/);

const flowchart = renderMarkdown(`\`\`\`
flowchart TD
  A["列表 list"] --> B{"点击新增"}
  B --> C["useLimitPreShipped 校验未发货非草稿数量"]
\`\`\``);

assert.match(flowchart, /<figure class="diagram-flowchart"/);
assert.match(flowchart, /<div class="diagram-stage"/);
assert.match(flowchart, /data-base-width="/);
assert.match(flowchart, /--diagram-zoom: 1/);
assert.match(flowchart, /<svg role="img"/);
assert.match(flowchart, />列表 list</);
assert.match(flowchart, />点击新增</);
assert.match(flowchart, /<polygon/);
assert.doesNotMatch(flowchart, /<pre><code/);

const branchedFlowchart = renderMarkdown(`\`\`\`
flowchart TD
  A["EnterGlobalPage"] --> B["DetectScene"]
  A --> C["SwitchLanguage"]
  B --> D["ReadKsherUserLanguage"]
  C --> E["SaveKsherUserLanguage"]
  D --> F["UpdateI18nLanguage"]
  E --> F
\`\`\``);
const nodePositions = [...branchedFlowchart.matchAll(/<g class="diagram-node [^"]+" transform="translate\(([-\d.]+) ([-\d.]+)\)">[\s\S]*?<text class="diagram-node-label"[\s\S]*?>(?:<tspan[^>]*>)?([^<]+)/g)]
  .reduce((positions, match) => {
    positions.set(match[3], { x: Number(match[1]), y: Number(match[2]) });
    return positions;
  }, new Map());

assert.equal(nodePositions.get('DetectScene').y, nodePositions.get('SwitchLanguage').y);
assert.notEqual(nodePositions.get('DetectScene').x, nodePositions.get('SwitchLanguage').x);
assert.ok(nodePositions.get('UpdateI18nLanguage').y > nodePositions.get('DetectScene').y);
assert.match(branchedFlowchart, /class="diagram-toolbar"/);
assert.match(branchedFlowchart, /data-diagram-action="zoom-in"/);

console.log('markdown tests passed');
