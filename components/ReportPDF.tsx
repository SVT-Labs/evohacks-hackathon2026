/**
 * The downloadable A4 PDF of a report, drawn with @react-pdf/renderer.
 *
 * Browser-only: ReportView imports this module inside its download click
 * handler, so it may read `window` at load time to fetch the fonts from
 * public/fonts. The PDF always uses a light palette and DejaVu Sans, which has
 * the Turkish letters and science symbols (⇌, ₂) that the built-in Helvetica lacks.
 */
import {
  Document,
  Font,
  G,
  Page,
  Path,
  Polygon,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
  type Styles,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { layoutConceptMap } from "@/lib/concept-map-layout";
import { LABELS, formatReportDate, optionLetter, type ReportLabels } from "@/lib/labels";
import type { Concept, Report } from "@/lib/types";

const FONT = "DejaVu Sans";

Font.register({
  family: FONT,
  fonts: [
    { src: new URL("/fonts/DejaVuSans.ttf", window.location.origin).href, fontWeight: 400 },
    { src: new URL("/fonts/DejaVuSans-Bold.ttf", window.location.origin).href, fontWeight: 700 },
  ],
});
// The default hyphenation rules are English and split Turkish words wrongly.
Font.registerHyphenationCallback((word) => [word]);

// The web app's light palette (app/globals.css): ink blue for the lecture side,
// margin red for the interest side, highlighter yellow for where an analogy breaks.
const C = {
  ink: "#1b2433",
  muted: "#586170",
  lecture: "#1f4e8c",
  lectureTint: "#e9eff7",
  interest: "#b5432f",
  interestInk: "#9a3624",
  interestTint: "#f8ebe8",
  highlight: "#ffe78c",
  hairline: "#d6dad4",
  white: "#ffffff",
};

// A4 is 595 pt wide; 40 pt sides leave the 515 pt the concept-map layout is drawn for.
const SIDE = 40;
const MAP_WIDTH = 515;
const A4_HEIGHT = 841.89;
// Free height under the map page's heading and legend.
const MAP_MAX_HEIGHT = 640;

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 10.5,
    lineHeight: 1.5,
    color: C.ink,
    backgroundColor: C.white,
    paddingTop: 48,
    paddingHorizontal: SIDE,
    // Keeps text clear of the footer.
    paddingBottom: 72,
  },
  cover: { paddingTop: 64, paddingBottom: 64, paddingHorizontal: 56 },
  wordmarkText: { fontSize: 18, fontWeight: 700 },
  coverMain: { flexGrow: 1, justifyContent: "center" },
  coverRule: { width: 64, borderTopWidth: 1.5, borderTopColor: C.ink, marginBottom: 24 },
  coverTitle: { fontSize: 28, fontWeight: 700, lineHeight: 1.25 },
  coverInterest: { fontSize: 13, marginTop: 20, color: C.muted },
  coverInterestName: { fontWeight: 700, color: C.ink },
  coverDate: { marginTop: 6, color: C.muted },

  footer: {
    position: "absolute",
    left: SIDE,
    right: SIDE,
    // Anchored from the top: with `bottom`, react-pdf 4.9 places a box holding a
    // render-prop text (the page number) thousands of points above the page.
    top: A4_HEIGHT - 52,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.75,
    borderTopColor: C.hairline,
    paddingTop: 8,
    fontSize: 8.5,
    color: C.muted,
  },
  footerBrand: { fontWeight: 700 },

  eyebrow: { fontSize: 9, fontWeight: 700, color: C.lecture, marginBottom: 4 },
  h1: { fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 },
  sectionGap: { marginTop: 28 },
  label: { marginTop: 14, marginBottom: 3, fontSize: 9, fontWeight: 700, color: C.lecture },
  muted: { color: C.muted },

  strength: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  strengthDot: { width: 7, height: 7, borderRadius: 1, marginRight: 3, borderWidth: 0.75, borderColor: C.ink },
  strengthOn: { backgroundColor: C.ink },
  strengthText: { fontSize: 9, color: C.muted, marginLeft: 5 },

  // Each block below is two stacked Texts sharing one edge, so they read as one box.
  bridgeTitle: {
    marginTop: 18,
    paddingBottom: 4,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.35,
    color: C.interestInk,
  },
  breaksLabel: {
    marginTop: 14,
    paddingTop: 10,
    paddingBottom: 3,
    paddingHorizontal: 12,
    backgroundColor: C.highlight,
    fontSize: 9,
    fontWeight: 700,
  },
  breaksText: {
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: C.highlight,
  },

  legend: { flexDirection: "row", alignItems: "center", marginBottom: 16, fontSize: 9, color: C.muted },
  swatch: { width: 14, height: 10, borderRadius: 1.5, borderWidth: 1, marginRight: 6 },
  swatchLecture: { backgroundColor: C.lectureTint, borderColor: C.lecture },
  swatchInterest: { backgroundColor: C.interestTint, borderColor: C.interest, marginLeft: 18 },

  question: { marginBottom: 16 },
  questionText: { fontWeight: 700, marginBottom: 4 },
  row: { flexDirection: "row", marginTop: 2 },
  letter: { width: 18, fontWeight: 700, color: C.lecture },
  rowText: { flex: 1 },
  answer: { marginBottom: 12 },
  answerHead: { fontWeight: 700, marginBottom: 2 },
  step: { marginBottom: 8 },
});

type Style = Styles[string];
type WithLabels = { L: ReportLabels };

/** Every page but the cover: the content plus a footer repeated on each page it flows onto. */
function ContentPage({ L, children }: WithLabels & { children: ReactNode }) {
  return (
    <Page size="A4" style={s.page}>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerBrand}>Bridge</Text>
        <Text fixed render={({ pageNumber, totalPages }) => L.pageOf(pageNumber, totalPages)} />
      </View>
    </Page>
  );
}

/**
 * A label and its text. They are siblings in the page flow, not wrapped in a
 * View, because react-pdf ignores minPresenceAhead on a wrapper's first child,
 * which would let the label sit alone at the bottom of a page.
 */
function Field({ label, text, labelStyle = s.label, textStyle }: { label: string; text: string; labelStyle?: Style; textStyle?: Style }) {
  return (
    <>
      <Text style={labelStyle} minPresenceAhead={32}>
        {label}
      </Text>
      <Text style={textStyle}>{text}</Text>
    </>
  );
}

function ConceptPage({ L, concept, index, total }: WithLabels & { concept: Concept; index: number; total: number }) {
  return (
    <ContentPage L={L}>
      <Text style={s.eyebrow}>
        {L.concepts} {index + 1}/{total}
      </Text>
      <Text style={s.h1}>{concept.name}</Text>
      <View style={s.strength}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} style={n <= concept.strength ? [s.strengthDot, s.strengthOn] : s.strengthDot} />
        ))}
        <Text style={s.strengthText}>
          {L.strength} {concept.strength}/5
        </Text>
      </View>

      <Field label={L.inTheLecture} text={concept.lecture_explanation} />
      <Field label={concept.bridge_title} text={concept.bridge_explanation} labelStyle={s.bridgeTitle} />
      <Field label={L.analogy} text={concept.analogy} />
      <Field label={L.analogyBreaks} text={concept.analogy_limits} labelStyle={s.breaksLabel} textStyle={s.breaksText} />
      <Field label={L.example} text={concept.example} />
      <Field label={L.misconception} text={concept.misconception} />
    </ContentPage>
  );
}

function ConceptMapPage({ L, report }: WithLabels & { report: Report }) {
  const layout = layoutConceptMap(report.concept_map);
  const fullHeight = (layout.height * MAP_WIDTH) / layout.width;
  // A tall map shrinks to fit the page rather than being cut off by it.
  const scale = Math.min(1, MAP_MAX_HEIGHT / fullHeight);
  return (
    <ContentPage L={L}>
      <Text style={s.h1}>{L.conceptMap}</Text>
      <View style={s.legend}>
        <View style={[s.swatch, s.swatchLecture]} />
        <Text>{L.legendLecture}</Text>
        <View style={[s.swatch, s.swatchInterest]} />
        <Text>{L.legendInterest}</Text>
      </View>
      <Svg width={MAP_WIDTH * scale} height={fullHeight * scale} viewBox={`0 0 ${layout.width} ${layout.height}`}>
        {layout.edges.map((edge, i) => (
          <Path
            key={`edge-${i}`}
            d={edge.path}
            fill="none"
            stroke={C.muted}
            strokeWidth={1.25}
            {...(edge.kind === "cross" ? {} : { strokeDasharray: "4 3" })}
          />
        ))}
        {layout.edges.map((edge, i) => (
          <Polygon key={`arrow-${i}`} points={edge.arrow} fill={C.muted} />
        ))}
        {layout.nodes.map((node) => (
          <Rect
            key={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={6}
            fill={node.type === "lecture" ? C.lectureTint : C.interestTint}
            stroke={node.type === "lecture" ? C.lecture : C.interest}
            strokeWidth={1.2}
          />
        ))}
        {/* SVG text reads its font from props, which <G> passes down; without it, Helvetica drops Turkish letters. */}
        <G style={{ fontFamily: FONT, fontSize: layout.nodeFontSize }} fill={C.ink}>
          {layout.nodes.flatMap((node) =>
            node.lines.map((line, i) => (
              <Text key={`${node.id}-${i}`} x={node.textX} y={node.textY + i * layout.nodeLineHeight} textAnchor="middle">
                {line}
              </Text>
            )),
          )}
        </G>
        {layout.edges.map(({ label }, i) => (
          <Rect key={`label-${i}`} x={label.x} y={label.y} width={label.width} height={label.height} rx={3} fill={C.white} />
        ))}
        <G style={{ fontFamily: FONT, fontSize: layout.edgeFontSize }} fill={C.muted}>
          {layout.edges.flatMap(({ label }, e) =>
            label.lines.map((line, i) => (
              <Text key={`${e}-${i}`} x={label.textX} y={label.textY + i * layout.edgeLineHeight} textAnchor="middle">
                {line}
              </Text>
            )),
          )}
        </G>
      </Svg>
    </ContentPage>
  );
}

export default function ReportPDF({ report }: { report: Report }) {
  const L = LABELS[report.language];
  return (
    <Document title={report.title} author="Bridge" language={report.language}>
      <Page size="A4" style={[s.page, s.cover]}>
        <Text style={s.wordmarkText}>Bridge</Text>
        <View style={s.coverMain}>
          <View style={s.coverRule} />
          <Text style={s.coverTitle}>{report.title}</Text>
          <Text style={s.coverInterest}>
            {L.bridgedTo}: <Text style={s.coverInterestName}>{report.interest}</Text>
          </Text>
          <Text style={s.coverDate}>{formatReportDate(report.language)}</Text>
        </View>
      </Page>

      <ContentPage L={L}>
        <Text style={s.h1}>{L.summary}</Text>
        <Text>{report.summary}</Text>
      </ContentPage>

      {report.concepts.map((concept, index) => (
        <ConceptPage key={concept.id} L={L} concept={concept} index={index} total={report.concepts.length} />
      ))}

      <ConceptMapPage L={L} report={report} />

      <ContentPage L={L}>
        <Text style={s.h1}>{L.quiz}</Text>
        {report.quiz.map((q, i) => (
          <View key={i} style={s.question} wrap={false}>
            <Text style={s.questionText}>
              {i + 1}. {q.question}
            </Text>
            {q.options.map((option, j) => (
              <View key={j} style={s.row}>
                <Text style={s.letter}>{optionLetter(j)}</Text>
                <Text style={s.rowText}>{option}</Text>
              </View>
            ))}
          </View>
        ))}
      </ContentPage>

      <ContentPage L={L}>
        <Text style={s.h1}>{L.answerKey}</Text>
        {report.quiz.map((q, i) => (
          <View key={i} style={s.answer} wrap={false}>
            <Text style={s.answerHead}>
              {i + 1}. {optionLetter(q.answer_index)}: {q.options[q.answer_index]}
            </Text>
            <Text style={s.muted}>{q.explanation}</Text>
          </View>
        ))}

        <Text style={[s.h1, s.sectionGap]} minPresenceAhead={48}>
          {L.nextSteps}
        </Text>
        {report.next_steps.map((step, i) => (
          <View key={i} style={[s.row, s.step]} wrap={false}>
            <Text style={s.letter}>{i + 1}.</Text>
            <Text style={s.rowText}>{step}</Text>
          </View>
        ))}
      </ContentPage>
    </Document>
  );
}

/** The finished PDF file, ready to download or preview. */
export async function reportPdfBlob(report: Report): Promise<Blob> {
  return pdf(<ReportPDF report={report} />).toBlob();
}
