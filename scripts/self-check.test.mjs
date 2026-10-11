/**
 * Self-checks for the parts of Bridge that have no UI test: the sample reports,
 * the concept-map layout and the PDF font's glyph coverage.
 *
 * Run with `npm test`. Node 24 strips TypeScript types itself; the hook below
 * only maps the extensionless relative imports in lib/ ("./constants") to their
 * .ts files, which Node's ESM resolver will not guess.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const inProject = context.parentURL && !context.parentURL.includes("/node_modules/");
    if (inProject && /^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const { ReportSchema, describeIssues } = await import("../lib/types.ts");
const { SAMPLE_REPORT, SAMPLE_REPORT_TR } = await import("../lib/sample.ts");

test("both sample reports pass ReportSchema", () => {
  for (const [name, report] of Object.entries({ SAMPLE_REPORT, SAMPLE_REPORT_TR })) {
    const result = ReportSchema.safeParse(report);
    assert.ok(result.success, `${name}: ${result.success ? "" : describeIssues(result.error)}`);
  }
  assert.equal(SAMPLE_REPORT_TR.language, "tr");
});

const { layoutConceptMap, overlapArea, NODE_CHARS, CROSS_LABEL_CHARS, COLUMN_LABEL_CHARS } =
  await import("../lib/concept-map-layout.ts");
// fontkit comes with @react-pdf/renderer, which uses it to read these same files.
const fontkit = await import("fontkit");
const FONT_FILES = ["DejaVuSans.ttf", "DejaVuSans-Bold.ttf"];
const fonts = FONT_FILES.map((file) =>
  fontkit.openSync(fileURLToPath(new URL(`../public/fonts/${file}`, import.meta.url))),
);
const advance = (font, text, size) => (font.layout(text).advanceWidth / font.unitsPerEm) * size;

/** A dense map at the top of the range the prompt allows: 14 nodes, 20 edges, long labels. */
function denseMap() {
  const words = ["Equilibrium", "constant", "reaction", "quotient", "pressure", "temperature", "catalyst"];
  const nodes = [];
  for (let i = 1; i <= 7; i++) {
    nodes.push({ id: `l${i}`, type: "lecture", label: `${words[i - 1]} and its ${words[(i + 2) % 7]} effect` });
    nodes.push({ id: `i${i}`, type: "interest", label: `Pressing shape number ${i} under pressure` });
  }
  const edges = [];
  for (let i = 1; i <= 7; i++) edges.push({ from: `l${i}`, to: `i${i}`, label: "is like" });
  for (let i = 1; i <= 6; i++) edges.push({ from: `l${i + 1}`, to: `l${i}`, label: "depends on the" });
  for (let i = 1; i <= 4; i++) edges.push({ from: `i${i}`, to: `i${i + 2}`, label: "leads to a new" });
  edges.push({ from: "l1", to: "i4", label: "explains why teams" }, { from: "i7", to: "l2", label: "is quantified by" }, { from: "l5", to: "i2", label: "predicts" });
  return { nodes, edges };
}

const MAPS = {
  "English sample": SAMPLE_REPORT.concept_map,
  "Turkish sample": SAMPLE_REPORT_TR?.concept_map,
  "dense 14-node map": denseMap(),
  // A label wrapped to many lines on a top-row edge used to poke above the canvas.
  "map with a tall label at the top": {
    nodes: [
      { id: "a", type: "lecture", label: "Denge" },
      { id: "b", type: "interest", label: "Savunma" },
    ],
    edges: [{ from: "a", to: "b", label: "dengenin konumunu doğrudan belirleyen temel etkendir" }],
  },
  "map with a loop and one column": {
    nodes: [
      { id: "a", type: "lecture", label: "Entropy" },
      { id: "b", type: "lecture", label: "Second law of thermodynamics" },
    ],
    edges: [
      { from: "a", to: "a", label: "feeds back into itself" },
      { from: "b", to: "a", label: "constrains" },
    ],
  },
};

for (const [name, map] of Object.entries(MAPS)) {
  test(`concept-map layout stays readable: ${name}`, { skip: !map }, () => {
    const layout = layoutConceptMap(map);
    assert.equal(layout.nodes.length, map.nodes.length);
    assert.equal(layout.edges.length, map.edges.length);
    const inside = (box) =>
      box.x >= 0 && box.y >= 0 && box.x + box.width <= layout.width && box.y + box.height <= layout.height;
    const lectureRight = Math.max(...layout.nodes.filter((n) => n.type === "lecture").map((n) => n.x + n.width));
    for (const node of layout.nodes) {
      assert.ok(inside(node), `${node.id} is off the canvas`);
      if (node.type === "interest") assert.ok(node.x > lectureRight, `${node.id} is not in the right column`);
      for (const line of node.lines) {
        assert.ok(line.length <= NODE_CHARS, `node line too long: ${line}`);
        assert.ok(advance(fonts[0], line, layout.nodeFontSize) <= node.width - 16, `node line wider than its box: ${line}`);
      }
      for (const other of layout.nodes) {
        if (other !== node) assert.equal(overlapArea(node, other), 0, `${node.id} overlaps ${other.id}`);
      }
    }
    layout.edges.forEach((edge, index) => {
      const label = edge.label;
      assert.ok(inside(label), `label "${map.edges[index].label}" is off the canvas`);
      const limit = edge.kind === "cross" ? CROSS_LABEL_CHARS : COLUMN_LABEL_CHARS;
      for (const line of label.lines) {
        assert.ok(line.length <= limit, `edge line too long: ${line}`);
        assert.ok(advance(fonts[0], line, layout.edgeFontSize) <= label.width - 8, `edge line wider than its box: ${line}`);
      }
      for (const node of layout.nodes) {
        assert.equal(overlapArea(label, node), 0, `label "${map.edges[index].label}" covers node ${node.id}`);
      }
      if (edge.kind === "loop") {
        // The loop bows about 22 units out from its node; its label must sit beyond that, not on it.
        const node = layout.nodes.find((n) => n.id === edge.from);
        const clear = node.type === "lecture" ? label.x + label.width <= node.x - 22 : label.x >= node.x + node.width + 22;
        assert.ok(clear, `loop label "${map.edges[index].label}" covers its loop`);
      }
      layout.edges.slice(index + 1).forEach((other, j) => {
        assert.equal(overlapArea(label, other.label), 0, `labels "${map.edges[index].label}" and "${map.edges[index + 1 + j].label}" overlap`);
      });
    });
    // The PDF draws the map 515 wide under about 640 of free page height.
    assert.ok(layout.height * (515 / layout.width) <= 640, `map too tall for one A4 page: ${layout.height}`);
  });
}

test("the PDF fonts have a glyph for every character in the samples and labels", () => {
  const text = ["../lib/sample.ts", "../lib/labels.ts"]
    .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
    .join("");
  const codePoints = [...new Set([...text].map((char) => char.codePointAt(0)))].filter((cp) => cp > 31);
  fonts.forEach((font, i) => {
    const missing = codePoints.filter((cp) => !font.hasGlyphForCodePoint(cp));
    assert.deepEqual(missing.map((cp) => String.fromCodePoint(cp)), [], `${FONT_FILES[i]} lacks glyphs`);
  });
});

test("the form's character count matches the server's cleaned notes", async () => {
  const { serverLength } = await import("../lib/notes-length.ts");
  const { cleanText } = await import("../lib/notes.ts");
  const samples = [
    "  Chemical   equilibrium\r\n\r\n\r\n\r\nLe   Chatelier  ",
    "tabs\tand spaces \n \n line",
    "\u0000nul byte",
    SAMPLE_REPORT.summary,
    "",
  ];
  for (const raw of samples) assert.equal(serverLength(raw), cleanText(raw).length, JSON.stringify(raw));
});

