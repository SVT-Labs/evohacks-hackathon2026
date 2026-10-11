/**
 * The card shown when a Bridge link is shared: the wordmark, the promise, and
 * the three colours of the notebook look. Rendered once at build time.
 */
import { ImageResponse } from "next/og";

// The edge runtime with a bundled font URL is the documented pattern; the Node
// runtime fails at build time on Windows with "Invalid URL".
export const runtime = "edge";

export const alt = "Bridge: lecture notes, explained through what you love";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const serif = await fetch(new URL("./fonts/YoungSerif-Regular.ttf", import.meta.url)).then((r) => r.arrayBuffer());
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f6f6f3",
          color: "#1b2433",
          fontFamily: "Young Serif",
        }}
      >
        <div style={{ fontSize: 40 }}>Bridge</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Your lecture notes, explained through what you love.
          </div>
          <div style={{ display: "flex", marginTop: 40 }}>
            <div style={{ width: 120, height: 10, background: "#1f4e8c" }} />
            <div style={{ width: 120, height: 10, background: "#b5432f", marginLeft: 12 }} />
            <div style={{ width: 120, height: 10, background: "#ffe78c", marginLeft: 12 }} />
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Young Serif", data: serif, weight: 400, style: "normal" }] },
  );
}
