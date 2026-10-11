/**
 * The concept map drawn as an SVG diagram: lecture nodes on the left, interest
 * nodes on the right, labelled arrows between them.
 *
 * The geometry comes from lib/concept-map-layout.ts, which the PDF uses too, so
 * the page and the PDF show the same picture. Colours are Tailwind fill-/stroke-
 * classes on the theme tokens, so the map follows light and dark mode. The
 * <details> list below the picture is its text alternative.
 */
import { layoutConceptMap } from "@/lib/concept-map-layout";
import type { ReportLabels } from "@/lib/labels";
import type { ConceptMap } from "@/lib/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lecture focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const nodeClass = {
  lecture: "fill-lecture/[0.08] stroke-lecture",
  interest: "fill-interest/[0.08] stroke-interest",
};

export default function ConceptMapDiagram({ map, labels }: { map: ConceptMap; labels: ReportLabels }) {
  const layout = layoutConceptMap(map);
  const nodes = new Map(map.nodes.map((node) => [node.id, node]));

  const nodeName = (id: string) => {
    const node = nodes.get(id);
    return (
      <span className={`font-bold ${node?.type === "interest" ? "text-interest-ink" : "text-lecture"}`}>
        {node?.label}
      </span>
    );
  };

  return (
    <div>
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm border border-lecture bg-lecture/10" />
          {labels.legendLecture}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm border border-interest bg-interest/10" />
          {labels.legendInterest}
        </li>
      </ul>

      {/* On a phone the map scrolls sideways inside its frame instead of shrinking its text. */}
      <div
        id="concept-map-scroll"
        role="region"
        aria-label={labels.conceptMap}
        tabIndex={0}
        className={`mt-3 overflow-x-auto rounded-md border border-border bg-card p-3 sm:p-4 ${focusRing}`}
      >
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-labelledby="concept-map-title"
          className="h-auto w-full min-w-[600px]"
        >
          <title id="concept-map-title">{labels.conceptMap}</title>

          {layout.edges.map((edge, index) => (
            <path
              key={`edge-${index}`}
              d={edge.path}
              className="fill-none stroke-muted"
              strokeWidth={1.25}
              strokeDasharray={edge.kind === "cross" ? undefined : "4 3"}
            />
          ))}
          {layout.edges.map((edge, index) => (
            <polygon key={`arrow-${index}`} points={edge.arrow} className="fill-muted" />
          ))}

          {layout.nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={6}
                strokeWidth={1.5}
                className={nodeClass[node.type]}
              />
              {node.lines.map((line, i) => (
                <text
                  key={i}
                  x={node.textX}
                  y={node.textY + i * layout.nodeLineHeight}
                  textAnchor="middle"
                  fontSize={layout.nodeFontSize}
                  className="fill-foreground font-sans"
                >
                  {line}
                </text>
              ))}
            </g>
          ))}

          {layout.edges.map(({ label }, index) => (
            <g key={`label-${index}`}>
              <rect x={label.x} y={label.y} width={label.width} height={label.height} rx={3} className="fill-card" />
              {label.lines.map((line, i) => (
                <text
                  key={i}
                  x={label.textX}
                  y={label.textY + i * layout.edgeLineHeight}
                  textAnchor="middle"
                  fontSize={layout.edgeFontSize}
                  className="fill-muted font-sans"
                >
                  {line}
                </text>
              ))}
            </g>
          ))}
        </svg>
      </div>

      <details className="mt-4">
        <summary
          id="concept-map-list-toggle"
          className={`w-fit cursor-pointer rounded-sm text-sm font-bold text-lecture underline-offset-4 hover:underline ${focusRing}`}
        >
          {labels.mapAsList}
        </summary>
        <ul className="mt-3 space-y-2 leading-relaxed">
          {map.edges.map((edge, index) => (
            <li key={index}>
              {nodeName(edge.from)} <span className="text-muted">— {edge.label} →</span> {nodeName(edge.to)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
