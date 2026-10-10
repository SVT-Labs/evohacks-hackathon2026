/**
 * Concept-map geometry, shared by the web diagram (components/ConceptMapDiagram.tsx)
 * and the PDF (components/ReportPDF.tsx), so both draw the same picture.
 *
 * Lecture nodes sit in a left column and interest nodes in a right column.
 * Edges between the columns are straight lines; edges inside a column bow
 * outwards, away from the other column. Every label is wrapped here because
 * SVG text does not wrap, and every edge label is placed near the middle of
 * its line where it does not cover a node or another label.
 *
 * Pure and dependency-free (type-only imports), so scripts/self-check.test.mjs
 * can run it under plain Node. Units are abstract: render with a viewBox of
 * `0 0 width height` and the picture scales to any size.
 */
import type { ConceptMap, NodeType } from "./types";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaidOutNode extends Box {
  id: string;
  type: NodeType;
  lines: string[];
  /** Horizontal centre of the text and the baseline of its first line. */
  textX: number;
  textY: number;
}

export interface LaidOutEdge {
  from: string;
  to: string;
  /** "cross" joins the columns, "column" stays in one, "loop" returns to its own node. */
  kind: "cross" | "column" | "loop";
  /** SVG path data for the line or curve. */
  path: string;
  /** Arrowhead triangle at the target end, as SVG polygon points. */
  arrow: string;
  /** The label's background box, its lines, and the centre and first baseline of the text. */
  label: Box & { lines: string[]; textX: number; textY: number };
}

export interface MapLayout {
  width: number;
  height: number;
  nodeFontSize: number;
  nodeLineHeight: number;
  edgeFontSize: number;
  edgeLineHeight: number;
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
}

// Geometry, in the layout's own units. The PDF draws it 515 units wide (node
// text about 9.7 pt, edge labels 8 pt) and the web page about 700 wide.
const WIDTH = 640;
const OUTER = 115; // room outside each column for the curves of within-column edges
const NODE_WIDTH = 140;
const LEFT_X = OUTER;
const RIGHT_X = WIDTH - OUTER - NODE_WIDTH;
const PAD = 14;
const NODE_GAP = 16;
const NODE_PAD_X = 8;
const NODE_PAD_Y = 8;

const NODE_FONT = 12;
const NODE_LINE = 15;
const EDGE_FONT = 10;
const EDGE_LINE = 12;
const LABEL_PAD_X = 4;
const LABEL_PAD_Y = 2;

/**
 * Average advance of a character as a share of the font size. DejaVu Sans, the
 * PDF font, is wide (about 0.55 em per letter on ordinary text); 0.6 leaves
 * margin, so a wrapped line never runs out of its box. The self-check measures
 * real DejaVu widths against it.
 */
const CHAR_EM = 0.6;

export const NODE_CHARS = Math.floor((NODE_WIDTH - 2 * NODE_PAD_X) / (NODE_FONT * CHAR_EM));
// Turkish words run long, so labels get as many characters as their space allows.
export const CROSS_LABEL_CHARS = 16;
export const COLUMN_LABEL_CHARS = 15;

/** Where on its line (0 = start, 1 = end) a label may sit, tried in order, to dodge others. */
const CROSS_POSITIONS = [0.5, 0.4, 0.6, 0.33, 0.67];
const CURVE_POSITIONS = [0.5, 0.35, 0.65, 0.25, 0.75];

/**
 * Curves inside a column bow out by one of these amounts. A cubic curve whose
 * two control points sit `b` out reaches 0.75 b, so even the smallest keeps a
 * centred label (at most 98 wide) off the nodes, and the largest keeps it
 * inside the outer margin.
 */
const BULGES = [68, 77, 86];

/**
 * Breaks `text` into lines of at most `maxChars` characters at spaces. A word
 * longer than a whole line is split with a hyphen, so no line can overflow its box.
 */
export function wrapLabel(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (let word of text.trim().split(/\s+/)) {
    while (word.length > maxChars) {
      if (line) lines.push(line);
      lines.push(`${word.slice(0, maxChars - 1)}-`);
      word = word.slice(maxChars - 1);
      line = "";
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const textWidth = (lines: string[], fontSize: number) =>
  Math.max(...lines.map((line) => line.length)) * fontSize * CHAR_EM;

/** Baseline of the first text line in a box whose text starts `padY` below `top`. */
const firstBaseline = (top: number, padY: number, font: number, line: number) =>
  top + padY + (line - font) / 2 + 0.85 * font;

type Point = { x: number; y: number };

/** A point at parameter t on a line (no control points) or a cubic curve. */
function pointAt(p0: Point, p3: Point, t: number, c?: [Point, Point]): Point {
  if (!c) return { x: p0.x + (p3.x - p0.x) * t, y: p0.y + (p3.y - p0.y) * t };
  const u = 1 - t;
  const [a, b, d, e] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: a * p0.x + b * c[0].x + d * c[1].x + e * p3.x,
    y: a * p0.y + b * c[0].y + d * c[1].y + e * p3.y,
  };
}

/** Area two boxes share, counting a 2-unit gap as touching; 0 when apart. */
export function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) + 2;
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) + 2;
  return w > 0 && h > 0 ? w * h : 0;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Arrowhead with its tip at `tip`, pointing away from `from`. */
function arrowhead(from: Point, tip: Point): string {
  const length = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const ux = (tip.x - from.x) / length;
  const uy = (tip.y - from.y) / length;
  const back = { x: tip.x - ux * 7, y: tip.y - uy * 7 };
  return [tip, { x: back.x - uy * 3.5, y: back.y + ux * 3.5 }, { x: back.x + uy * 3.5, y: back.y - ux * 3.5 }]
    .map((p) => `${round(p.x)},${round(p.y)}`)
    .join(" ");
}

/**
 * Stacks nodes top to bottom. A node may reserve a taller `slot` than itself
 * (room for a taller partner beside it) and is centred in it. With `targets`,
 * each node is pulled toward its target centre (its partner in the other
 * column) but never overlaps the node above it.
 */
function stack(
  nodes: { id: string; height: number }[],
  targets?: Map<string, number>,
  slots?: Map<string, number>,
): Map<string, number> {
  const tops = new Map<string, number>();
  let next = PAD;
  for (const node of nodes) {
    const slot = Math.max(node.height, slots?.get(node.id) ?? 0);
    const target = targets?.get(node.id);
    const top = Math.max(
      next + (slot - node.height) / 2,
      target === undefined ? 0 : target - node.height / 2,
    );
    tops.set(node.id, top);
    next = top - (slot - node.height) / 2 + slot + NODE_GAP;
  }
  return tops;
}

export function layoutConceptMap(map: ConceptMap): MapLayout {
  const sized = map.nodes.map((node) => {
    const lines = wrapLabel(node.label, NODE_CHARS);
    return { ...node, lines, height: lines.length * NODE_LINE + 2 * NODE_PAD_Y };
  });
  const lecture = sized.filter((node) => node.type === "lecture");
  const interest = sized.filter((node) => node.type === "interest");
  const typeOf = new Map(sized.map((node) => [node.id, node.type]));

  // The longer column sets the pace; the other one lines each node up with the
  // first partner it links to, which turns the "is like" edges (written first,
  // one per concept) into level lines. Averaging all partners instead lets one
  // extra edge drag a node out of order.
  const [primary, secondary] =
    interest.length > lecture.length ? [interest, lecture] : [lecture, interest];
  const primaryIds = new Set(primary.map((node) => node.id));
  const partner = new Map<string, string>(); // secondary id -> primary id
  for (const edge of map.edges) {
    for (const [mine, theirs] of [
      [edge.from, edge.to],
      [edge.to, edge.from],
    ]) {
      if (primaryIds.has(theirs) && !primaryIds.has(mine) && !partner.has(mine)) {
        partner.set(mine, theirs);
      }
    }
  }
  const slots = new Map<string, number>();
  for (const node of secondary) {
    const owner = partner.get(node.id);
    if (owner) slots.set(owner, Math.max(slots.get(owner) ?? 0, node.height));
  }
  const primaryTops = stack(primary, undefined, slots);
  const targets = new Map(
    [...partner].map(([id, owner]) => {
      const node = primary.find((p) => p.id === owner)!;
      return [id, primaryTops.get(owner)! + node.height / 2];
    }),
  );
  // Nodes without a partner keep their place in the list, after the one before them.
  let lastTarget = 0;
  const ordered = secondary
    .map((node) => {
      lastTarget = targets.get(node.id) ?? lastTarget + 0.001;
      return { node, key: lastTarget };
    })
    .sort((a, b) => a.key - b.key)
    .map(({ node }) => node);
  const secondaryTops = stack(ordered, targets);

  const nodes: LaidOutNode[] = sized.map((node) => {
    const x = node.type === "lecture" ? LEFT_X : RIGHT_X;
    const y = primaryTops.get(node.id) ?? secondaryTops.get(node.id)!;
    return {
      id: node.id,
      type: node.type,
      lines: node.lines,
      x,
      y,
      width: NODE_WIDTH,
      height: node.height,
      textX: x + NODE_WIDTH / 2,
      textY: firstBaseline(y, NODE_PAD_Y, NODE_FONT, NODE_LINE),
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const centreY = (node: LaidOutNode) => node.y + node.height / 2;

  const kinds: LaidOutEdge["kind"][] = map.edges.map((edge) =>
    edge.from === edge.to
      ? "loop"
      : typeOf.get(edge.from) === typeOf.get(edge.to)
        ? "column"
        : "cross",
  );

  // Edges between the columns meet a node on its inner side; edges inside a
  // column, and loops, on its outer side.
  const side = (node: LaidOutNode, kind: LaidOutEdge["kind"]) =>
    (kind === "cross") === (node.type === "lecture") ? "right" : "left";
  const sideX = (node: LaidOutNode, kind: LaidOutEdge["kind"]) =>
    side(node, kind) === "left" ? node.x : node.x + node.width;
  const outward = (node: LaidOutNode) => (node.type === "lecture" ? -1 : 1);

  // Spread the edge ends that meet one side of a node over its height, ordered
  // by where the other end is, so lines and arrowheads do not pile up.
  const ports = new Map<string, { edge: number; otherY: number }[]>();
  map.edges.forEach((edge, index) => {
    if (kinds[index] === "loop") return;
    const from = byId.get(edge.from)!;
    const to = byId.get(edge.to)!;
    for (const [node, other] of [
      [from, to],
      [to, from],
    ]) {
      const key = `${node.id}:${side(node, kinds[index])}`;
      ports.set(key, [...(ports.get(key) ?? []), { edge: index, otherY: centreY(other) }]);
    }
  });
  const portY = (node: LaidOutNode, kind: LaidOutEdge["kind"], edge: number) => {
    const list = [...(ports.get(`${node.id}:${side(node, kind)}`) ?? [])].sort(
      (a, b) => a.otherY - b.otherY || a.edge - b.edge,
    );
    const slot = list.findIndex((item) => item.edge === edge);
    return node.y + (node.height * (slot + 1)) / (list.length + 1);
  };

  // Curves inside a column take the smallest bulge whose vertical range they do
  // not share with another curve on that side, shortest spans first, so nested
  // curves stay apart.
  const bulge = new Map<number, number>();
  const used: { side: NodeType; track: number; top: number; bottom: number }[] = [];
  map.edges
    .map((edge, index) => {
      const a = centreY(byId.get(edge.from)!);
      const b = centreY(byId.get(edge.to)!);
      return { index, side: typeOf.get(edge.from)!, top: Math.min(a, b), bottom: Math.max(a, b) };
    })
    .filter(({ index }) => kinds[index] === "column")
    .sort((p, q) => p.bottom - p.top - (q.bottom - q.top) || p.top - q.top)
    .forEach((curve) => {
      const free = BULGES.findIndex(
        (_, track) =>
          !used.some(
            (u) =>
              u.side === curve.side && u.track === track && curve.top < u.bottom && u.top < curve.bottom,
          ),
      );
      const track = free === -1 ? BULGES.length - 1 : free;
      used.push({ ...curve, track });
      bulge.set(curve.index, BULGES[track]);
    });

  const shapes = map.edges.map((edge, index) => {
    const kind = kinds[index];
    const from = byId.get(edge.from)!;
    const to = byId.get(edge.to)!;
    const p0 = { x: sideX(from, kind), y: portY(from, kind, index) };
    const p3 = { x: sideX(to, kind), y: portY(to, kind, index) };
    let controls: [Point, Point] | undefined;
    if (kind === "column") {
      const out = outward(from) * bulge.get(index)!;
      controls = [
        { x: p0.x + out, y: p0.y },
        { x: p3.x + out, y: p3.y },
      ];
    } else if (kind === "loop") {
      const mid = centreY(from);
      const out = outward(from) * 30;
      p0.y = mid - 5;
      p3.y = mid + 5;
      controls = [
        { x: p0.x + out, y: mid - 20 },
        { x: p3.x + out, y: mid + 20 },
      ];
    }
    const lines = wrapLabel(edge.label, kind === "cross" ? CROSS_LABEL_CHARS : COLUMN_LABEL_CHARS);
    return {
      kind,
      p0,
      p3,
      controls,
      lines,
      width: textWidth(lines, EDGE_FONT) + 2 * LABEL_PAD_X,
      height: lines.length * EDGE_LINE + 2 * LABEL_PAD_Y,
    };
  });

  // A label box centred on its line at parameter t, kept where it may live:
  // labels between the columns stay in the middle gap (still on their line),
  // loop labels sit outside the loop, and everything stays on the canvas.
  const gapLeft = LEFT_X + NODE_WIDTH;
  const gapRight = RIGHT_X;
  const labelBox = (shape: (typeof shapes)[number], t: number): Box => {
    const { p0, p3, controls, width, height } = shape;
    let { x, y } = pointAt(p0, p3, t, controls);
    if (shape.kind === "cross") {
      const clamped = Math.min(Math.max(x, gapLeft + width / 2 + 2), gapRight - width / 2 - 2);
      if (clamped !== x) {
        y = p0.y + ((p3.y - p0.y) * (clamped - p0.x)) / (p3.x - p0.x);
        x = clamped;
      }
    } else if (shape.kind === "loop") {
      x = p0.x + Math.sign(controls![0].x - p0.x) * (24 + width / 2);
    }
    const left = Math.min(Math.max(x - width / 2, 1), WIDTH - width - 1);
    return { x: left, y: y - height / 2, width, height };
  };

  // Nodes may never be covered; one label touching another is the lesser evil.
  const taken: Box[] = nodes.map(({ x, y, width, height }) => ({ x, y, width, height }));
  const cost = (box: Box) =>
    taken.reduce((sum, other, i) => sum + overlapArea(box, other) * (i < nodes.length ? 100 : 1), 0);
  const boxes = new Map<number, Box>();
  // Lines between the columns have the least room, so their labels choose first.
  const placing = shapes
    .map((shape, index) => ({ shape, index }))
    .sort((a, b) => Number(a.shape.kind !== "cross") - Number(b.shape.kind !== "cross"));
  for (const { shape, index } of placing) {
    let best = labelBox(shape, 0.5);
    let bestCost = Infinity;
    for (const t of shape.kind === "cross" ? CROSS_POSITIONS : CURVE_POSITIONS) {
      const box = labelBox(shape, t);
      const boxCost = cost(box);
      if (boxCost < bestCost) [best, bestCost] = [box, boxCost];
      if (boxCost === 0) break;
    }
    taken.push(best);
    boxes.set(index, best);
  }

  const at = (p: Point) => `${round(p.x)} ${round(p.y)}`;
  const edges: LaidOutEdge[] = map.edges.map((edge, index) => {
    const { kind, p0, p3, controls, lines } = shapes[index];
    const box = boxes.get(index)!;
    return {
      from: edge.from,
      to: edge.to,
      kind,
      path: controls
        ? `M ${at(p0)} C ${at(controls[0])} ${at(controls[1])} ${at(p3)}`
        : `M ${at(p0)} L ${at(p3)}`,
      // The arrow follows the last stretch: from the second control point, or along the line.
      arrow: arrowhead(controls ? controls[1] : p0, p3),
      label: {
        ...box,
        lines,
        textX: box.x + box.width / 2,
        textY: firstBaseline(box.y, LABEL_PAD_Y, EDGE_FONT, EDGE_LINE),
      },
    };
  });

  const loopReach = kinds.includes("loop") ? 25 : 0;
  const bottom = Math.max(
    ...taken.map((box) => box.y + box.height),
    ...nodes.map((node) => node.y + node.height + loopReach),
  );
  return {
    width: WIDTH,
    height: Math.ceil(bottom + PAD),
    nodeFontSize: NODE_FONT,
    nodeLineHeight: NODE_LINE,
    edgeFontSize: EDGE_FONT,
    edgeLineHeight: EDGE_LINE,
    nodes,
    edges,
  };
}
