import type { Config } from "tailwindcss";

/** A colour token from app/globals.css, with Tailwind's opacity modifier support. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // "Bridge Symbols" covers the few science glyphs the text fonts lack (app/globals.css).
        serif: ["var(--font-serif)", "Bridge Symbols", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Bridge Symbols", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Bridge Symbols", "ui-monospace", "monospace"],
      },
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: token("card"),
        muted: token("muted"),
        border: token("border"),
        control: token("control"),
        lecture: token("lecture"),
        interest: token("interest"),
        "on-lecture": token("on-lecture"),
        "interest-ink": token("interest-ink"),
        highlight: token("highlight"),
        danger: token("danger"),
        success: token("success"),
      },
    },
  },
  plugins: [],
};
export default config;
